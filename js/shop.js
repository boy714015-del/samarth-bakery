/* =========================================================
   shop.js — Customer ordering page
   Products come from the server (/api/products),
   orders are sent to the server (/api/orders).
========================================================= */
const CART_KEY = 'samarth_cart';
let products = [];
let cart = {};            // { productId: qty }
let activeCat = 'All';

const $ = id => document.getElementById(id);
const money = n => '₹' + Number(n).toLocaleString('en-IN');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function loadCart(){ try{ cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; }catch(e){ cart = {}; } }
function saveCart(){ try{ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }catch(e){} }
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),1800); }

/* ---------- load products ---------- */
async function loadProducts(){
  $('state').textContent = 'Loading menu...';
  try{
    const r = await fetch('/api/products');
    if(!r.ok) throw new Error();
    products = await r.json();
    $('state').textContent = '';
    // drop cart items that no longer exist
    Object.keys(cart).forEach(id => { if(!products.find(p=>p.id===id)) delete cart[id]; });
    renderChips(); renderGrid(); renderCart();
  }catch(e){
    $('state').innerHTML = 'Menu load hou shakla nahi. Server chalu aahe ka? (<code>npm start</code>)';
  }
}

/* ---------- product grid ---------- */
function renderChips(){
  const cats = ['All', ...new Set(products.map(p=>p.category))];
  $('chips').innerHTML = cats.map(c=>`<button class="chip ${c===activeCat?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
}
function picHTML(p){
  const icon = `<div class="fallback"><i class="fa-solid ${p.icon||'fa-cookie'}"></i></div>`;
  return icon + (p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">` : '');
}
function renderGrid(){
  const q = $('search').value.toLowerCase().trim();
  const list = products.filter(p => (activeCat==='All' || p.category===activeCat) && (!q || p.name.toLowerCase().includes(q)) && (!favOnly || favs.includes(p.id)));
  const s = $('sort').value;
  if(s==='plh') list.sort((a,b)=>a.price-b.price); else if(s==='phl') list.sort((a,b)=>b.price-a.price); else if(s==='az') list.sort((a,b)=>a.name.localeCompare(b.name));
  $('favOnly').classList.toggle('active', favOnly);
  $('grid').innerHTML = list.map(p=>{
    const inCart = cart[p.id] || 0, out = p.stock <= 0, fav = favs.includes(p.id);
    const tag = out ? '<span class="tag out">Sold out</span>' : (p.stock<=10 ? `<span class="tag low">Only ${p.stock} left</span>` : '');
    const action = out ? '<button class="add" disabled>Sold out</button>'
      : inCart ? `<div class="stepper"><button data-act="dec" data-id="${p.id}" aria-label="Less">−</button><span>${inCart}</span><button data-act="inc" data-id="${p.id}" aria-label="More">+</button></div>`
      : `<button class="add" data-act="inc" data-id="${p.id}"><i class="fa-solid fa-plus"></i> Add</button>`;
    return `<article class="card" data-id="${p.id}"><div class="pic">${picHTML(p)}${tag}<button class="heart ${fav?'on':''}" data-fav="${p.id}" aria-label="Favourite"><i class="fa-${fav?'solid':'regular'} fa-heart"></i></button></div>
      <div class="info"><h3>${esc(p.name)}</h3><span class="cat">${esc(p.category)}</span>
      <div class="bottom"><span class="price">${money(p.price)}</span>${action}</div></div></article>`;
  }).join('');
  $('state').textContent = list.length ? '' : (products.length ? (favOnly ? 'No favourites yet. Tap the heart on a product.' : 'Kahi sapadla nahi.') : $('state').textContent);
}

/* ---------- cart ---------- */
function changeQty(id, delta){
  const p = products.find(x=>x.id===id); if(!p) return;
  const next = (cart[id]||0) + delta;
  if(next > p.stock){ toast(`Only ${p.stock} ${p.name} available`); return; }
  if(next <= 0) delete cart[id]; else cart[id] = next;
  saveCart(); renderGrid(); renderCart();
}
function cartTotal(){ return Object.entries(cart).reduce((s,[id,q])=>{ const p=products.find(x=>x.id===id); return s + (p? p.price*q : 0); },0); }
function cartCount(){ return Object.values(cart).reduce((a,b)=>a+b,0); }

