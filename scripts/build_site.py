#!/usr/bin/env python3
"""Build all six static locales and apply shared production corrections."""

from __future__ import annotations

import json
import re
from copy import deepcopy
from pathlib import Path
from urllib.parse import urlparse

from lxml import etree, html


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_ORIGIN = "https://peptidalab.eu"
STAGING_ORIGIN = "https://peptidalab-romania-staging.netlify.app"
CONTACT_EMAIL = "contact@peptidalab.eu"
WHATSAPP_URL = "https://wa.me/447386546943"

LOCALES = {
    "ro": {"name": "Română", "og": "ro_RO"},
    "en": {"name": "English", "og": "en_GB"},
    "pl": {"name": "Polski", "og": "pl_PL"},
    "hu": {"name": "Magyar", "og": "hu_HU"},
    "bg": {"name": "Български", "og": "bg_BG"},
    "nl": {"name": "Nederlands", "og": "nl_NL"},
}

LANGUAGE_LABEL = {
    "ro": "Schimbă limba",
    "en": "Change language",
    "pl": "Zmień język",
    "hu": "Nyelv módosítása",
    "bg": "Смяна на езика",
    "nl": "Taal wijzigen",
}

CONTACT_LABELS = {
    "ro": ("Date de contact", "Companie", "Email"),
    "en": ("Contact details", "Company", "Email"),
    "pl": ("Dane kontaktowe", "Firma", "E-mail"),
    "hu": ("Kapcsolattartási adatok", "Vállalat", "E-mail"),
    "bg": ("Данни за контакт", "Компания", "Имейл"),
    "nl": ("Contactgegevens", "Bedrijf", "E-mail"),
}

FORM_MESSAGES = {
    "ro": ("Mulțumim. Formularul a fost trimis cu succes.", "Formularul nu a putut fi trimis. Verifică conexiunea și încearcă din nou."),
    "en": ("Thank you. The form was submitted successfully.", "The form could not be submitted. Check your connection and try again."),
    "pl": ("Dziękujemy. Formularz został wysłany pomyślnie.", "Nie udało się wysłać formularza. Sprawdź połączenie i spróbuj ponownie."),
    "hu": ("Köszönjük. Az űrlap elküldése sikerült.", "Az űrlapot nem sikerült elküldeni. Ellenőrizze a kapcsolatot, és próbálja újra."),
    "bg": ("Благодарим ви. Формулярът беше изпратен успешно.", "Формулярът не можа да бъде изпратен. Проверете връзката си и опитайте отново."),
    "nl": ("Bedankt. Het formulier is succesvol verzonden.", "Het formulier kon niet worden verzonden. Controleer uw verbinding en probeer het opnieuw."),
}

HONEYPOT_LABEL = {
    "ro": "Nu completa acest câmp",
    "en": "Do not fill in this field",
    "pl": "Nie wypełniaj tego pola",
    "hu": "Ne töltse ki ezt a mezőt",
    "bg": "Не попълвайте това поле",
    "nl": "Vul dit veld niet in",
}

FORM_CONFIG = {
    "popup": {
        "name": "peptidalab-popup",
        "subject": "New PeptidaLab EU popup signup",
        "legacy": {"reducere-eligibila", "reducere-eligibila-en"},
    },
    "contact": {
        "name": "peptidalab-contact",
        "subject": "New PeptidaLab EU contact request",
        "legacy": {"contact", "contact-en"},
    },
    "newsletter": {
        "name": "peptidalab-newsletter",
        "subject": "New PeptidaLab EU newsletter signup",
        "legacy": {"newsletter", "newsletter-en"},
    },
    "cart": {
        "name": "peptidalab-cart-order",
        "subject": "New PeptidaLab EU cart or order request",
        "legacy": {"solicitare-eligibilitate", "solicitare-eligibilitate-en"},
    },
}

