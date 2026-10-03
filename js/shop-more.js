/* shop-more.js — filters, list view, voice search, cake options, add-ons, slots, extra animations */
(function(){
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches, hover = matchMedia('(hover:hover)').matches;
let inStock = false;

/* ---- toolbar: price filter, in-stock, grid/list ---- */
const tb = document.querySelector('.toolbar');
tb.insertAdjacentHTML('beforeend', `<div class="tools"><select id="priceF" aria-label="Price"><option value="">All prices</option><option value="u50">Under ₹50</option><option value="m">₹50 – ₹200</option><option value="o">Above ₹200</option></select>
  <button class="chip" id="stockF"><i class="fa-solid fa-box"></i> In stock</button>
  <div class="vt"><button class="on" data-v="grid" aria-label="Grid"><i class="fa-solid fa-table-cells-large"></i></button><button data-v="list" aria-label="List"><i class="fa-solid fa-list"></i></button></div></div>`);
$('state').insertAdjacentHTML('afterend','<div id="fstate"></div>');
$('priceF').onchange = () => applyFilters();
$('stockF').onclick = () => { inStock = !inStock; $('stockF').classList.toggle('on', inStock); applyFilters(); };
document.querySelectorAll('.vt button').forEach(b => b.onclick = () => { document.querySelectorAll('.vt button').forEach(x=>x.classList.toggle('on', x===b)); $('grid').classList.toggle('list', b.dataset.v === 'list'); });
function applyFilters(){
  const pf = $('priceF').value; let n = 0;
  document.querySelectorAll('#grid .card').forEach(c => {
    const p = products.find(x=>x.id===c.dataset.id); if(!p) return;
    let ok = pf==='u50' ? p.price<50 : pf==='m' ? p.price>=50 && p.price<=200 : pf==='o' ? p.price>200 : true;
    if(inStock && p.stock<=0) ok = false;
    c.classList.toggle('hidden', !ok); if(ok) n++;
  });
  $('fstate').textContent = (!n && products.length && document.querySelector('#grid .card')) ? 'No products match these filters.' : '';
}

/* ---- header favourites button ---- */
document.querySelector('.hdr-right').insertAdjacentHTML('afterbegin','<button id="favBtn" aria-label="Favourites"><i class="fa-solid fa-heart"></i><span id="favN">0</span></button>');
$('favBtn').onclick = () => { $('favOnly').click(); $('chips').scrollIntoView({behavior:'smooth'}); };
const _g = renderGrid;
renderGrid = function(){ _g(); applyFilters(); $('favN').textContent = favs.length; };

/* ---- voice search (Marathi / English) ---- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if(SR){
  document.querySelector('.search').insertAdjacentHTML('beforeend','<button id="mic" type="button" aria-label="Voice search"><i class="fa-solid fa-microphone"></i></button>');
  $('mic').onclick = () => {
    const r = new SR(); r.lang = 'mr-IN'; $('mic').classList.add('rec'); toast('Bola... 🎤');
    r.onresult = e => { $('search').value = e.results[0][0].transcript; $('search').dispatchEvent(new Event('input')); };
    r.onend = r.onerror = () => $('mic').classList.remove('rec'); r.start();
  };
}

/* ---- cake options (message / eggless) -> added to order note ---- */
const OK = 'samarth_opts'; let opts = {};
try{ opts = JSON.parse(localStorage.getItem(OK)) || {}; }catch(e){}
const _p = openProduct;
openProduct = function(id){
  _p(id); const p = products.find(x=>x.id===id), a = document.querySelector('#prodBody .pm-actions'); if(!p || p.category !== 'Cakes' || !a) return;
  const o = opts[id] || {};
  a.insertAdjacentHTML('beforebegin', `<div class="opt" data-pid="${id}"><label>Message on cake<input type="text" data-o="msg" maxlength="30" placeholder="e.g. Happy Birthday Rohan" value="${esc(o.msg||'')}"></label><label class="chk"><input type="checkbox" data-o="egg" ${o.egg?'checked':''}> Eggless please</label></div>`);
};
document.addEventListener('input', e => {
  const i = e.target.closest('[data-o]'); if(!i) return; const id = i.closest('.opt').dataset.pid; opts[id] = opts[id] || {};
  opts[id][i.dataset.o] = i.type === 'checkbox' ? i.checked : i.value.trim();
  try{ localStorage.setItem(OK, JSON.stringify(opts)); }catch(e){}
});
document.addEventListener('submit', e => {
  if(e.target.id !== 'checkoutView') return; const f = e.target;
  const lines = Object.keys(cart).map(id => { const o = opts[id], p = products.find(x=>x.id===id); return o && (o.msg || o.egg) && p ? `${p.name}${o.msg?': "'+o.msg+'"':''}${o.egg?' (Eggless)':''}` : ''; }).filter(Boolean);
  f.note.value = f.note.value.split(' ‖ ')[0] + (lines.length ? ' ‖ ' + lines.join('; ') : '');
}, true);

/* ---- cart add-ons ---- */
const _rc = renderCart;
renderCart = function(){
  _rc(); let box = $('addons'); if(!box){ $('cartItems').insertAdjacentHTML('afterend','<div id="addons"></div>'); box = $('addons'); }
  const sug = Object.keys(cart).length ? products.filter(p=>!cart[p.id] && p.stock>0).sort((a,b)=>a.price-b.price).slice(0,3) : [];
  box.innerHTML = sug.length ? `<h4 class="sec-t" style="font-size:1rem">Add a little more</h4>` + sug.map(p=>`<div class="ad">${p.image?`<img src="${esc(p.image)}" alt="">`:''}<span>${esc(p.name)}<br><small>${money(p.price)}</small></span><button class="add" data-act="inc" data-id="${p.id}">+ Add</button></div>`).join('') : '';
};
renderCart();

/* ---- delivery slot quick chips ---- */
const fmt = d => new Date(d - d.getTimezoneOffset()*6e4).toISOString().slice(0,16);
document.querySelector('#checkoutView input[name=slot]').closest('label').insertAdjacentHTML('afterend','<div class="slots"><button type="button" data-s="1h">In 1 hour</button><button type="button" data-s="eve">Today 6 PM</button><button type="button" data-s="tom">Tomorrow 10 AM</button></div>');
document.addEventListener('click', e => {
  const b = e.target.closest('.slots button'); if(!b) return; const d = new Date();
  if(b.dataset.s === '1h') d.setHours(d.getHours()+1); else if(b.dataset.s === 'eve') d.setHours(18,0,0,0); else { d.setDate(d.getDate()+1); d.setHours(10,0,0,0); }
  document.querySelector('#checkoutView input[name=slot]').value = fmt(d); toast('Time slot set');
});

/* ---- stats band with count-up (real numbers) ---- */
document.querySelector('main').insertAdjacentHTML('beforebegin','<section class="wrap stats rv"><div><b data-n="0">0</b><small>Items on our menu</small></div><div><b data-n="0">0</b><small>Orders served</small></div><div><b data-n="0">0</b><small>Happy customers</small></div></section>');
const sb = [...document.querySelectorAll('.stats b')]; let seen = false, nums = null;
Promise.all(['/api/products','/api/data/bakery_orders','/api/data/bakery_customers'].map(u=>fetch(u).then(r=>r.json()))).then(([p,o,c]) => { nums = [p.length, o.filter(x=>x.status!=='Cancelled').length, c.length]; if(seen) count(); }).catch(()=>{});
function count(){ sb.forEach((el,i) => { const t = nums[i], t0 = performance.now(); (function s(now){ const k = Math.min(1, (now-t0)/1400); el.textContent = Math.round(t * (1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(s); })(t0); }); }
new IntersectionObserver((es,ob) => { if(es[0].isIntersecting){ seen = true; ob.disconnect(); document.querySelector('.stats').classList.add('in'); if(nums) count(); } }, {threshold:.4}).observe(document.querySelector('.stats'));

/* ---- extra animations ---- */
if(!reduce){
  const hero = document.querySelector('.hero'), col = ['#F3C277','#C9564E','#fff','#8fd19e'];
  for(let i=0;i<16;i++) hero.insertAdjacentHTML('beforeend', `<span class="spr" style="left:${Math.random()*100}%;background:${col[i%4]};animation-duration:${5+Math.random()*6}s;animation-delay:${-Math.random()*8}s"></span>`);
  if(hover){
    document.body.insertAdjacentHTML('beforeend','<div id="glow"></div>'); let gx = innerWidth/2, gy = 0, tx = gx, ty = gy;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, {passive:true});
    (function loop(){ gx += (tx-gx)*.12; gy += (ty-gy)*.12; $('glow').style.transform = `translate(${gx}px,${gy}px)`; requestAnimationFrame(loop); })();
    const cb = $('openCart');
    cb.addEventListener('mousemove', e => { const r = cb.getBoundingClientRect(); cb.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`; });
    cb.addEventListener('mouseleave', () => cb.style.transform = '');
    document.addEventListener('mousemove', e => { const pic = e.target.closest('.pm .pic'), im = pic && pic.querySelector('img'); if(im){ const r = pic.getBoundingClientRect(); im.style.transformOrigin = `${(e.clientX-r.left)/r.width*100}% ${(e.clientY-r.top)/r.height*100}%`; } });
  }
  const burst = (x, y, txt, n) => { for(let i=0;i<n;i++){ const s = document.createElement('span'); s.className = 'pfx'; s.textContent = txt; s.style.cssText = `left:${x}px;top:${y}px`; document.body.appendChild(s);
    s.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${(Math.random()-.5)*90}px,${-40-Math.random()*60}px) scale(${n>1?1.4:1})`,opacity:0}], {duration:800,easing:'ease-out'}).onfinish = () => s.remove(); } };
  document.addEventListener('click', e => {
    if(e.target.closest('.heart,.fav-btn')) burst(e.clientX, e.clientY, '❤️', 6);
    else if(e.target.closest('[data-act="inc"]')) burst(e.clientX, e.clientY-10, '+1', 1);
  }, true);
}
const title = document.title;
document.addEventListener('visibilitychange', () => document.title = document.hidden ? 'Your fresh bake is waiting 🎂' : title);

if(products.length) renderGrid();
})();
