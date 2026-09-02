const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const storage={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const isEn=document.documentElement.lang==='en',langRoot=isEn?'/en':'';
const ui=isEn?{added:'Added ✓',add:'Add to cart',cart:'Cart',cartTitle:'Your cart',emptyTitle:'Your cart is empty',emptyText:'Add products from the catalogue. Your cart remains saved in this browser.',explore:'Continue shopping',continueShopping:'Continue shopping',proceed:'Proceed to order',remove:'Remove',clear:'Clear cart',subtotal:'Subtotal',totalProducts:'Total products',unitPrice:'Unit price',lineTotal:'Line total',quantity:'Quantity',increase:'Increase quantity',decrease:'Decrease quantity',close:'Close cart',specialOffer:'Special offer',promoPrice:'Promotional price',save:'You save 200 lei',noResults:'No results.',sending:'Sending…'}:{added:'Adăugat ✓',add:'Adaugă în coș',cart:'Coș',cartTitle:'Coșul tău',emptyTitle:'Coșul tău este gol',emptyText:'Adaugă produse din catalog. Coșul rămâne salvat în acest browser.',explore:'Continuă cumpărăturile',continueShopping:'Continuă cumpărăturile',proceed:'Continuă către comandă',remove:'Elimină',clear:'Golește coșul',subtotal:'Subtotal',totalProducts:'Total produse',unitPrice:'Preț unitar',lineTotal:'Total produs',quantity:'Cantitate',increase:'Mărește cantitatea',decrease:'Micșorează cantitatea',close:'Închide coșul',specialOffer:'Ofertă specială',promoPrice:'Preț promoțional',save:'Economisești 200 lei',noResults:'Niciun rezultat.',sending:'Se trimite…'};
$$('.language-switch a').forEach(a=>a.addEventListener('click',()=>storage.set('pl_lang',a.hreflang||'ro')));

function setBodyLock(){document.body.classList.toggle('modal-open',!!$('.modal:not([hidden])')||document.body.classList.contains('cart-open'))}
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

const productCatalog={
'retatrutide-10mg':{name:'Retatrutide — 10 mg',concentration:'10 mg',price:399,originalPrice:599,image:'/assets/products/retatrutide-10mg-vial-premium.png'},
'retatrutide-20mg':{name:'Retatrutide — 20 mg',concentration:'20 mg',price:599,originalPrice:799,image:'/assets/products/retatrutide-20mg-vial-premium.png'},
'mots-c-10mg':{name:'MOTS-c — 10 mg',concentration:'10 mg',price:329,image:'/assets/products/mots-c-10mg-vial-premium.png'},
'nad-plus-500mg':{name:'NAD+ — 500 mg',concentration:'500 mg',price:249,image:'/assets/products/nad-plus-500mg-vial-premium.png'},
'nad-plus-1000mg':{name:'NAD+ — 1.000 mg',nameEn:'NAD+ — 1,000 mg',concentration:'1.000 mg',concentrationEn:'1,000 mg',price:399,image:'/assets/products/nad-plus-1000mg-vial-premium.png'},
'ss-31-elamipretide-10mg':{name:'SS-31 (Elamipretide) — 10 mg',concentration:'10 mg',price:329,image:'/assets/products/ss-31-elamipretide-10mg-vial-premium.png'},
'tesamorelin-10mg':{name:'Tesamorelin — 10 mg',concentration:'10 mg',price:349,image:'/assets/products/tesamorelin-10mg-vial-premium.png'},
'hgh-fragment-176-191-5mg':{name:'HGH Fragment 176–191 — 5 mg',concentration:'5 mg',price:229,image:'/assets/products/hgh-fragment-176-191-5mg-vial-premium.png'},
'skin-glow-ghk-cu-50mg':{name:'Skin Glow (GHK-Cu) — 50 mg',concentration:'50 mg',price:249,image:'/assets/products/skin-glow-ghk-cu-50mg-vial-premium.png'},
'skin-glow-ghk-cu-100mg':{name:'Skin Glow (GHK-Cu) — 100 mg',concentration:'100 mg',price:299,image:'/assets/products/skin-glow-ghk-cu-100mg-vial-premium.png'},
'bpc-157-5mg':{name:'BPC-157 — 5 mg',concentration:'5 mg',price:219,image:'/assets/products/bpc-157-5mg-vial-premium.png'},
'bpc-157-10mg':{name:'BPC-157 — 10 mg',concentration:'10 mg',price:299,image:'/assets/products/bpc-157-10mg-vial-premium.png'},
'tb-500-5mg':{name:'TB-500 — 5 mg',concentration:'5 mg',price:219,image:'/assets/products/tb-500-5mg-vial-premium.png'},
'tb-500-10mg':{name:'TB-500 — 10 mg',concentration:'10 mg',price:299,image:'/assets/products/tb-500-10mg-vial-premium.png'},
'glow-bpc-ghk-cu-tb-500':{name:'GLOW — BPC-157 10 mg + GHK-Cu 50 mg + TB-500 5 mg',concentration:'BPC-157 10 mg + GHK-Cu 50 mg + TB-500 5 mg',price:449,image:'/assets/products/glow-bpc-ghk-cu-tb-500-vial-premium.png'},
'klow-bpc-ghk-cu-tb-500-kpv':{name:'KLOW — BPC-157 10 mg + GHK-Cu 50 mg + TB-500 10 mg + KPV 10 mg',concentration:'BPC-157 10 mg + GHK-Cu 50 mg + TB-500 10 mg + KPV 10 mg',price:599,image:'/assets/products/klow-bpc-ghk-cu-tb-500-kpv-vial-premium.png'},
'cjc-1295-no-dac-10mg':{name:'CJC-1295 No DAC — 10 mg',concentration:'10 mg',price:299,image:'/assets/products/cjc-1295-no-dac-10mg-vial-premium.png'},
'ipamorelin-10mg':{name:'Ipamorelin — 10 mg',concentration:'10 mg',price:249,image:'/assets/products/ipamorelin-10mg-vial-premium.png'},
'hgh-somatropin-10iu':{name:'HGH (Somatropin) — 10 IU',concentration:'10 IU',price:349,image:'/assets/products/hgh-somatropin-10iu-vial-premium.png'},
'igf-1-lr3-1mg':{name:'IGF-1 LR3 — 1 mg',concentration:'1 mg',price:299,image:'/assets/products/igf-1-lr3-1mg-vial-premium.png'},
'pt-141-10mg':{name:'PT-141 — 10 mg',concentration:'10 mg',price:229,image:'/assets/products/pt-141-10mg-vial-premium.png'},
'ac-semax-nh2-10mg':{name:'Ac-Semax-NH₂ — 10 mg',concentration:'10 mg',price:219,image:'/assets/products/ac-semax-nh2-10mg-vial-premium.png'},
'ac-selank-nh2-10mg':{name:'Ac-Selank-NH₂ — 10 mg',concentration:'10 mg',price:219,image:'/assets/products/ac-selank-nh2-10mg-vial-premium.png'},
'dsip-10mg':{name:'DSIP — 10 mg',concentration:'10 mg',price:199,image:'/assets/products/dsip-10mg-vial-premium.png'},
'bacteriostatic-water-3ml':{name:'Bacteriostatic Water — 3 ml',nameEn:'Bacteriostatic Water — 3 mL',concentration:'3 ml',concentrationEn:'3 mL',price:45,image:'/assets/products/bacteriostatic-water-3ml-vial-premium.png'}
};
const money=value=>`${Number(value).toLocaleString(isEn?'en-GB':'ro-RO')} lei`;
const productName=product=>isEn&&product.nameEn?product.nameEn:product.name,productConcentration=product=>isEn&&product.concentrationEn?product.concentrationEn:product.concentration;
const rawCart=storage.get('pl_cart',null),legacyInterest=storage.get('pl_interest',[]);
let cart=(Array.isArray(rawCart)?rawCart:Array.isArray(legacyInterest)?legacyInterest:[]).map(item=>{const product=productCatalog[item.slug];return product?{slug:item.slug,qty:Math.min(99,Math.max(1,Math.floor(Number(item.qty)||1)))}:null}).filter(Boolean);
if(rawCart===null)storage.set('pl_cart',cart);
let cartTrigger=null,cartCloseTimer=null;

function cartCount(){return cart.reduce((total,item)=>total+item.qty,0)}
function cartSubtotal(){return cart.reduce((total,item)=>total+productCatalog[item.slug].price*item.qty,0)}
function promotionPrice(product,compact=false){return `<div class="promo-price${compact?' compact':''}"><span class="promo-badge">${ui.specialOffer}</span><span class="promo-label">${ui.promoPrice}</span><span class="promo-values"><del>${money(product.originalPrice)}</del><strong>${money(product.price)}</strong></span><span class="promo-save">${ui.save}</span></div>`}
function enhancePromotions(){['retatrutide-10mg','retatrutide-20mg'].forEach(slug=>{$$(`.add-interest[data-product="${slug}"]`).forEach(button=>{const card=button.closest('.product-card'),row=card?.querySelector('.status-row');if(row&&!row.dataset.promoEnhanced){row.querySelector(':scope > strong')?.remove();row.insertAdjacentHTML('afterbegin',promotionPrice(productCatalog[slug],true));row.dataset.promoEnhanced='true'}});const mainButton=$(`.product-summary > .add-interest[data-product="${slug}"]`),box=mainButton?.closest('.product-summary')?.querySelector('.price-box');if(box&&!box.dataset.promoEnhanced){const first=box.firstElementChild;if(first)first.innerHTML=promotionPrice(productCatalog[slug]);box.dataset.promoEnhanced='true'}})}
function createCartDrawer(){if($('#cart-drawer'))return;document.body.insertAdjacentHTML('beforeend',`<div class="cart-overlay" data-cart-close hidden></div><aside class="cart-drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title" hidden><header><div><span>${ui.cart}</span><h2 id="cart-drawer-title">${ui.cartTitle}</h2></div><button class="cart-close" type="button" data-cart-close aria-label="${ui.close}">×</button></header><div class="cart-drawer-items" id="cart-drawer-items"></div><footer><div class="cart-drawer-total"><span>${ui.totalProducts}: <strong id="cart-drawer-count">0</strong></span><span>${ui.subtotal}: <strong id="cart-drawer-subtotal">0 lei</strong></span></div><button class="button ghost" type="button" data-cart-close>${ui.continueShopping}</button><a class="button primary" data-cart-order href="${langRoot}/solicita-oferta/">${ui.proceed}</a></footer></aside>`);$$('[data-cart-close]').forEach(control=>control.addEventListener('click',closeCart));$('#cart-drawer')?.addEventListener('click',handleCartAction)}
function openCart(trigger){createCartDrawer();cartTrigger=trigger||document.activeElement;clearTimeout(cartCloseTimer);const drawer=$('#cart-drawer'),overlay=$('.cart-overlay');drawer.hidden=false;overlay.hidden=false;requestAnimationFrame(()=>{document.body.classList.add('cart-open');drawer.classList.add('open');overlay.classList.add('open');setBodyLock();$('.cart-close',drawer)?.focus()})}
function closeCart(){const drawer=$('#cart-drawer'),overlay=$('.cart-overlay');if(!drawer||drawer.hidden)return;document.body.classList.remove('cart-open');drawer.classList.remove('open');overlay?.classList.remove('open');setBodyLock();cartCloseTimer=setTimeout(()=>{drawer.hidden=true;if(overlay)overlay.hidden=true;cartTrigger?.focus?.()},260)}
function updateQuantity(slug,change){const item=cart.find(entry=>entry.slug===slug);if(!item)return;if(change<0&&item.qty===1)return;item.qty=Math.min(99,item.qty+change);saveCart()}
function removeFromCart(slug){cart=cart.filter(item=>item.slug!==slug);saveCart()}
function handleCartAction(event){const button=event.target.closest('[data-cart-action]');if(!button)return;const slug=button.dataset.slug;if(button.dataset.cartAction==='increase')updateQuantity(slug,1);if(button.dataset.cartAction==='decrease')updateQuantity(slug,-1);if(button.dataset.cartAction==='remove')removeFromCart(slug)}
function cartItemMarkup(item,full=false){const product=productCatalog[item.slug],lineTotal=product.price*item.qty,promo=product.originalPrice?`<span class="cart-item-promo"><del>${money(product.originalPrice)}</del><span>${ui.promoPrice}: ${money(product.price)}</span></span>`:money(product.price);return `<article class="cart-item${full?' cart-item-full':''}"><img src="${escapeHtml(product.image)}" alt="" width="96" height="128"><div class="cart-item-info"><h3>${escapeHtml(productName(product))}</h3><p>${escapeHtml(productConcentration(product))}</p><p><span>${ui.unitPrice}:</span> <strong>${promo}</strong></p><div class="cart-quantity" aria-label="${ui.quantity}"><button type="button" data-cart-action="decrease" data-slug="${escapeHtml(item.slug)}" aria-label="${ui.decrease}" ${item.qty===1?'disabled':''}>−</button><span aria-live="polite">${item.qty}</span><button type="button" data-cart-action="increase" data-slug="${escapeHtml(item.slug)}" aria-label="${ui.increase}">+</button></div><button class="cart-remove" type="button" data-cart-action="remove" data-slug="${escapeHtml(item.slug)}">${ui.remove}</button></div><div class="cart-line-total"><span>${ui.lineTotal}</span><strong>${money(lineTotal)}</strong></div></article>`}
function renderDrawer(){const wrap=$('#cart-drawer-items');if(!wrap)return;wrap.innerHTML=cart.length?cart.map(item=>cartItemMarkup(item)).join(''):`<div class="cart-empty"><h3>${ui.emptyTitle}</h3><p>${ui.emptyText}</p></div>`;$('#cart-drawer-count').textContent=cartCount();$('#cart-drawer-subtotal').textContent=money(cartSubtotal())}
function renderCartPage(){const wrap=$('#interest-items');if(!wrap)return;wrap.innerHTML=cart.length?cart.map(item=>cartItemMarkup(item,true)).join(''):`<div class="placeholder-box"><h2>${ui.emptyTitle}</h2><p>${ui.emptyText}</p><a class="button ghost" href="${langRoot}/produse/">${ui.explore}</a></div>`;wrap.removeEventListener('click',handleCartAction);wrap.addEventListener('click',handleCartAction);const count=$('#cart-page-count'),subtotal=$('#cart-page-subtotal');if(count)count.textContent=cartCount();if(subtotal)subtotal.textContent=money(cartSubtotal())}
function syncCount(){$$('[data-cart-count]').forEach(x=>{x.textContent=cartCount();x.setAttribute('aria-label',`${ui.totalProducts}: ${cartCount()}`);x.setAttribute('aria-live','polite')})}
function saveCart(){storage.set('pl_cart',cart);syncCount();renderDrawer();renderCartPage();fillQuote()}
function addToCart(slug,trigger){if(!productCatalog[slug])return;const existing=cart.find(item=>item.slug===slug);if(existing)existing.qty=Math.min(99,existing.qty+1);else cart.push({slug,qty:1});saveCart();trigger.textContent=ui.added;setTimeout(()=>trigger.textContent=ui.add,1200);openCart(trigger)}
function quoteSummary(){const rows=cart.map(item=>{const product=productCatalog[item.slug];return `${productName(product)} | ${ui.quantity}: ${item.qty} | ${ui.unitPrice}: ${money(product.price)} | ${ui.lineTotal}: ${money(product.price*item.qty)}`});return `${rows.join('\n')}\n\n${ui.subtotal}: ${money(cartSubtotal())}`}
function fillQuote(){const q=$('#quote-products');if(q&&cart.length&&!q.value.trim())q.value=quoteSummary()}
$$('.add-interest').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();addToCart(button.dataset.product,button)}));
$('#clear-interest')?.addEventListener('click',()=>{cart=[];saveCart()});
createCartDrawer();enhancePromotions();syncCount();renderDrawer();renderCartPage();fillQuote();

