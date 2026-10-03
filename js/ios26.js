/* ios26.js — Buy Now, category icons/counts, newest sort, floating glass tab bar (shop) */
(function(){
const ICONS = [
  [/eggless/i,'fa-leaf'],[/cupcake|muffin/i,'fa-cookie'],[/brownie|dessert/i,'fa-ice-cream'],[/sandwich|burger/i,'fa-burger'],
  [/drink|shake|coffee|juice/i,'fa-mug-hot'],[/cake/i,'fa-cake-candles'],[/pastr/i,'fa-cookie'],[/biscuit|cookie/i,'fa-cookie-bite'],
  [/snack|puff|donut/i,'fa-stroopwafel'],[/bakery|bread/i,'fa-bread-slice']
];
const iconFor = c => (ICONS.find(([re]) => re.test(c)) || [0,'fa-wheat-awn'])[1];

/* ---- categories: icon + item count on every chip ---- */
const _rc = renderChips;
renderChips = function(){
  _rc();
  document.querySelectorAll('#chips .chip[data-cat]').forEach(ch => {
    const c = ch.dataset.cat, n = c === 'All' ? products.length : products.filter(p => p.category === c).length;
    ch.innerHTML = `<i class="fa-solid ${c === 'All' ? 'fa-border-all' : iconFor(c)}"></i>${esc(c)} <small>${n}</small>`;
  });
  const on = document.querySelector('#chips .chip.active'); if(on && on.scrollIntoView) on.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
};

/* ---- sort: newest first ---- */
const sortEl = $('sort');
if(sortEl) sortEl.insertAdjacentHTML('beforeend','<option value="new">Sort: Newest first</option>');

/* ---- Buy now button on every in-stock card ---- */
const _g = renderGrid;
renderGrid = function(){
  _g();
  const grid = $('grid');
  grid.querySelectorAll('.card').forEach(card => {
    const p = products.find(x => x.id === card.dataset.id);
    if(!p || p.stock <= 0 || card.querySelector('.buy')) return;
    card.querySelector('.info').insertAdjacentHTML('beforeend', `<button class="buy" data-buy="${p.id}"><i class="fa-solid fa-bolt"></i> Buy now</button>`);
  });
  if(sortEl && sortEl.value === 'new'){
    [...grid.children].sort((a,b) => (b.dataset.id || '').localeCompare(a.dataset.id || '', undefined, {numeric:true})).forEach(c => grid.appendChild(c));
  }
};
const _op = openProduct;
openProduct = function(id){
  _op(id);
  const p = products.find(x => x.id === id), a = document.querySelector('#prodBody .pm-actions');
  if(p && a && p.stock > 0 && !a.querySelector('.buy')) a.insertAdjacentHTML('afterbegin', `<button class="buy" data-buy="${p.id}"><i class="fa-solid fa-bolt"></i> Buy now</button>`);
};
function buyNow(id){
  const p = products.find(x => x.id === id);
  if(!p || p.stock <= 0){ toast('Sold out'); return; }
  closeModals();
  if(!cart[id]) cart[id] = 1;
  saveCart(); renderGrid(); renderCart();
  showView('checkout'); openDrawer();
  toast(p.name + ' — fill your details to finish');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-buy]'); if(!b) return;
  e.preventDefault(); e.stopPropagation(); buyNow(b.dataset.buy);
}, true);

/* ---- floating tab bar with sliding glass lens ---- */
document.body.insertAdjacentHTML('beforeend', `<nav id="lgbar" aria-label="Quick navigation"><span class="lens"></span>
  <button data-t="home" class="on"><i class="fa-solid fa-house"></i>Home</button>
  <button data-t="menu"><i class="fa-solid fa-utensils"></i>Menu</button>
  <button data-t="saved"><i class="fa-solid fa-heart"></i>Saved</button>
  <button data-t="cart"><i class="fa-solid fa-basket-shopping"></i>Cart<span class="bdg" data-n="0"></span></button>
  <button data-t="acct"><i class="fa-solid fa-user"></i>Account</button></nav>`);
const bar = $('lgbar'), lens = bar.querySelector('.lens'), btns = [...bar.querySelectorAll('button')];
let base = 'home', busy;
function moveLens(b){ lens.style.width = b.offsetWidth + 'px'; lens.style.transform = `translateX(${b.offsetLeft}px)`; }
function setOn(t){ btns.forEach(b => b.classList.toggle('on', b.dataset.t === t)); moveLens(btns.find(b => b.dataset.t === t)); }
function pulse(t){ setOn(t); clearTimeout(busy); busy = setTimeout(() => setOn(base), 1100); }
bar.addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return; const t = b.dataset.t;
  if(t === 'home'){ base = 'home'; setOn('home'); scrollTo({top:0,behavior:'smooth'}); }
  else if(t === 'menu'){ base = 'menu'; setOn('menu'); $('chips').scrollIntoView({behavior:'smooth',block:'center'}); }
  else if(t === 'saved'){ pulse('saved'); const f = $('favBtn'); f && f.click(); }
  else if(t === 'cart'){ pulse('cart'); $('openCart').click(); }
  else { pulse('acct'); const a = document.querySelector('#authArea [data-open]'); a && a.click(); }
});
addEventListener('scroll', () => { if(busy && b_isBusy()) return; const n = scrollY > 260 ? 'menu' : 'home'; if(n !== base){ base = n; setOn(n); } }, {passive:true});
function b_isBusy(){ return btns.some(b => ['saved','cart','acct'].includes(b.dataset.t) && b.classList.contains('on')); }
addEventListener('resize', () => setOn(base));
const _rcart = renderCart;
renderCart = function(){ _rcart(); const n = cartCount(), bd = bar.querySelector('.bdg'); bd.textContent = n || ''; bd.dataset.n = n; };
renderCart();
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setOn(base));
requestAnimationFrame(() => setOn(base));

/* pointer-following specular light on the new surfaces too */
addEventListener('pointermove', e => {
  const el = e.target.closest && e.target.closest('#lgbar button,.search input'); if(!el) return;
  const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, {passive:true});

/* re-run for data that already loaded before this script ran */
if(products.length){ renderChips(); renderGrid(); }
})();
