/* shop-extra.js — extra animations + Flipkart-style features (loads after shop.js) */
(function(){
const RK = 'samarth_recent', reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
let coupons = {}, recent = [];
try{ recent = JSON.parse(localStorage.getItem(RK)) || []; }catch(e){}
window.appliedCoupon = '';
const imgOf = p => p.image ? `<img src="${esc(p.image)}" alt="" onerror="this.style.display='none'">` : '';

/* skeleton loading cards */
$('grid').innerHTML = '<div class="sk"></div>'.repeat(8);

/* hero floating icons + progress bar + back-to-top */
document.querySelector('.hero').insertAdjacentHTML('afterbegin',
  [['fa-cookie-bite','6%','20%'],['fa-cake-candles','82%','12%'],['fa-bread-slice','70%','62%'],['fa-wheat-awn','38%','70%']]
  .map(([c,l,t],i)=>`<i class="fl fa-solid ${c}" style="left:${l};top:${t};animation-delay:${i*.8}s"></i>`).join(''));
document.body.insertAdjacentHTML('beforeend','<div id="sbar"></div><button id="totop" aria-label="Top"><i class="fa-solid fa-arrow-up"></i></button><div id="cbar"><span id="cbarT"></span><button id="cbarB">View cart</button></div><canvas id="fx"></canvas>');
addEventListener('scroll', ()=>{
  const h = document.documentElement; $('sbar').style.width = (scrollY / Math.max(1,h.scrollHeight - innerHeight) * 100) + '%';
  $('totop').classList.toggle('show', scrollY > 500);
}, {passive:true});
$('totop').onclick = () => scrollTo({top:0});
$('cbarB').onclick = () => $('openCart').click();

/* scroll reveal */
const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.15});
document.querySelectorAll('.perks,.shop-footer').forEach(el => { el.classList.add('rv'); io.observe(el); });

/* banner carousel */
const slides = [
  ['linear-gradient(120deg,#C9812D,#E3A857)','Fresh cakes for every occasion','Birthday, chocolate, pineapple — order in a minute','fa-cake-candles'],
  ['linear-gradient(120deg,#8c4a2f,#c9564e)','Get 10% off your order','Use code <b>SAMARTH10</b> on orders above ₹200','fa-tag'],
  ['linear-gradient(120deg,#2B1B16,#6b4a33)','Baked fresh daily','Delivery or pickup — you choose the time slot','fa-motorcycle']
];
document.querySelector('.hero').insertAdjacentHTML('afterend',
  `<section class="wrap"><div class="bn"><div class="bn-track">${slides.map(s=>`<div class="bn-s" style="background:${s[0]}"><div><h2>${s[1]}</h2><p>${s[2]}</p></div><i class="fa-solid ${s[3]}"></i></div>`).join('')}</div>
  <button class="bn-a l" aria-label="Previous"><i class="fa-solid fa-chevron-left"></i></button><button class="bn-a r" aria-label="Next"><i class="fa-solid fa-chevron-right"></i></button>
  <div class="bn-d">${slides.map((_,i)=>`<button aria-label="Slide ${i+1}"></button>`).join('')}</div></div></section>`);
const bn = document.querySelector('.bn'), dots = [...bn.querySelectorAll('.bn-d button')]; let bi = 0, bt;
function go(i){ bi = (i + slides.length) % slides.length; bn.querySelector('.bn-track').style.transform = `translateX(-${bi*100}%)`; dots.forEach((d,k)=>d.classList.toggle('on', k===bi)); }
function auto(){ clearInterval(bt); if(!reduce) bt = setInterval(()=>go(bi+1), 4000); }
bn.querySelector('.l').onclick = () => { go(bi-1); auto(); }; bn.querySelector('.r').onclick = () => { go(bi+1); auto(); };
dots.forEach((d,i)=>d.onclick = () => { go(i); auto(); });
let sx = 0; bn.addEventListener('touchstart', e=>sx = e.touches[0].clientX, {passive:true});
bn.addEventListener('touchend', e=>{ const dx = e.changedTouches[0].clientX - sx; if(Math.abs(dx) > 40){ go(bi + (dx < 0 ? 1 : -1)); auto(); } });
go(0); auto();