function renderCart(){
  $('cartCount').textContent = cartCount();
  $('cartTotal').textContent = money(cartTotal());
  $('checkoutTotal').textContent = money(cartTotal());
  const ids = Object.keys(cart);
  $('cartItems').innerHTML = ids.length ? ids.map(id=>{
    const p = products.find(x=>x.id===id); if(!p) return '';
    const q = cart[id];
    const img = p.image ? `<img src="${esc(p.image)}" alt="">` : `<div class="ph"><i class="fa-solid ${p.icon||'fa-cookie'}"></i></div>`;
    return `<div class="line">${img}<div class="meta"><b>${esc(p.name)}</b><small>${money(p.price)} each</small></div>
      <div class="stepper"><button data-act="dec" data-id="${id}">−</button><span>${q}</span><button data-act="inc" data-id="${id}">+</button></div>
      <div class="sub">${money(p.price*q)}</div></div>`;
  }).join('') : `<div class="empty"><i class="fa-solid fa-basket-shopping"></i>Your cart is empty.<br>Menu madhun kahi add kara.</div>`;
  $('cartFoot').classList.toggle('hidden', !ids.length);
}

/* ---------- drawer views ---------- */
function showView(name){
  $('cartView').classList.toggle('hidden', name!=='cart');
  $('cartFoot').classList.toggle('hidden', name!=='cart' || !Object.keys(cart).length);
  $('checkoutView').classList.toggle('hidden', name!=='checkout');
  $('successView').classList.toggle('hidden', name!=='success');
  $('ordersView').classList.toggle('hidden', name!=='orders');
  $('drawerTitle').textContent = ({checkout:'Your details', success:'Done', orders:'My orders'})[name] || 'Your cart';
}
function openDrawer(){ $('drawer').classList.add('open'); $('overlay').classList.add('open'); }
function closeDrawer(){ $('drawer').classList.remove('open'); $('overlay').classList.remove('open'); }

/* ---------- place order ---------- */
async function placeOrder(e){
  e.preventDefault();
  const f = e.target, err = $('formError');
  err.classList.remove('show');
  const body = {
    customerName: f.customerName.value.trim(),
    mobile: f.mobile.value.trim(),
    address: f.address.value.trim(),
    fulfilment: f.fulfilment.value,
    slot: f.slot.value ? new Date(f.slot.value).toLocaleString('en-IN') : '',
    note: f.note.value.trim(),
    paymentMethod: f.paymentMethod.value,
    coupon: window.appliedCoupon || '',
    items: Object.entries(cart).map(([productId, qty]) => ({productId, qty}))
  };
  if(!body.customerName){ err.textContent='Please enter your name.'; err.classList.add('show'); return; }
  if(!/^\d{10}$/.test(body.mobile)){ err.textContent='Please enter a valid 10-digit mobile number.'; err.classList.add('show'); return; }

  if(body.fulfilment==='Delivery' && !body.address){ err.textContent='Please enter the delivery address, or choose Pickup.'; err.classList.add('show'); return; }
  const btn = $('placeBtn'); btn.disabled = true;
  try{
    const r = await fetch('/api/orders', {method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body:JSON.stringify(body)});
    const data = await r.json();
    if(!r.ok){
      err.textContent = data.error || 'Order place hou shakla nahi.'; err.classList.add('show');
      await loadProducts();       // refresh stock
      return;
    }
    $('okName').textContent = data.customerName;
    $('okId').textContent = '#' + data.id;
    $('okTotal').textContent = money(data.total);
    $('okPay').textContent = data.paymentMethod;
    cart = {}; saveCart(); f.reset(); prefill();
    await loadProducts();
    showView('success');
  }catch(ex){
    err.textContent = 'Server shi connect hou shakla nahi. Punha prayatna kara.'; err.classList.add('show');
  }finally{ btn.disabled = false; }
}

