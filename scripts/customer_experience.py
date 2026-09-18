"""Shared customer-facing cleanup, applied to both existing and rebuilt pages."""
import re
import json
from pathlib import Path
from lxml import html, etree
from customer_form import STATUSES

EMAIL = {'ro':'Email', 'en':'Email', 'pl':'E-mail', 'hu':'E-mail', 'bg':'Имейл', 'nl':'E-mail'}
COPY = json.loads(Path(__file__).with_name('customer-copy.json').read_text(encoding='utf-8'))

def finish_content(document, locale):
    c = COPY[locale]
    # These edits become the EN input of future locale builds; localize them too.
    localized={value:c[key] for key,value in COPY['en'].items()}
    for el in document.iter():
        if el.tag in ('script','style'):continue
        if el.text and el.text.strip() in localized:el.text=localized[el.text.strip()]
        if el.tail and el.tail.strip() in localized:el.tail=' '+localized[el.tail.strip()]
    canonical = document.xpath('string(//link[@rel="canonical"]/@href)')
    def put(node, text):
        for child in list(node): node.remove(child)
        node.text = text
    def section_paragraphs(route):
        return document.xpath('//section[@class="legal-copy"]/p') if '/' + route + '/' in canonical else []
    def replace_paragraphs(route, replacements):
        ps = section_paragraphs(route)
        for index, key in replacements.items():
            if len(ps)>index: put(ps[index], c[key] if key in c else key)
    # The name is a trading identity supplied by the owner, not an invented legal entity.
    identity = 'PEPTIDALAB EUROPE · contact@peptidalab.eu'
    discount_suffix={'ro':' reducere după verificare','en':' discount after verification','pl':' zniżki po weryfikacji','hu':' kedvezmény az ellenőrzés után','bg':' отстъпка след проверка','nl':' korting na verificatie'}
    for title in document.xpath('//*[@id="discount-title"]'):
        put(title,'')
        percent=etree.SubElement(title,'span',attrib={'class':'discount-percent'})
        percent.text='10%';percent.tail=discount_suffix[locale]
    for alert in document.xpath('//p[@class="legal-alert"]'): alert.getparent().remove(alert)
    replace_paragraphs('termeni-conditii', {0:identity,1:'platform',3:'images',4:'price',7:'rights'})
    replace_paragraphs('confidentialitate', {0:identity,1:'data',3:'providers',4:'retention',6:'security'})
    replace_paragraphs('livrare-retururi', {0:'delivery',1:'receipt',2:'returns'})
    replace_paragraphs('politica-editoriala', {1:'authors'})
    replace_paragraphs('accesibilitate', {1:'accessibility'})
    replace_paragraphs('cookie-uri', {0:'cookie_intro'})
    replace_paragraphs('declinarea-responsabilitatii', {4:'platform'})
    if '/livrare-retururi/' in canonical:
        for p in document.xpath('//section[@class="page-hero"]/p'): put(p,c['delivery'])
    if '/despre-noi/' in canonical:
        for p in document.xpath('//section[@class="page-hero"]/p'): put(p,c['about'])
        for p in document.xpath('//main/section[@class="section"]//p'): put(p,identity)
        for box in document.xpath('//main/section[@class="section"]//div[@class="placeholder-box"]'):put(box,identity)
    for span in document.xpath('//section[contains(@class,"legal-hero")]/span'):
        put(span,c['current'])
    if '/livrare-retururi/' in canonical:
        for span in document.xpath('//section[@class="page-hero"]/span'):put(span,c['current'])
    for caption in document.xpath('//main//figcaption | //div[contains(@class,"product-gallery")]/p'):
        put(caption,c['images'])
    for span in document.xpath('//section[contains(concat(" ",@class," ")," intro ")]//span[@class="eyebrow"]'):
        put(span,'PEPTIDALAB EUROPE')
    if '/solicita-oferta/' in canonical:
        for h in document.xpath('//section[@class="page-hero"]/h1'): put(h,c['order_title'])
        for p in document.xpath('//section[@class="page-hero"]/p'): put(p,c['order_intro'])
    # Remove empty technical rows rather than inventing scientific or batch values.
    for dd in document.xpath('//main//dd[contains(text(),"[")]'):
        parent=dd.getparent(); dt=dd.getprevious()
        if dt is not None and dt.tag=='dt': parent.remove(dt)
        parent.remove(dd)
    for dl in document.xpath('//main//dl[not(*)]'):
        parent=dl.getparent()
        if parent.tag=='article' and all(x.tag in ('h2','dl') for x in parent): parent.getparent().remove(parent)
        else: parent.remove(dl)
    for row in document.xpath('//div[@class="price-box"]/div'):
        if any(value in STATUSES for value in row.xpath('./strong/text()')):
            row.getparent().remove(row)
    for button in document.xpath('//main//button[@disabled][contains(@class,"disabled")]'):
        parent=button.getparent()
        if parent.tag=='article':
            for p in parent.xpath('./p'): put(p,c['coa'])
            button.tag='a';button.attrib.pop('disabled',None);button.set('class','button ghost');button.set('href','mailto:contact@peptidalab.eu');put(button,c['documentation'])
    for p in document.xpath('//main//p[contains(text(),"placeholder") or contains(text(),"Placeholdere")]'): put(p,c['coa'])
    for strip in document.xpath('//section[@class="delivery-strip"]'):
        strong=strip.xpath('./div/strong')
        if len(strong)==3:put(strong[1],c['payment']);put(strong[2],'contact@peptidalab.eu')
    for span in document.xpath('//div[@class="footer-bottom"]/span'):put(span,'© 2026 PEPTIDALAB EUROPE')
    for el in document.xpath('//main//*[not(*)][contains(translate(text(),"STAGING","staging"),"staging")]'):
        put(el,c['current'] if el.tag in ('span','h2') else c['platform'])
    for td in document.xpath('//td[text()="pl_interest"]'):put(td,'pl_cart')
    old_proceed=('Continuă către comandă','Proceed to order','Przejdź do zamówienia','Tovább a megrendeléshez','Продължете към поръчка','Doorgaan naar bestelling')
    for a in document.xpath('//a'):
        if a.text in old_proceed:put(a,c['proceed'])
    return document