FIELD_NAMES = {
    "organizatie": "organisation",
    "organisation": "organisation",
    "nume": "name",
    "name": "name",
    "subiect": "subject_area",
    "subject": "subject_area",
    "mesaj": "message",
    "message": "message",
    "confidentialitate": "privacy_consent",
    "privacy": "privacy_consent",
    "consimtamant": "marketing_consent",
    "consent": "marketing_consent",
    "cui": "vat_id",
    "vat-id": "vat_id",
    "tara": "country",
    "country": "country",
    "contact": "contact_name",
    "functie": "role",
    "role": "role",
    "telefon": "phone",
    "phone": "phone",
    "adresa-facturare": "billing_address",
    "billing-address": "billing_address",
    "adresa-livrare": "delivery_address",
    "delivery-address": "delivery_address",
    "produse": "products",
    "products": "products",
    "scop-cercetare": "research_purpose",
    "research-purpose": "research_purpose",
    "documente": "documents",
    "documents": "documents",
    "cod-promotional": "promotional_code",
    "promotional-code": "promotional_code",
    "declaratie-ruo": "ruo_declaration",
    "ruo-declaration": "ruo_declaration",
    "confirmare": "request_confirmation",
    "confirmation": "request_confirmation",
}


def normalise(value: str) -> str:
    return " ".join(value.split())


def translated_text(value: str | None, translations: dict[str, str] | None) -> str | None:
    if value is None or translations is None:
        return value
    key = normalise(value)
    if not key or key not in translations:
        return value
    leading = re.match(r"^\s*", value).group(0)
    trailing = re.search(r"\s*$", value).group(0)
    return f"{leading}{translations[key]}{trailing}"


def locale_path(relative: Path, locale: str) -> str:
    if relative.name == "404.html":
        prefix = "" if locale == "ro" else f"/{locale}"
        return f"{prefix}/404.html"
    parent = relative.parent.as_posix()
    suffix = "" if parent == "." else f"{parent}/"
    prefix = "/" if locale == "ro" else f"/{locale}/"
    return f"{prefix}{suffix}"


def output_path(relative: Path, locale: str) -> Path:
    return ROOT / relative if locale == "ro" else ROOT / locale / relative


def form_type(name: str) -> str | None:
    for key, config in FORM_CONFIG.items():
        if name in config["legacy"] or name == config["name"]:
            return key
    return None


def hidden_input(name: str, value: str) -> etree._Element:
    return etree.Element("input", type="hidden", name=name, value=value)


def ensure_forms(document: etree._Element, locale: str, page_path: str) -> None:
    success, error = FORM_MESSAGES[locale]
    for form in document.xpath("//form[@name]"):
        kind = form_type(form.get("name", ""))
        if not kind:
            continue
        config = FORM_CONFIG[kind]
        form.set("name", config["name"])
        form.set("method", "POST")
        form.set("action", "/__forms.html")
        form.set("data-netlify", "true")
        form.set("netlify-honeypot", "bot-field")
        form.set("data-form-type", kind)
        form.set("data-success", success)
        form.set("data-error", error)

        for field in form.xpath(".//*[@name]"):
            old_name = field.get("name")
            if old_name in FIELD_NAMES:
                field.set("name", FIELD_NAMES[old_name])
            if field.tag == "input" and field.get("type") == "checkbox" and not field.get("value"):
                field.set("value", "yes")

        for old in form.xpath("./input[@type='hidden']"):
            if old.get("name") in {"form-name", "source_page", "language", "subject", "bot-field"}:
                form.remove(old)

        form.insert(0, hidden_input("form-name", config["name"]))
        form.insert(1, hidden_input("subject", config["subject"]))
        form.insert(2, hidden_input("source_page", page_path))
        form.insert(3, hidden_input("language", locale))

        trap = etree.Element("p", attrib={"class": "honeypot", "aria-hidden": "true"})
        label = etree.SubElement(trap, "label")
        label.text = HONEYPOT_LABEL[locale]
        etree.SubElement(label, "input", name="bot-field", tabindex="-1", autocomplete="off")
        form.insert(4, trap)


