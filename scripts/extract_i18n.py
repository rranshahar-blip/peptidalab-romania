#!/usr/bin/env python3
"""Extract unique English user-facing strings for static locale generation."""

from __future__ import annotations

import json
import re
from pathlib import Path

from lxml import html


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "en"
OUTPUT = ROOT / "scripts" / "i18n-source.json"

TRANSLATABLE_ATTRIBUTES = ("aria-label", "placeholder", "alt", "title")
META_KEYS = {
    "description",
    "og:title",
    "og:description",
    "og:image:alt",
    "twitter:title",
    "twitter:description",
    "twitter:image:alt",
}


def normalise(value: str) -> str:
    return " ".join(value.split())


def should_translate(value: str) -> bool:
    value = normalise(value)
    if not value or value in {"×", "−", "+", "WA"}:
        return False
    if re.fullmatch(r"[\d\s.,%+–—:/()-]+", value):
        return False
    return True


def add(value: str | None, output: list[str], seen: set[str]) -> None:
    if value is None:
        return
    value = normalise(value)
    if should_translate(value) and value not in seen:
        seen.add(value)
        output.append(value)


def main() -> None:
    strings: list[str] = []
    seen: set[str] = set()
    parser = html.HTMLParser(encoding="utf-8")

    for path in sorted(SOURCE_ROOT.rglob("*.html")):
        document = html.fromstring(path.read_bytes(), parser=parser)

        for element in document.iter():
            if element.tag not in {"script", "style"}:
                add(element.text, strings, seen)
                add(element.tail, strings, seen)

            for attribute in TRANSLATABLE_ATTRIBUTES:
                add(element.get(attribute), strings, seen)

            if element.tag == "meta":
                key = element.get("name") or element.get("property")
                if key in META_KEYS:
                    add(element.get("content"), strings, seen)

    OUTPUT.write_text(
        json.dumps(strings, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Extracted {len(strings)} strings to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