/* search suggestions */
document.querySelector('.search').insertAdjacentHTML('beforeend','<div id="sug"></div>');
$('search').addEventListener('input', () => {
  const q = $('search').value.toLowerCase().trim();
  const m = q ? products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0,5) : [];
  $('sug').innerHTML = m.map(p=>`<button data-sug="${p.id}">${imgOf(p)}<span>${esc(p.name)}</span><small>${money(p.price)}</small></button>`).join('');
  $('sug').classList.toggle('show', m.length > 0);
});
document.addEventListener('click', e => {
  const s = e.target.closest('[data-sug]');
  if(s){ $('sug').classList.remove('show'); openProduct(s.dataset.sug); return; }
  if(!e.target.closest('.search')) $('sug').classList.remove('show');
});

/* ripple + fly-to-cart (capture phase: runs before the card re-renders) */
document.addEventListener('click', e => {
  const b = e.target.closest('.add,.btn,.hbtn'); if(!b || b.disabled) return;
  if(!reduce){
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), el = document.createElement('span');
    el.className = 'rip'; el.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
    b.style.position = b.style.position || 'relative'; b.style.overflow = 'hidden'; b.appendChild(el); setTimeout(()=>el.remove(), 600);
  }
  const card = b.closest('.card'), img = card && card.querySelector('.pic img');
  if(!reduce && img && b.dataset.act === 'inc'){
    const r = img.getBoundingClientRect(), c = $('openCart').getBoundingClientRect(), f = document.createElement('img');
    f.className = 'fly'; f.src = img.src; f.style.cssText = `left:${r.left+r.width/2-30}px;top:${r.top+r.height/2-30}px;width:60px;height:60px`;
    document.body.appendChild(f);
    f.animate([{transform:'none',opacity:1},{transform:`translate(${c.left-r.left-r.width/2+30}px,${c.top-r.top-r.height/2+10}px) scale(.2)`,opacity:.3}], {duration:700,easing:'cubic-bezier(.5,0,.9,.5)'})
      .onfinish = () => { f.remove(); const n = $('cartCount'); n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); };
  }
}, true);

/* grid: staggered entrance when the visible list changes */
const _rg = renderGrid; let sig = '';
renderGrid = function(){
  _rg();
  const g = $('grid'), cards = [...g.querySelectorAll('.card')], s = cards.map(c=>c.dataset.id).join();
  if(s !== sig){ sig = s; cards.forEach((c,i)=>c.style.setProperty('--i', Math.min(i,12))); g.classList.add('anim'); clearTimeout(g._t); g._t = setTimeout(()=>g.classList.remove('anim'), 1500); }
  renderRecent();
};

/* coupons */
fetch('/api/coupons').then(r=>r.json()).then(c=>coupons = c).catch(()=>{});
$('cartFoot').insertAdjacentHTML('afterbegin','<div class="save-row hidden" id="saveRow"><span id="saveTxt"></span><span id="saveAmt"></span></div><div class="cpn"><input id="cpnIn" placeholder="Coupon code (e.g. SAMARTH10)" maxlength="20"><button id="cpnBtn" type="button">Apply</button></div><div class="cpn-msg" id="cpnMsg"></div>');
function discount(sub){
  const c = coupons[window.appliedCoupon]; if(!c || sub < c.min) return 0;
  return Math.min(sub, c.pct ? Math.round(sub * c.pct / 100) : c.flat);
}
function cpnMsg(t, ok){ $('cpnMsg').textContent = t; $('cpnMsg').className = 'cpn-msg ' + (ok ? 'ok' : 'bad'); }
$('cpnBtn').onclick = () => {
  const code = $('cpnIn').value.trim().toUpperCase(), c = coupons[code], sub = cartTotal();
  if(!c) return cpnMsg('Invalid coupon code.', false);
  if(sub < c.min) return cpnMsg(`Add items worth ₹${c.min - sub} more to use ${code}.`, false);
  window.appliedCoupon = code; renderCart(); toast('Coupon applied 🎉');
};
const _rc = renderCart;
renderCart = function(){
  _rc();
  const sub = cartTotal(), n = cartCount();
  if(window.appliedCoupon && (!sub || sub < (coupons[window.appliedCoupon]||{min:0}).min)){ window.appliedCoupon = ''; if(sub) cpnMsg('Coupon removed — order amount is below the minimum.', false); else { cpnMsg('', true); $('cpnIn').value = ''; } }
  const d = discount(sub);
  $('saveRow').classList.toggle('hidden', !d);
  if(d){ $('saveTxt').textContent = `${window.appliedCoupon} applied`; $('saveAmt').textContent = '− ' + money(d); cpnMsg(coupons[window.appliedCoupon].label, true); }
  $('cartTotal').textContent = $('checkoutTotal').textContent = money(sub - d);
  $('cbarT').innerHTML = `<b>${n} item${n>1?'s':''}</b> · ${money(sub - d)}`;
  $('cbar').classList.toggle('show', n > 0);
};