def rebuild_language_selector(document: etree._Element, relative: Path, locale: str) -> None:
    matches = document.xpath("//*[contains(concat(' ', normalize-space(@class), ' '), ' language-switch ')]")
    if not matches:
        return
    container = matches[0]
    container.clear()
    container.set("class", "language-switch")
    label = etree.SubElement(container, "label", attrib={"class": "sr-only", "for": "language-selector"})
    label.text = LANGUAGE_LABEL[locale]
    select = etree.SubElement(container, "select", id="language-selector", attrib={"class": "language-select", "aria-label": LANGUAGE_LABEL[locale]})
    for code, config in LOCALES.items():
        attrs = {"value": locale_path(relative, code), "lang": code}
        if code == locale:
            attrs["selected"] = "selected"
        option = etree.SubElement(select, "option", **attrs)
        option.text = config["name"]


def replace_contact_panel(document: etree._Element, relative: Path, locale: str) -> None:
    if relative.as_posix() != "contact/index.html":
        return
    matches = document.xpath("//section[contains(concat(' ', normalize-space(@class), ' '), ' form-layout ')]/aside")
    if not matches:
        return
    aside = matches[0]
    callouts = aside.xpath("./div[contains(concat(' ', normalize-space(@class), ' '), ' legal-callout ')]")
    saved = deepcopy(callouts[0]) if callouts else None
    aside.clear()
    heading, company_label, email_label = CONTACT_LABELS[locale]
    etree.SubElement(aside, "h2").text = heading
    company = etree.SubElement(aside, "p")
    etree.SubElement(company, "strong").text = f"{company_label}:"
    company[-1].tail = " PEPTIDALAB EU"
    email = etree.SubElement(aside, "p")
    etree.SubElement(email, "strong").text = f"{email_label}:"
    email[-1].tail = " "
    etree.SubElement(email, "a", href=f"mailto:{CONTACT_EMAIL}").text = CONTACT_EMAIL
    if saved is not None:
        aside.append(saved)


def replace_footer_contact(document: etree._Element) -> None:
    for block in document.xpath("//*[contains(concat(' ', normalize-space(@class), ' '), ' company-placeholder ')]"):
        block.clear()
        block.set("class", "company-placeholder company-contact")
        etree.SubElement(block, "strong").text = "PEPTIDALAB EU"
        block[-1].tail = " · "
        etree.SubElement(block, "a", href=f"mailto:{CONTACT_EMAIL}").text = CONTACT_EMAIL


def update_metadata(document: etree._Element, relative: Path, locale: str) -> None:
    page_path = locale_path(relative, locale)
    canonical_url = f"{PRODUCTION_ORIGIN}{page_path}"
    head = document.xpath("//head")[0]

    canonical = document.xpath("//link[@rel='canonical']")
    if canonical:
        canonical[0].set("href", canonical_url)
    else:
        etree.SubElement(head, "link", rel="canonical", href=canonical_url)

    for alternate in document.xpath("//link[@rel='alternate'][@hreflang]"):
        alternate.getparent().remove(alternate)
    for code in LOCALES:
        etree.SubElement(head, "link", rel="alternate", hreflang=code, href=f"{PRODUCTION_ORIGIN}{locale_path(relative, code)}")
    etree.SubElement(head, "link", rel="alternate", hreflang="x-default", href=f"{PRODUCTION_ORIGIN}{locale_path(relative, 'ro')}")

    for meta in document.xpath("//meta[@property='og:url']"):
        meta.set("content", canonical_url)
    for meta in document.xpath("//meta[@property='og:locale']"):
        meta.set("content", LOCALES[locale]["og"])
    for meta in document.xpath("//meta[@property='og:image'] | //meta[@name='twitter:image']"):
        value = meta.get("content", "").replace(STAGING_ORIGIN, PRODUCTION_ORIGIN)
        meta.set("content", value)

    for script in document.xpath("//script[@type='application/ld+json']"):
        if script.text:
            script.text = script.text.replace(STAGING_ORIGIN, PRODUCTION_ORIGIN).replace('"name":"PeptidaLab EU"', '"name":"PEPTIDALAB EU"')


