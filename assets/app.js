const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const storage={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const isEn=document.documentElement.lang==='en',langRoot=isEn?'/en':'';
const ui=isEn?{added:'Added ✓',add:'Add to list',emptyTitle:'Your list is empty',emptyText:'Add products from the catalogue. The information remains only in your browser.',explore:'Explore the catalogue',confirm:'Concentration and quantity are confirmed in the form.',remove:'Remove',concentration:'concentration: [select]',quantity:'quantity: [complete]',noResults:'No results.',sending:'Sending…'}:{added:'Adăugat ✓',add:'Adaugă la listă',emptyTitle:'Lista este goală',emptyText:'Adaugă produse din catalog. Informația rămâne doar în browser.',explore:'Explorează catalogul',confirm:'Concentrația și cantitatea se confirmă în formular.',remove:'Elimină',concentration:'concentrație: [de ales]',quantity:'cantitate: [de completat]',noResults:'Niciun rezultat.',sending:'Se trimite…'};
$$('.language-switch a').forEach(a=>a.addEventListener('click',()=>storage.set('pl_lang',a.hreflang||'ro')));

function setBodyLock(){document.body.classList.toggle('modal-open',!!$('.modal:not([hidden])'))}
function show(el){if(el){el.hidden=false;setBodyLock()}}
function hide(el){if(el){el.hidden=true;setBodyLock()}}

const menu=$('.menu-toggle'),nav=$('.site-header nav');
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});

const gate=$('#research-gate'),gateAge=$('#gate-age'),gateRuo=$('#gate-ruo'),gateGo=$('#gate-continue');
if(gate&&!storage.get('pl_gate',false)) show(gate);
function gateState(){if(gateGo) gateGo.disabled=!(gateAge.checked&&gateRuo.checked)}
gateAge?.addEventListener('change',gateState);gateRuo?.addEventListener('change',gateState);
gateGo?.addEventListener('click',()=>{storage.set('pl_gate',true);hide(gate);window.setTimeout(()=>{if(!storage.get('pl_discount_seen',false)){show($('#discount-modal'));storage.set('pl_discount_seen',true)}},1600)});

const discount=$('#discount-modal');
$('.modal-close',discount)?.addEventListener('click',()=>hide(discount));

const cookie=$('.cookie-banner');
if(cookie&&!storage.get('pl_cookie',null)) cookie.hidden=false;
function closeCookie(value){storage.set('pl_cookie',value);if(cookie){cookie.hidden=true;cookie.style.display='none'}}
$$('[data-cookie]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();closeCookie(b.dataset.cookie)}));
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-cookie]');if(b)closeCookie(b.dataset.cookie)});
$('.cookie-settings')?.addEventListener('click',()=>{if(cookie){cookie.hidden=false;cookie.style.display='flex'}});

let interest=storage.get('pl_interest',[]);
function syncCount(){$$('[data-cart-count]').forEach(x=>x.textContent=interest.length)}
function saveInterest(){storage.set('pl_interest',interest);syncCount();renderInterest();fillQuote()}
$$('.add-interest').forEach(b=>b.addEventListener('click',()=>{if(!interest.some(x=>x.slug===b.dataset.product))interest.push({slug:b.dataset.product,name:b.dataset.name});saveInterest();b.textContent=ui.added;setTimeout(()=>b.textContent=ui.add,1500)}));
function renderInterest(){const wrap=$('#interest-items');if(!wrap)return;if(!interest.length){wrap.innerHTML=`<div class="placeholder-box"><h2>${ui.emptyTitle}</h2><p>${ui.emptyText}</p><a class="button ghost" href="${langRoot}/produse/">${ui.explore}</a></div>`;return}wrap.innerHTML=interest.map(x=>`<article class="interest-row"><div><h3>${escapeHtml(x.name)}</h3><span>${ui.confirm}</span></div><button data-remove="${escapeHtml(x.slug)}">${ui.remove}</button></article>`).join('');$$('[data-remove]',wrap).forEach(b=>b.addEventListener('click',()=>{interest=interest.filter(x=>x.slug!==b.dataset.remove);saveInterest()}))}
$('#clear-interest')?.addEventListener('click',()=>{interest=[];saveInterest()});
function fillQuote(){const q=$('#quote-products');if(q&&interest.length&&!q.value)q.value=interest.map(x=>`${x.name} — ${ui.concentration} — ${ui.quantity}`).join('\n')}
syncCount();renderInterest();fillQuote();

$$('.chip').forEach(ch=>ch.addEventListener('click',()=>{$$('.chip',ch.parentElement).forEach(x=>x.classList.remove('selected'));ch.classList.add('selected')}));

