/* shop-style.js — splash, photo hero, category tiles, best sellers, tilt, dark mode, share */
(function(){
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* splash (once per visit) */
if(!sessionStorage.getItem('samarth_splash')){
  document.body.insertAdjacentHTML('beforeend','<div id="splash"><div><i class="fa-solid fa-cookie-bite"></i><b>Samarth Bakery</b></div></div>');
  setTimeout(()=>$('splash').classList.add('out'), 1300); setTimeout(()=>$('splash').remove(), 2300);
  try{ sessionStorage.setItem('samarth_splash','1'); }catch(e){}
}

/* hero photo slideshow + parallax */
const hero = document.querySelector('.hero');
const pics = ['cream-roll','donuts','bun','birthday-cake'];
hero.insertAdjacentHTML('afterbegin', `<div class="hero-bg">${pics.map(p=>`<div style="background-image:url(images/${p}.jpg)"></div>`).join('')}</div>`);
const layers = [...hero.querySelectorAll('.hero-bg div')]; let hi = 0; layers[0].classList.add('on');
if(!reduce) setInterval(()=>{ layers[hi].classList.remove('on'); hi = (hi+1) % layers.length; layers[hi].classList.add('on'); }, 5000);
addEventListener('scroll', ()=>{ if(scrollY < 700 && !reduce) hero.querySelector('.hero-bg').style.transform = `translateY(${scrollY*.25}px)`; }, {passive:true});
hero.querySelector('h1').insertAdjacentHTML('beforebegin','<span class="tagline">Since day one · Baked with love</span>');

/* rotating headline words */
const em = hero.querySelector('em'), words = ['delivered to you.','made with love.','baked every morning.','worth every bite.']; let wi = 0;
if(!reduce) setInterval(()=>{ em.classList.add('sw'); setTimeout(()=>{ wi = (wi+1) % words.length; em.textContent = words[wi]; }, 250); setTimeout(()=>em.classList.remove('sw'), 500); }, 3200);

/* marquee strip */
const items = [['fa-cake-candles','Fresh cakes'],['fa-bread-slice','Soft bread & buns'],['fa-cookie-bite','Crunchy cookies'],['fa-motorcycle','Home delivery'],['fa-tag','Code SAMARTH10'],['fa-wheat-awn','Baked every morning']];
const mq = items.map(([i,t])=>`<span><i class="fa-solid ${i}"></i>${t}</span>`).join('');
hero.insertAdjacentHTML('afterend', `<div class="mq"><div>${mq}${mq}${mq}${mq}</div></div>`);

/* dark mode */
const root = document.documentElement;
function setTheme(t){ t === 'dark' ? root.setAttribute('data-theme','dark') : root.removeAttribute('data-theme'); try{ localStorage.setItem('samarth_theme', t); }catch(e){} $('theme').innerHTML = `<i class="fa-solid fa-${t==='dark'?'sun':'moon'}"></i>`; }
document.querySelector('.hdr-right').insertAdjacentHTML('afterbegin','<button id="theme" aria-label="Dark mode"></button>');
setTheme((()=>{ try{ return localStorage.getItem('samarth_theme'); }catch(e){} })() || 'light');
$('theme').onclick = () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');

/* best sellers from real orders */
let top = [];
fetch('/api/data/bakery_orders').then(r=>r.json()).then(os => {
  const c = {}; os.filter(o=>o.status!=='Cancelled').forEach(o=>o.items.forEach(i=>c[i.productId] = (c[i.productId]||0) + i.qty));
  top = Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]); if(products.length) renderGrid();
}).catch(()=>{});

/* category photo tiles */
let tilesBuilt = false;
function buildTiles(){
  const cats = [...new Set(products.map(p=>p.category))]; if(!cats.length) return; tilesBuilt = true;
  const photo = c => { const p = products.find(x=>x.category===c && /\.jpg$/i.test(x.image||'')) || products.find(x=>x.category===c); return p && p.image ? `url(${p.image})` : 'none'; };
  const all = `<button class="cat-t on" data-t="All"><span style="background-image:url(images/cream-roll.jpg)"></span>All</button>`;
  $('chips').insertAdjacentHTML('beforebegin', `<div class="cats">${all}${cats.map(c=>`<button class="cat-t" data-t="${esc(c)}"><span style="background-image:${photo(c)}"></span>${esc(c)}</button>`).join('')}</div>`);
}
document.addEventListener('click', e => {
  const t = e.target.closest('.cat-t'); if(!t) return;
  const chip = [...document.querySelectorAll('#chips .chip')].find(c=>c.dataset.cat===t.dataset.t); if(chip) chip.click();
  document.querySelectorAll('.cat-t').forEach(b=>b.classList.toggle('on', b===t));
  $('chips').scrollIntoView({behavior:'smooth', block:'start'});
});

/* grid hook: tiles, badges, shine */
const _g = renderGrid;
renderGrid = function(){
  _g(); if(!tilesBuilt) buildTiles();
  document.querySelectorAll('#grid .card').forEach(c => {
    const pic = c.querySelector('.pic'); if(!pic) return;
    pic.insertAdjacentHTML('beforeend','<span class="shine"></span>');
    if(top.includes(c.dataset.id)) pic.insertAdjacentHTML('beforeend','<span class="best">🔥 Best seller</span>');
  });
};

/* 3D tilt on cards (mouse devices only) */
if(matchMedia('(hover:hover)').matches && !reduce){
  const g = $('grid');
  g.addEventListener('mousemove', e => { const c = e.target.closest('.card'); if(!c) return; const r = c.getBoundingClientRect(), x = (e.clientX-r.left)/r.width-.5, y = (e.clientY-r.top)/r.height-.5; c.style.transform = `perspective(700px) rotateX(${-y*8}deg) rotateY(${x*8}deg) translateY(-4px)`; });
  g.addEventListener('mouseout', e => { const c = e.target.closest('.card'); if(c) c.style.transform = ''; });
}

/* WhatsApp share in product popup */
const _p = openProduct;
openProduct = function(id){
  _p(id); const p = products.find(x=>x.id===id), box = document.querySelector('#prodBody .pm-actions'); if(!p || !box) return;
  const txt = encodeURIComponent(`${p.name} — ${money(p.price)} at Samarth Bakery\n${location.origin}/shop.html`);
  box.insertAdjacentHTML('beforeend', `<a class="share" target="_blank" rel="noopener" href="https://wa.me/?text=${txt}"><i class="fa-brands fa-whatsapp"></i> Share</a>`);
};

if(products.length) renderGrid();
})();