def translate_document(document: etree._Element, translations: dict[str, str]) -> None:
    for element in document.iter():
        if element.tag not in {"script", "style"}:
            element.text = translated_text(element.text, translations)
            element.tail = translated_text(element.tail, translations)
        for attribute in ("aria-label", "placeholder", "alt", "title"):
            if element.get(attribute):
                element.set(attribute, translated_text(element.get(attribute), translations) or element.get(attribute))
        if element.tag == "meta":
            key = element.get("name") or element.get("property")
            if key in {"description", "og:title", "og:description", "og:image:alt", "twitter:title", "twitter:description", "twitter:image:alt"}:
                element.set("content", translated_text(element.get("content"), translations) or element.get("content", ""))


def localise_internal_links(document: etree._Element, locale: str) -> None:
    if locale in {"ro", "en"}:
        return
    for element in document.xpath("//*[@href or @action]"):
        for attribute in ("href", "action"):
            value = element.get(attribute)
            if not value:
                continue
            value = value.replace(f"{PRODUCTION_ORIGIN}/en/", f"{PRODUCTION_ORIGIN}/{locale}/")
            if value == "/en":
                value = f"/{locale}"
            elif value.startswith("/en/"):
                value = f"/{locale}/{value[4:]}"
            element.set(attribute, value)


def apply_shared_replacements(document: etree._Element, locale: str) -> None:
    for element in document.iter():
        for attribute, value in list(element.attrib.items()):
            new_value = value.replace(STAGING_ORIGIN, PRODUCTION_ORIGIN)
            if "wa.me/" in new_value:
                new_value = re.sub(r"https://wa\.me/[^?\"']+", WHATSAPP_URL, new_value)
            element.set(attribute, new_value)
        if element.tag not in {"script", "style"}:
            if element.text:
                element.text = re.sub(r"\[(?:EMAIL|EMAIL BEFORE LAUNCH|EMAIL ÎNAINTE DE LANSARE|ACCESSIBILITY EMAIL|EMAIL ACCESIBILITATE|EDITORIAL EMAIL|EMAIL EDITORIAL)\]", CONTACT_EMAIL, element.text)
            if element.tail:
                element.tail = re.sub(r"\[(?:EMAIL|EMAIL BEFORE LAUNCH|EMAIL ÎNAINTE DE LANSARE|ACCESSIBILITY EMAIL|EMAIL ACCESIBILITATE|EDITORIAL EMAIL|EMAIL EDITORIAL)\]", CONTACT_EMAIL, element.tail)
    for script in document.xpath("//script"):
        if script.text:
            script.text = script.text.replace(STAGING_ORIGIN, PRODUCTION_ORIGIN)


def build_page(source: Path, relative: Path, locale: str, translations: dict[str, str] | None) -> None:
    parser = html.HTMLParser(encoding="utf-8")
    document = html.fromstring(source.read_bytes(), parser=parser)
    document.set("lang", locale)
    if translations:
        translate_document(document, translations)
    localise_internal_links(document, locale)
    apply_shared_replacements(document, locale)
    rebuild_language_selector(document, relative, locale)
    replace_contact_panel(document, relative, locale)
    replace_footer_contact(document)
    update_metadata(document, relative, locale)
    ensure_forms(document, locale, locale_path(relative, locale))

    for script in document.xpath("//script[@src]"):
        if script.get("src", "").startswith("/assets/app.js"):
            script.set("src", "/assets/app.js?v=20260907-1")
    for link in document.xpath("//link[@rel='stylesheet']"):
        if link.get("href", "").startswith("/assets/styles.css"):
            link.set("href", "/assets/styles.css?v=20260907-1")

    destination = output_path(relative, locale)
    destination.parent.mkdir(parents=True, exist_ok=True)
    rendered = "<!doctype html>" + html.tostring(document, encoding="unicode", method="html")
    destination.write_text(rendered, encoding="utf-8")