def polish_page(source, locale):
    source = re.sub(r'PeptidaLab EU\b', 'PEPTIDALAB EUROPE', source, flags=re.I)
    # Keep the original page layout and modify only individual form fragments.
    def clean_form(match):
        form = html.fromstring(match[0])
        for field in form.xpath('.//*[@name="organisation" or @name="organization" or @name="organizatie"]'):
            parent = field.getparent()
            target = parent if parent.tag == 'label' else field
            target.getparent().remove(target)
        for row in form.xpath('.//div[@class="form-row"]'):
            if not len(row): row.getparent().remove(row)
        # Older builds duplicated honeypots and renamed notification subjects.
        for extra in form.xpath('.//*[@name="bot-field"]')[1:]:
            trap = extra
            while trap.getparent() is not None and trap.getparent() is not form and trap.tag != 'p':
                trap = trap.getparent()
            trap.getparent().remove(trap)
        for field in form.xpath('.//input[@type="hidden"][@name="subject_area"]'):
            field.getparent().remove(field)
        for field in form.xpath('.//input[@type="email"]'):
            if field.getparent().tag == 'label': field.getparent().text = EMAIL[locale]
        if form.get('data-form-type') == 'cart':
            form.set('data-success', COPY[locale]['order_success'])
            form.set('data-sent-label', COPY[locale]['sent'])
            for button in form.xpath('.//button[@type="submit"]'): button.text=COPY[locale]['submit']
        elif form.get('data-form-type') == 'popup':
            form.set('data-success',COPY[locale]['email_success'])
        return html.tostring(form, encoding='unicode', method='html')
    source = re.sub(r'<form\b[^>]*name="peptidalab-[^"]+".*?</form>', clean_form, source, flags=re.S)
    # Render the percentage in a familiar font and keep the close icon separate.
    source = re.sub(r'(<h2 id="discount-title">)10%', r'\1<span class="discount-percent">10%</span>', source)
    source = re.sub(r'/assets/(app\.js|styles\.css)\?v=[^"\s]+', r'/assets/\1?v=20260918-1', source)
    document = html.fromstring(source)
    finish_content(document, locale)
    return '<!doctype html>' + html.tostring(document,encoding='unicode',method='html')