const grid=$('#product-grid'),catalogSearch=$('#catalog-search'),catFilter=$('#category-filter'),concFilter=$('#concentration-filter'),sortFilter=$('#sort-filter');
function filterCatalog(){if(!grid)return;const q=(catalogSearch?.value||'').trim().toLowerCase(),cat=catFilter?.value||'all',conc=concFilter?.value||'all';let cards=$$('.product-card',grid);cards.forEach(c=>{const yes=(!q||(c.dataset.name+' '+c.dataset.concentration).includes(q))&&(cat==='all'||c.dataset.category===cat)&&(conc==='all'||c.dataset.concentration.includes(conc));c.hidden=!yes});cards=cards.filter(c=>!c.hidden);cards.sort((a,b)=>a.dataset.name.localeCompare(b.dataset.name,isEn?'en':'ro')*(sortFilter?.value==='za'?-1:1)).forEach(c=>grid.appendChild(c));if($('#catalog-count'))$('#catalog-count').textContent=cards.length;if($('#no-results'))$('#no-results').hidden=!!cards.length}
[catalogSearch,catFilter,concFilter,sortFilter].forEach(el=>el?.addEventListener(el===catalogSearch?'input':'change',filterCatalog));
$('.mobile-filter')?.addEventListener('click',()=>$('.filters')?.classList.toggle('open'));

const searchPanel=$('.search-panel'),searchInput=$('#site-search'),searchResults=$('#search-results');let searchData=[];
$('.search-open')?.addEventListener('click',async()=>{show(searchPanel);searchInput?.focus();if(!searchData.length){try{searchData=await fetch(isEn?'/assets/search-index-en.json':'/assets/search-index.json').then(r=>r.json())}catch{searchData=[]}}});
$('.search-close')?.addEventListener('click',()=>hide(searchPanel));
searchInput?.addEventListener('input',()=>{const locale=isEn?'en':'ro',q=searchInput.value.trim().toLocaleLowerCase(locale);if(q.length<2){searchResults.innerHTML='';return}const hits=searchData.filter(x=>(x.title+' '+x.text).toLocaleLowerCase(locale).includes(q)).slice(0,8);searchResults.innerHTML=hits.length?hits.map(x=>`<a class="search-result" href="${x.url}"><span>${escapeHtml(x.type)}</span><strong>${escapeHtml(x.title)}</strong></a>`).join(''):`<p>${ui.noResults}</p>`});

document.addEventListener('keydown',e=>{if(e.key==='Escape'){$$('.modal:not([hidden])').forEach(hide);hide(searchPanel)}});
$$('form').forEach(f=>f.addEventListener('submit',()=>{const submit=$('[type="submit"]',f);if(submit){submit.disabled=true;submit.textContent=ui.sending}}));
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

/* Unified PeptidaLab vial mockups.
   The site switches automatically once the approved master photograph exists at:
   /assets/products/peptidalab-master-vial.png
   Until then the existing product images remain untouched. */
