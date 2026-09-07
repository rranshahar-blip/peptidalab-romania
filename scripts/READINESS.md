# PeptidaLab EU implementation checkpoint — 2026-09-07

## Implemented locally; deployment verification pending

- Static HTML site: 81 routes in each of ro, en, pl, hu, bg and nl (486 pages).
- Four normalized Netlify forms: peptidalab-popup, peptidalab-contact, peptidalab-newsletter and peptidalab-cart-order.
- Root __forms.html detector, URL-encoded submissions, honeypot, source page/language, real response-dependent status, retry preserving inputs and duplicate-in-flight prevention.
- Public contact presentation: PEPTIDALAB EU and contact@peptidalab.eu. WhatsApp destination: https://wa.me/447386546943.
- Six-language selector, translated static pages/search indexes, canonical URLs, hreflang and sitemap.
- Modal focus handling and keyboard trapping; the research gate is not dismissed by Escape.

## Tests completed locally

- python scripts/build_site.py: 486 pages generated.
- python scripts/validate_site.py: PASS; six locale sets, forms, internal destinations, assets, metadata, sitemap and WhatsApp mapping.
- node --check assets/app.js: PASS.
- git diff --check: PASS.
- No package.json/TypeScript project or existing package-based lint/test suite was found. These checks do not constitute browser, accessibility or translation-quality certification.

## Critical launch blockers

- Legal/controller identity, registered address and other unresolved legal-policy placeholders require owner-supplied information and qualified review. The trading name alone is not verified legal-entity information.
- Batch/COA and other product-documentation placeholders remain where supporting information was not supplied. No batch claims have been invented.
- All four deployed forms still require controlled submission and dashboard verification.
- Notification configuration for contact@peptidalab.eu and actual inbox receipt are separate outstanding checks. The connected Netlify operations do not expose notification configuration.
- Full deployed cart, six-language, responsive and accessibility testing is pending.

## Important improvements / review

- Four new translation dictionaries were machine-assisted with protected scientific identifiers; native-language editorial/legal review remains pending. Key coverage alone does not prove naturalness or accuracy.
- Confirm marketing-consent scope and retention, especially the promotional popup; do not treat a popup enquiry as blanket permission to send marketing.
- Confirm all intended replacement vial images against owner-approved assets.
- Verify social previews, external links, security headers, cookie behaviour and production performance in the deployed environment.

## Owner/account steps

In the connected Netlify project, configure form-submission email notifications for each of the four named forms to contact@peptidalab.eu. Confirm receipt of clearly marked test messages. Do not use inbox passwords or one-time codes in source code or chat.

Status: NOT YET APPROVED FOR ADVERTISING. This checkpoint is not a completed production-readiness audit.