def build_forms_detector() -> None:
    fields = {
        "peptidalab-popup": ["email", "organisation"],
        "peptidalab-contact": ["name", "email", "organisation", "subject_area", "message", "privacy_consent"],
        "peptidalab-newsletter": ["email", "marketing_consent"],
        "peptidalab-cart-order": ["organisation", "vat_id", "country", "contact_name", "role", "email", "phone", "billing_address", "delivery_address", "products", "research_purpose", "documents", "promotional_code", "ruo_declaration", "request_confirmation", "privacy_consent"],
    }
    subjects = {config["name"]: config["subject"] for config in FORM_CONFIG.values()}
    body = ["<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex,nofollow\"><title>Netlify Forms detector</title></head><body hidden>"]
    for name, names in fields.items():
        body.append(f'<form name="{name}" method="POST" data-netlify="true" netlify-honeypot="bot-field">')
        body.append(f'<input type="hidden" name="form-name" value="{name}">')
        body.append(f'<input type="hidden" name="subject" value="{subjects[name]}">')
        body.append('<input type="hidden" name="source_page"><input type="hidden" name="language"><input name="bot-field">')
        for field in names:
            body.append(f'<input name="{field}">')
        body.append("</form>")
    body.append("</body></html>\n")
    (ROOT / "__forms.html").write_text("".join(body), encoding="utf-8")


def build_search_index(locale: str, relatives: list[Path]) -> None:
    entries = []
    type_labels = {
        "ro": ("Produs", "Articol", "Pagină"),
        "en": ("Product", "Article", "Page"),
        "pl": ("Produkt", "Artykuł", "Strona"),
        "hu": ("Termék", "Cikk", "Oldal"),
        "bg": ("Продукт", "Статия", "Страница"),
        "nl": ("Product", "Artikel", "Pagina"),
    }
    product_label, article_label, page_label = type_labels[locale]
    for relative in relatives:
        if relative.name == "404.html":
            continue
        path = output_path(relative, locale)
        document = html.fromstring(path.read_bytes())
        title = normalise(document.xpath("string(//title)")).split(" | ")[0]
        description = document.xpath("string(//meta[@name='description']/@content)")
        rel = relative.as_posix()
        kind = product_label if rel.startswith("produs/") else article_label if rel.startswith("articole/") and rel != "articole/index.html" else page_label
        entries.append({"title": title, "text": description, "url": locale_path(relative, locale), "type": kind})
    suffix = "" if locale == "ro" else f"-{locale}"
    (ROOT / "assets" / f"search-index{suffix}.json").write_text(json.dumps(entries, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def build_sitemap(relatives: list[Path]) -> None:
    urls = []
    for relative in relatives:
        if relative.name == "404.html":
            continue
        for locale in LOCALES:
            path = locale_path(relative, locale)
            urls.append(f"<url><loc>{PRODUCTION_ORIGIN}{path}</loc></url>")
    content = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "".join(urls) + "</urlset>\n"
    (ROOT / "sitemap.xml").write_text(content, encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {PRODUCTION_ORIGIN}/sitemap.xml\n", encoding="utf-8")


def main() -> None:
    ro_files = sorted(path for path in ROOT.rglob("*.html") if path.relative_to(ROOT).parts[0] not in {"en", "pl", "hu", "bg", "nl", "scripts"} and path.name != "__forms.html")
    relatives = [path.relative_to(ROOT) for path in ro_files]
    en_files = {path.relative_to(ROOT / "en"): path for path in (ROOT / "en").rglob("*.html")}
    if set(relatives) != set(en_files):
        missing_en = sorted(str(path) for path in set(relatives) - set(en_files))
        missing_ro = sorted(str(path) for path in set(en_files) - set(relatives))
        raise SystemExit(f"Locale route mismatch. Missing EN: {missing_en}; missing RO: {missing_ro}")

    translations = {
        locale: json.loads((ROOT / "scripts" / "translations" / f"{locale}.json").read_text(encoding="utf-8"))
        for locale in ("pl", "hu", "bg", "nl")
    }

    for relative in relatives:
        build_page(ROOT / relative, relative, "ro", None)
        build_page(ROOT / "en" / relative, relative, "en", None)
        for locale in ("pl", "hu", "bg", "nl"):
            build_page(ROOT / "en" / relative, relative, locale, translations[locale])

    build_forms_detector()
    for locale in LOCALES:
        build_search_index(locale, relatives)
    build_sitemap(relatives)
    print(f"Built {len(relatives)} routes × {len(LOCALES)} locales ({len(relatives) * len(LOCALES)} HTML pages)")


if __name__ == "__main__":
    main()