/* ---------- customer account, favourites, sort, details, my orders ---------- */
const TOKEN_KEY = 'samarth_token', FAV_KEY = 'samarth_favs';
let user = null, favs = [], favOnly = false;
try{ favs = JSON.parse(localStorage.getItem(FAV_KEY)) || []; }catch(e){}
const authHeaders = () => { const t = localStorage.getItem(TOKEN_KEY); return t ? {Authorization:'Bearer '+t} : {}; };
async function api(url, opts={}){
  const r = await fetch(url, {...opts, headers:{'Content-Type':'application/json', ...authHeaders()}});
  const d = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error || 'Something went wrong.');
  return d;
}
function renderAuth(){
  $('authArea').innerHTML = user
    ? `<button class="hbtn" data-open="orders"><i class="fa-solid fa-receipt"></i> <span class="cart-label">My orders</span></button><span class="hi cart-label">Hi, ${esc(user.name.split(' ')[0])}</span><button class="hbtn ghost" id="logoutBtn">Logout</button>`
    : `<button class="hbtn ghost" data-open="login">Login</button><button class="hbtn" data-open="register">Register</button>`;
}
function prefill(){
  const f = $('checkoutView');
  if(user){ f.customerName.value = user.name; f.mobile.value = user.mobile; if(!f.address.value) f.address.value = user.address || ''; }
}
async function loadUser(){
  if(localStorage.getItem(TOKEN_KEY)){
    try{ user = await api('/api/me'); }catch(e){ user = null; localStorage.removeItem(TOKEN_KEY); }
  }
  renderAuth(); prefill();
}
function openModal(id){ $(id).classList.add('open'); }
function closeModals(){ document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open')); }
function openAuth(tab){
  document.querySelectorAll('#authModal [data-tab]').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('#authModal form').forEach(f=>f.classList.toggle('hidden', f.dataset.mode!==tab));
  openModal('authModal');
}
async function authSubmit(e){
  e.preventDefault();
  const f = e.target, err = f.querySelector('.err'); err.classList.remove('show');
  const body = Object.fromEntries(new FormData(f));
  if(f.dataset.mode==='register' && body.password !== body.confirm){ err.textContent='Passwords do not match.'; err.classList.add('show'); return; }
  try{
    const d = await api('/api/'+f.dataset.mode, {method:'POST', body:JSON.stringify(body)});
    localStorage.setItem(TOKEN_KEY, d.token); user = d.user;
    f.reset(); closeModals(); renderAuth(); prefill();
    toast(f.dataset.mode==='login' ? 'Welcome back, '+user.name.split(' ')[0]+'!' : 'Account created. Welcome!');
  }catch(ex){ err.textContent = ex.message; err.classList.add('show'); }
}
async function logout(){
  try{ await api('/api/logout', {method:'POST'}); }catch(e){}
  localStorage.removeItem(TOKEN_KEY); user = null; renderAuth(); closeDrawer(); toast('Logged out');
}
let myOrders = [];
async function showOrders(){
  if(!user){ openAuth('login'); return; }
  showView('orders'); openDrawer(); $('ordersList').innerHTML = '<div class="empty">Loading...</div>';
  try{
    myOrders = await api('/api/my-orders');
    $('ordersList').innerHTML = myOrders.length ? myOrders.map(o=>`<div class="ord"><div class="ord-h"><b>#${esc(o.id)}</b><span class="st st-${esc(o.status)}">${esc(o.status)}</span></div>
      <small>${new Date(o.dateTime).toLocaleString('en-IN')} · ${esc(o.fulfilment||'Delivery')} · ${esc(o.paymentMethod)}</small>
      <ul>${o.items.map(i=>`<li>${esc(i.name)} × ${i.qty}</li>`).join('')}</ul>
      <div class="ord-f"><b>${money(o.total)}</b><button class="add" data-reorder="${esc(o.id)}"><i class="fa-solid fa-rotate-right"></i> Reorder</button></div></div>`).join('')
      : '<div class="empty"><i class="fa-solid fa-receipt"></i>No orders yet.<br>Your orders will show here.</div>';
  }catch(ex){ $('ordersList').innerHTML = `<div class="empty">${esc(ex.message)}</div>`; }
}
function reorder(id){
  const o = myOrders.find(x=>x.id===id); if(!o) return;
  o.items.forEach(i=>{ const p = products.find(x=>x.id===i.productId); if(p && p.stock>0) cart[p.id] = Math.min(p.stock, (cart[p.id]||0)+i.qty); });
  saveCart(); renderGrid(); renderCart(); showView('cart'); toast('Items added to cart');
}
function toggleFav(id){
  favs = favs.includes(id) ? favs.filter(x=>x!==id) : [...favs, id];
  try{ localStorage.setItem(FAV_KEY, JSON.stringify(favs)); }catch(e){}
  renderGrid();
}
function openProduct(id){
  const p = products.find(x=>x.id===id); if(!p) return;
  const out = p.stock<=0, f = favs.includes(id);
  $('prodBody').innerHTML = `<div class="pm"><div class="pic">${picHTML(p)}</div><div class="pm-info">
    <span class="cat">${esc(p.category)}</span><h2>${esc(p.name)}</h2><div class="price big">${money(p.price)}</div>
    <p class="muted">${out ? 'Currently sold out.' : p.stock<=10 ? 'Only '+p.stock+' left today.' : 'In stock. Baked fresh today.'}</p>
    <div class="pm-actions">${out ? '<button class="add" disabled>Sold out</button>' : `<button class="add" data-act="inc" data-id="${p.id}"><i class="fa-solid fa-plus"></i> Add to cart</button>`}
    <button class="fav-btn ${f?'on':''}" data-fav="${p.id}"><i class="fa-${f?'solid':'regular'} fa-heart"></i> ${f?'Saved':'Save'}</button></div></div></div>`;
  openModal('prodModal');
}

/* ---------- events ---------- */
document.addEventListener('click', e=>{
  const t = e.target;
  const open = t.closest('[data-open]');
  if(open){ e.preventDefault(); open.dataset.open==='orders' ? showOrders() : openAuth(open.dataset.open); return; }
  const tab = t.closest('[data-tab]'); if(tab){ openAuth(tab.dataset.tab); return; }
  if(t.closest('[data-close]') || t.classList.contains('modal')){ closeModals(); return; }
  if(t.closest('#logoutBtn')){ logout(); return; }
  const fv = t.closest('[data-fav]'); if(fv){ toggleFav(fv.dataset.fav); if($('prodModal').classList.contains('open')) openProduct(fv.dataset.fav); return; }
  const ro = t.closest('[data-reorder]'); if(ro){ reorder(ro.dataset.reorder); return; }
  if(t.closest('#prodModal [data-act]')){ closeModals(); return; }
  if(t.closest('#favOnly')){ favOnly = !favOnly; renderGrid(); return; }
  const card = t.closest('.card');
  if(card && !t.closest('button')) openProduct(card.dataset.id);
});
document.querySelectorAll('#authModal form').forEach(f=>f.addEventListener('submit', authSubmit));
$('sort').addEventListener('change', renderGrid);

document.addEventListener('click', e=>{
  const b = e.target.closest('[data-act]');
  if(b){ changeQty(b.dataset.id, b.dataset.act==='inc' ? 1 : -1); return; }
  const chip = e.target.closest('.chip');
  if(chip){ activeCat = chip.dataset.cat; renderChips(); renderGrid(); }
});
$('search').addEventListener('input', renderGrid);
$('openCart').addEventListener('click', ()=>{ showView('cart'); openDrawer(); });
$('closeCart').addEventListener('click', closeDrawer);
$('overlay').addEventListener('click', closeDrawer);
$('toCheckout').addEventListener('click', ()=> showView('checkout'));
$('backToCart').addEventListener('click', ()=> showView('cart'));
$('checkoutView').addEventListener('submit', placeOrder);
$('newOrder').addEventListener('click', ()=>{ closeDrawer(); showView('cart'); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeDrawer(); closeModals(); } });

loadCart(); showView('cart'); loadProducts();
loadUser().then(()=>{ const h = location.hash.slice(1); if(!user && (h==='login' || h==='register')) openAuth(h); });