$$('.chip').forEach(ch=>ch.addEventListener('click',()=>{$$('.chip',ch.parentElement).forEach(x=>x.classList.remove('selected'));ch.classList.add('selected')}));

const grid=$('#product-grid'),catalogSearch=$('#catalog-search'),catFilter=$('#category-filter'),concFilter=$('#concentration-filter'),sortFilter=$('#sort-filter');
function filterCatalog(){if(!grid)return;const q=(catalogSearch?.value||'').trim().toLowerCase(),cat=catFilter?.value||'all',conc=concFilter?.value||'all';let cards=$$('.product-card',grid);cards.forEach(c=>{const yes=(!q||(c.dataset.name+' '+c.dataset.concentration).includes(q))&&(cat==='all'||c.dataset.category===cat)&&(conc==='all'||c.dataset.concentration.includes(conc));c.hidden=!yes});cards=cards.filter(c=>!c.hidden);cards.sort((a,b)=>a.dataset.name.localeCompare(b.dataset.name,isEn?'en':'ro')*(sortFilter?.value==='za'?-1:1)).forEach(c=>grid.appendChild(c));if($('#catalog-count'))$('#catalog-count').textContent=cards.length;if($('#no-results'))$('#no-results').hidden=!!cards.length}
[catalogSearch,catFilter,concFilter,sortFilter].forEach(el=>el?.addEventListener(el===catalogSearch?'input':'change',filterCatalog));
$('.mobile-filter')?.addEventListener('click',()=>$('.filters')?.classList.toggle('open'));

