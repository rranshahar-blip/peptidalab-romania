#!/usr/bin/env python3
"""Static production-readiness checks for the generated PeptidaLab website."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

from lxml import html


ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://peptidalab.eu"
LOCALES = ("ro", "en", "pl", "hu", "bg", "nl")
FORM_NAMES = {
    "peptidalab-popup",
    "peptidalab-contact",
    "peptidalab-newsletter",
    "peptidalab-cart-order",
}


def page_locale(path: Path) -> str:
    first = path.relative_to(ROOT).parts[0]
    return first if first in LOCALES[1:] else "ro"


def expected_path(path: Path, locale: str) -> str:
    relative = path.relative_to(ROOT / locale) if locale != "ro" else path.relative_to(ROOT)
    if relative.name == "404.html":
        return f"/{locale}/404.html" if locale != "ro" else "/404.html"
    parent = relative.parent.as_posix()
    tail = "" if parent == "." else f"{parent}/"
    return f"/{locale}/{tail}" if locale != "ro" else f"/{tail}"


def resolves(url: str) -> bool:
    parsed = urlparse(url)
    path = unquote(parsed.path)
    if not path.startswith("/"):
        return True
    candidate = ROOT / path.lstrip("/")
    if path.endswith("/"):
        candidate = candidate / "index.html"
    return candidate.exists()


def main() -> None:
    failures: list[str] = []
    pages = [path for path in ROOT.rglob("*.html") if path.name != "__forms.html" and "scripts" not in path.parts]
    counts = {locale: 0 for locale in LOCALES}
    whatsapp_links = 0
    forms_seen: set[str] = set()

    for path in pages:
        locale = page_locale(path)
        counts[locale] += 1
        source = path.read_text(encoding="utf-8")
        if "ZXQ" in source:
            failures.append(f"{path.relative_to(ROOT)} contains an unresolved scientific-name token")
        if "peptidalab-romania-staging.netlify.app" in source:
            failures.append(f"{path.relative_to(ROOT)} still references the staging domain")
        if "wa.me/40752689342" in source:
            failures.append(f"{path.relative_to(ROOT)} still references the old WhatsApp number")
        if re.search(r"\[(EMAIL|TELEFON|PHONE|PROGRAM SUPORT|SUPPORT HOURS|ADRESĂ LEGALĂ|LEGAL ADDRESS|EMAIL BEFORE LAUNCH|EMAIL ÎNAINTE DE LANSARE)\]", source):
            failures.append(f"{path.relative_to(ROOT)} contains an obsolete public-contact placeholder")

        document = html.fromstring(source)
        if document.get("lang") != locale:
            failures.append(f"{path.relative_to(ROOT)} has lang={document.get('lang')!r}, expected {locale!r}")

        canonical = document.xpath("//link[@rel='canonical']/@href")
        target = f"{ORIGIN}{expected_path(path, locale)}"
        if canonical != [target]:
            failures.append(f"{path.relative_to(ROOT)} canonical mismatch: {canonical!r} != {target!r}")
        alternates = document.xpath("//link[@rel='alternate'][@hreflang]/@hreflang")
        if set(alternates) != set(LOCALES) | {"x-default"}:
            failures.append(f"{path.relative_to(ROOT)} has incomplete hreflang values")
        selectors = document.xpath("//select[@id='language-selector']/option")
        if len(selectors) != 6:
            failures.append(f"{path.relative_to(ROOT)} language selector has {len(selectors)} options")

        for form in document.xpath("//form[@name]"):
            name = form.get("name")
            forms_seen.add(name)
            if name not in FORM_NAMES:
                failures.append(f"{path.relative_to(ROOT)} has unexpected form {name!r}")
            if form.get("method", "").upper() != "POST" or form.get("action") != "/__forms.html":
                failures.append(f"{path.relative_to(ROOT)} form {name!r} has an invalid submission target")
            if form.get("data-netlify") != "true" or form.get("netlify-honeypot") != "bot-field":
                failures.append(f"{path.relative_to(ROOT)} form {name!r} lacks Netlify/honeypot configuration")
            hidden_name = form.xpath("./input[@name='form-name']/@value")
            for required in ("subject", "source_page", "language"):
                if not form.xpath(f"./input[@name='{required}']"):
                    failures.append(f"{path.relative_to(ROOT)} form {name!r} lacks {required}")
            if hidden_name != [name]:
                failures.append(f"{path.relative_to(ROOT)} form-name mismatch for {name!r}")
            if not form.xpath(".//*[@name='bot-field']"):
                failures.append(f"{path.relative_to(ROOT)} form {name!r} lacks the honeypot input")

        for href in document.xpath("//*[@href]/@href"):
            if href.startswith("https://wa.me/"):
                whatsapp_links += 1
                if not href.startswith("https://wa.me/447386546943"):
                    failures.append(f"{path.relative_to(ROOT)} has wrong WhatsApp link {href!r}")
            if href.startswith("/") and not resolves(href):
                failures.append(f"{path.relative_to(ROOT)} has broken internal link {href!r}")
        for src in document.xpath("//*[@src]/@src"):
            if src.startswith("/") and not resolves(src):
                failures.append(f"{path.relative_to(ROOT)} has broken asset {src!r}")

    for locale, count in counts.items():
        if count != 81:
            failures.append(f"Locale {locale} has {count} pages, expected 81")
    if forms_seen != FORM_NAMES:
        failures.append(f"Form set mismatch: {sorted(forms_seen)}")
    if whatsapp_links != len(pages):
        failures.append(f"Found {whatsapp_links} WhatsApp links for {len(pages)} pages")

    detector = html.fromstring((ROOT / "__forms.html").read_bytes())
    detected = set(detector.xpath("//form/@name"))
    if detected != FORM_NAMES:
        failures.append(f"__forms.html detector mismatch: {sorted(detected)}")

    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    if sitemap.count("<url>") != 480:
        failures.append(f"Sitemap contains {sitemap.count('<url>')} URLs, expected 480")
    if f"Sitemap: {ORIGIN}/sitemap.xml" not in (ROOT / "robots.txt").read_text(encoding="utf-8"):
        failures.append("robots.txt does not reference the production sitemap")

    for locale in LOCALES:
        suffix = "" if locale == "ro" else f"-{locale}"
        index = ROOT / "assets" / f"search-index{suffix}.json"
        try:
            records = json.loads(index.read_text(encoding="utf-8"))
        except Exception as exc:
            failures.append(f"Invalid {index.name}: {exc}")
            continue
        if len(records) != 80:
            failures.append(f"{index.name} contains {len(records)} entries, expected 80")

    print(f"HTML pages: {len(pages)} ({counts})")
    print(f"Forms: {sorted(forms_seen)}")
    print(f"WhatsApp links: {whatsapp_links}")
    print("Static validation:", "PASS" if not failures else "FAIL")
    for failure in failures:
        print("-", failure)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
