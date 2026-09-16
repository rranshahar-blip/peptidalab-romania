"""Apply the scoped customer form and product availability changes in every locale."""
import re

COPY = {
    'ro': ('Prenume', 'Nume de familie', 'Verificarea datelor de contact.', 'Introdu prenumele.', 'Introdu numele de familie.'),
    'en': ('First name', 'Last name', 'Verification of contact details.', 'Enter your first name.', 'Enter your last name.'),
    'pl': ('Imię', 'Nazwisko', 'Weryfikacja danych kontaktowych.', 'Podaj imię.', 'Podaj nazwisko.'),
    'hu': ('Keresztnév', 'Vezetéknév', 'A kapcsolattartási adatok ellenőrzése.', 'Adja meg a keresztnevét.', 'Adja meg a vezetéknevét.'),
    'bg': ('Име', 'Фамилия', 'Проверка на данните за контакт.', 'Въведете собственото си име.', 'Въведете фамилията си.'),
    'nl': ('Voornaam', 'Achternaam', 'Controle van de contactgegevens.', 'Vul uw voornaam in.', 'Vul uw achternaam in.'),
}
STATUSES = ('Disponibil la cerere', 'Available on enquiry', 'Dostępne na zapytanie', 'Érdeklődni', 'Предлага се при запитване', 'Op aanvraag leverbaar')
REMOVED = ('organisation', 'vat_id', 'contact_name', 'role', 'research_purpose', 'documents')

def simplify_page(source, locale):
    for status in STATUSES:
        source = re.sub(r'<span class="status">\s*' + re.escape(status) + r'\s*</span>', '', source)
    first, last, next_step, first_error, last_error = COPY[locale]
    def update_form(match):
        form = match.group(0)
        if 'name="first_name"' not in form:
            fields = ('<div class="form-row">'
                      f'<label>{first}<input required name="first_name" autocomplete="given-name" data-required-message="{first_error}"></label>'
                      f'<label>{last}<input required name="last_name" autocomplete="family-name" data-required-message="{last_error}"></label></div>')
            form = re.sub(r'<label>[^<]*<input[^>]*name="organisation"[^>]*></label>', lambda _: fields, form, count=1)
        for name in REMOVED:
            form = re.sub(r'<label>[^<]*<(input|textarea|select)\b[^>]*name="' + name + r'"[^>]*>(?:.*?</\1>)?</label>', '', form, flags=re.S)
        for name, label, message in [('first_name', first, first_error), ('last_name', last, last_error)]:
            form = re.sub(r'<label>[^<]*(<input[^>]*name="' + name + r'"[^>]*>)</label>', lambda m: '<label>' + label + re.sub(r'data-required-message="[^"]*"', 'data-required-message="' + message + '"', m[1]) + '</label>', form)
        form = re.sub(r'<div class="form-row">\s*</div>', '', form)
        # A country selector no longer needs a half-empty two-column row.
        form = re.sub(r'<div class="form-row">(<label>[^<]*<select[^>]*name="country".*?</select></label>)</div>', r'\1', form, flags=re.S)
        return form
    source = re.sub(r'<form\b[^>]*name="peptidalab-cart-order".*?</form>', update_form, source, flags=re.S)
    if 'name="first_name"' in source and 'class="form-layout quote"' in source:
        # Replace only the two follow-up steps referring to the removed fields.
        source = re.sub(r'(<aside><h2>[^<]*</h2><ol>)<li>.*?</li><li>.*?</li>', lambda m: m[1] + '<li>' + next_step + '</li>', source, count=1, flags=re.S) if next_step not in source else source
    return source