/* order tracker in My orders */
const STEPS = ['Placed','Preparing','On the way','Delivered'], IDX = {Pending:0,Preparing:1,'Out for Delivery':2,Delivered:3};
const _so = showOrders;
showOrders = async function(){
  await _so();
  document.querySelectorAll('#ordersList .ord').forEach((el, i) => {
    const o = myOrders[i]; if(!o || o.status === 'Cancelled') return;
    const k = IDX[o.status] ?? 0;
    el.querySelector('.ord-h').insertAdjacentHTML('afterend', `<div class="trk">${STEPS.map((s,j)=>`<div class="${j<=k?'d':''} ${j===k&&k<3?'cur':''}">${s}</div>`).join('')}</div>`);
  });
};

/* recently viewed + similar products */
function renderRecent(){
  let sec = $('recent');
  if(!sec){ $('grid').insertAdjacentHTML('afterend','<section id="recent"></section>'); sec = $('recent'); }
  const list = recent.map(id => products.find(p => p.id === id)).filter(Boolean);
  sec.innerHTML = list.length ? `<h3 class="sec-t">Recently viewed</h3><div class="hrow">${list.map(mini).join('')}</div>` : '';
}
const mini = p => `<div class="mini" data-mini="${p.id}">${imgOf(p)}<b>${esc(p.name)}</b><div>${money(p.price)}</div></div>`;
const _op = openProduct;
openProduct = function(id){
  _op(id);
  const p = products.find(x => x.id === id); if(!p) return;
  recent = [id, ...recent.filter(x => x !== id)].slice(0, 8);
  try{ localStorage.setItem(RK, JSON.stringify(recent)); }catch(e){}
  const sim = products.filter(x => x.category === p.category && x.id !== id && x.stock > 0).slice(0, 6);
  document.querySelector('#prodModal .modal-box').style.overflowY = 'auto';
  if(sim.length) $('prodBody').insertAdjacentHTML('beforeend', `<div class="more"><h3 class="sec-t">You may also like</h3><div class="hrow">${sim.map(mini).join('')}</div></div>`);
  renderRecent();
};
document.addEventListener('click', e => { const m = e.target.closest('[data-mini]'); if(m) openProduct(m.dataset.mini); });

/* confetti on order success */
const _sv = showView;
showView = function(name){ _sv(name); if(name === 'success' && !reduce) confetti(); };
function confetti(){
  const c = $('fx'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const col = ['#C9812D','#C9564E','#4C8B5B','#F3DDB8','#2B1B16'];
  const ps = Array.from({length:110}, () => ({x:innerWidth/2, y:innerHeight/3, vx:(Math.random()-.5)*14, vy:-Math.random()*13-4, s:4+Math.random()*6, c:col[Math.random()*5|0], r:Math.random()*6}));
  let t = 0;
  (function f(){
    x.clearRect(0,0,c.width,c.height);
    ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += .2; x.save(); x.translate(p.x,p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6); x.restore(); });
    if(++t < 150) requestAnimationFrame(f); else x.clearRect(0,0,c.width,c.height);
  })();
}

renderCart(); if(products.length) renderGrid();
})();