const PL_VIAL_MASTER='/assets/products/peptidalab-master-vial.png?v=20260901-1';
const PL_VIALS={
'retatrutide-10mg-vial-premium.png':{name:'RETATRUTIDE',strength:'10 mg',category:'METABOLIC & MITOCHONDRIAL RESEARCH',lot:'RTD10-092601',net:'10 mg / vial'},
'retatrutide-20mg-vial-premium.png':{name:'RETATRUTIDE',strength:'20 mg',category:'METABOLIC & MITOCHONDRIAL RESEARCH',lot:'RTD20-092602',net:'20 mg / vial'},
'mots-c-10mg-vial-premium.png':{name:'MOTS-C',strength:'10 mg',category:'METABOLIC & MITOCHONDRIAL RESEARCH',lot:'MOT10-092603',net:'10 mg / vial'},
'nad-plus-500mg-vial-premium.png':{name:'NAD+',strength:'500 mg',category:'METABOLIC & MITOCHONDRIAL RESEARCH',lot:'NAD500-092604',net:'500 mg / vial'},
'nad-plus-1000mg-vial-premium.png':{name:'NAD+',strength:'1.000 mg',category:'METABOLIC & MITOCHONDRIAL RESEARCH',lot:'NAD1000-092605',net:'1.000 mg / vial'},
'ss-31-elamipretide-10mg-vial-premium.png':{name:'SS-31 (ELAMIPRETIDE)',strength:'10 mg',category:'METABOLIC & MITOCHONDRIAL RESEARCH',lot:'SS3110-092606',net:'10 mg / vial'},
'tesamorelin-10mg-vial-premium.png':{name:'TESAMORELIN',strength:'10 mg',category:'METABOLIC & MITOCHONDRIAL RESEARCH',lot:'TES10-092607',net:'10 mg / vial'},
'hgh-fragment-176-191-5mg-vial-premium.png':{name:'HGH FRAGMENT 176–191',strength:'5 mg',category:'METABOLIC & MITOCHONDRIAL RESEARCH',lot:'HGF5-092608',net:'5 mg / vial'},
'skin-glow-ghk-cu-50mg-vial-premium.png':{name:'SKIN GLOW (GHK-CU)',strength:'50 mg',category:'REGENERATIVE & TISSUE RESEARCH',lot:'GHK50-092609',net:'50 mg / vial'},
'skin-glow-ghk-cu-100mg-vial-premium.png':{name:'SKIN GLOW (GHK-CU)',strength:'100 mg',category:'REGENERATIVE & TISSUE RESEARCH',lot:'GHK100-092610',net:'100 mg / vial'},
'bpc-157-5mg-vial-premium.png':{name:'BPC-157',strength:'5 mg',category:'REGENERATIVE & TISSUE RESEARCH',lot:'BPC5-092611',net:'5 mg / vial'},
'bpc-157-10mg-vial-premium.png':{name:'BPC-157',strength:'10 mg',category:'REGENERATIVE & TISSUE RESEARCH',lot:'BPC10-092612',net:'10 mg / vial'},
'tb-500-5mg-vial-premium.png':{name:'TB-500',strength:'5 mg',category:'REGENERATIVE & TISSUE RESEARCH',lot:'TB5-092613',net:'5 mg / vial'},
'tb-500-10mg-vial-premium.png':{name:'TB-500',strength:'10 mg',category:'REGENERATIVE & TISSUE RESEARCH',lot:'TB10-092614',net:'10 mg / vial'},
'glow-bpc-ghk-cu-tb-500-vial-premium.png':{name:'GLOW',strength:'BPC-157 10 mg + GHK-Cu 50 mg + TB-500 5 mg',category:'REGENERATIVE & TISSUE RESEARCH',lot:'GLOW-092615',net:'BPC-157 10 mg + GHK-Cu 50 mg + TB-500 5 mg / vial',blend:true},
'klow-bpc-ghk-cu-tb-500-kpv-vial-premium.png':{name:'KLOW',strength:'BPC-157 10 mg + GHK-Cu 50 mg + TB-500 10 mg + KPV 10 mg',category:'REGENERATIVE & TISSUE RESEARCH',lot:'KLOW-092616',net:'BPC-157 10 mg + GHK-Cu 50 mg + TB-500 10 mg + KPV 10 mg / vial',blend:true},
'cjc-1295-no-dac-10mg-vial-premium.png':{name:'CJC-1295 NO DAC',strength:'10 mg',category:'ENDOCRINE & GROWTH FACTOR RESEARCH',lot:'CJC10-092617',net:'10 mg / vial'},
'ipamorelin-10mg-vial-premium.png':{name:'IPAMORELIN',strength:'10 mg',category:'ENDOCRINE & GROWTH FACTOR RESEARCH',lot:'IPA10-092618',net:'10 mg / vial'},
'hgh-somatropin-10iu-vial-premium.png':{name:'HGH (SOMATROPIN)',strength:'10 IU',category:'ENDOCRINE & GROWTH FACTOR RESEARCH',lot:'HGH10-092619',net:'10 IU / vial'},
'igf-1-lr3-1mg-vial-premium.png':{name:'IGF-1 LR3',strength:'1 mg',category:'ENDOCRINE & GROWTH FACTOR RESEARCH',lot:'IGF1-092620',net:'1 mg / vial'},
'pt-141-10mg-vial-premium.png':{name:'PT-141',strength:'10 mg',category:'ENDOCRINE & GROWTH FACTOR RESEARCH',lot:'PT141-092621',net:'10 mg / vial'},
'ac-semax-nh2-10mg-vial-premium.png':{name:'AC-SEMAX-NH₂',strength:'10 mg',category:'NEUROBIOLOGICAL & SLEEP RESEARCH',lot:'SEMAX10-092622',net:'10 mg / vial'},
'ac-selank-nh2-10mg-vial-premium.png':{name:'AC-SELANK-NH₂',strength:'10 mg',category:'NEUROBIOLOGICAL & SLEEP RESEARCH',lot:'SELANK10-092623',net:'10 mg / vial'},
'dsip-10mg-vial-premium.png':{name:'DSIP',strength:'10 mg',category:'NEUROBIOLOGICAL & SLEEP RESEARCH',lot:'DSIP10-092624',net:'10 mg / vial'},
'bacteriostatic-water-3ml-vial-premium.png':{name:'BACTERIOSTATIC WATER',strength:'3 ml',category:'LABORATORY SUPPLIES',lot:'BAC3-092625',net:'3 ml / vial',water:true}
};
function plVialKey(src){try{return new URL(src,location.href).pathname.split('/').pop()}catch{return''}}
function plEsc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function plInjectVialStyles(){if($('#pl-vial-styles'))return;const s=document.createElement('style');s.id='pl-vial-styles';s.textContent=`
.pl-vial-stage{position:relative;height:100%;max-height:100%;aspect-ratio:1024/1535;max-width:100%;margin:auto;container-type:inline-size;flex:none}
.pl-vial-stage>.vial-image{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;object-fit:contain!important;filter:none!important}
.pl-vial-stage .pl-label-product{position:absolute;left:47.05%;top:39.88%;width:24.55%;height:13.55%;padding:1.5cqw 1.3cqw;background:linear-gradient(90deg,#e9e7e9,#efedef 48%,#e8e6e8);border-bottom:.1cqw solid #c7d2e8;color:#102e6f;text-align:left;overflow:hidden}
.pl-vial-stage .pl-product-name{display:block;font-family:Georgia,'Times New Roman',serif;font-size:4.5cqw;line-height:.95;font-weight:700;letter-spacing:-.12cqw;overflow-wrap:anywhere}
.pl-vial-stage .pl-product-name.long{font-size:3.15cqw;line-height:1}
.pl-vial-stage .pl-product-strength{display:block;margin-top:1.35cqw;font-family:Georgia,'Times New Roman',serif;font-size:3.45cqw;line-height:1;font-weight:700;color:#2462d2}
.pl-vial-stage .pl-product-strength.blend{font-family:Arial,sans-serif;font-size:1.45cqw;line-height:1.25;margin-top:1.15cqw;max-width:23cqw}
.pl-vial-stage .pl-product-desc{position:absolute;left:12.3cqw;top:8.15cqw;font:700 1.18cqw/1.35 Arial,sans-serif;color:#50607b;white-space:nowrap}
.pl-vial-stage .pl-label-category{position:absolute;left:24.8%;top:49.76%;width:21.05%;height:2.05%;display:grid;place-items:center;padding:0 .25cqw;background:linear-gradient(90deg,#e9e7e9,#efedef,#e8e6e8);border:.1cqw solid #9cb4df;border-radius:.3cqw;font:700 .92cqw/1 Arial,sans-serif;color:#17346e;white-space:nowrap;overflow:hidden}
.pl-vial-stage .pl-label-lot,.pl-vial-stage .pl-label-net{position:absolute;left:24.9%;width:15.6%;background:linear-gradient(90deg,#e9e7e9,#efedef,#e8e6e8);color:#112f70;text-align:left;overflow:hidden}
.pl-vial-stage .pl-label-lot{top:55.9%;height:2.35%;padding:.55cqw .35cqw;font:700 1.38cqw/1 Arial,sans-serif}
.pl-vial-stage .pl-label-net{top:61.45%;height:2.55%;padding:.52cqw .35cqw;font:700 1.35cqw/1.05 Arial,sans-serif}
.pl-vial-stage .pl-label-net.long{height:3.2%;font-size:.72cqw;line-height:1.08;padding-top:.2cqw;overflow-wrap:anywhere}
@media(max-width:680px){.pl-vial-stage{height:100%}.pl-vial-stage .pl-product-name{font-size:4.25cqw}.pl-vial-stage .pl-product-name.long{font-size:3cqw}}
`;document.head.appendChild(s)}
function plApplyUnifiedVials(){plInjectVialStyles();$$('img.vial-image').forEach(img=>{if(img.closest('.pl-vial-stage'))return;const key=plVialKey(img.getAttribute('src')||img.src),d=PL_VIALS[key];if(!d)return;const parent=img.parentElement;if(!parent)return;const stage=document.createElement('span');stage.className='pl-vial-stage';parent.insertBefore(stage,img);stage.appendChild(img);img.src=PL_VIAL_MASTER;img.removeAttribute('width');img.removeAttribute('height');const desc=d.water?'LABORATORY DILUENT ·':'LYOPHILIZED POWDER ·';const overlay=document.createElement('span');overlay.className='pl-vial-overlay';overlay.innerHTML=`<span class="pl-label-product"><strong class="pl-product-name ${d.name.length>16?'long':''}">${plEsc(d.name)}</strong><b class="pl-product-strength ${d.blend?'blend':''}">${plEsc(d.strength)}</b><small class="pl-product-desc">${desc}<br>FOR LABORATORY RESEARCH USE</small></span><span class="pl-label-category">${plEsc(d.category)}</span><span class="pl-label-lot">${plEsc(d.lot)}</span><span class="pl-label-net ${d.net.length>22?'long':''}">${plEsc(d.net)}</span>`;stage.appendChild(overlay)})}
(function plPrepareMaster(){if(!$$('img.vial-image').length)return;const probe=new Image();probe.onload=plApplyUnifiedVials;probe.src=PL_VIAL_MASTER})();
