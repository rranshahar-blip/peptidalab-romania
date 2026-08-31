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