const searchPanel=$('.search-panel'),searchInput=$('#site-search'),searchResults=$('#search-results');let searchData=[];
$('.search-open')?.addEventListener('click',async()=>{show(searchPanel);searchInput?.focus();if(!searchData.length){try{searchData=await fetch(isEn?'/assets/search-index-en.json':'/assets/search-index.json').then(r=>r.json())}catch{searchData=[]}}});
$('.search-close')?.addEventListener('click',()=>hide(searchPanel));
searchInput?.addEventListener('input',()=>{const locale=isEn?'en':'ro',q=searchInput.value.trim().toLocaleLowerCase(locale);if(q.length<2){searchResults.innerHTML='';return}const hits=searchData.filter(x=>(x.title+' '+x.text).toLocaleLowerCase(locale).includes(q)).slice(0,8);searchResults.innerHTML=hits.length?hits.map(x=>`<a class="search-result" href="${x.url}"><span>${escapeHtml(x.type)}</span><strong>${escapeHtml(x.title)}</strong></a>`).join(''):`<p>${ui.noResults}</p>`});

document.addEventListener('keydown',e=>{const drawer=$('#cart-drawer');if(e.key==='Escape'){if(drawer&&!drawer.hidden)closeCart();else{$$('.modal:not([hidden])').forEach(hide);hide(searchPanel)}}if(e.key==='Tab'&&drawer&&!drawer.hidden){const focusable=$$('a[href],button:not([disabled])',drawer).filter(el=>!el.hidden),first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}});
$$('form').forEach(f=>f.addEventListener('submit',()=>{const submit=$('[type="submit"]',f);if(submit){submit.disabled=true;submit.textContent=ui.sending}}));
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
