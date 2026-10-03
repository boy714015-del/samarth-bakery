/* shop-glass.js — liquid glass: orbs, refraction filter, cursor-following specular light */
(function(){
document.body.insertAdjacentHTML('beforeend',
 '<div id="orbs"><i></i><i></i><i></i></div>'+
 '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="lg" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".008 .012" numOctaves="2" seed="4" result="n"/><feGaussianBlur in="n" stdDeviation="2" result="b"/><feDisplacementMap in="SourceGraphic" in2="b" scale="28" xChannelSelector="R" yChannelSelector="G"/></filter></svg>');
// real refraction only where backdrop-filter:url() works (Chromium family)
if(/Chrome\//.test(navigator.userAgent) && !matchMedia('(prefers-reduced-motion:reduce)').matches) document.documentElement.classList.add('lg-r');
// specular highlight follows the pointer on every glass surface
const SEL = '.icon-btn,.tabs button,.radio,.bn-a,.admin-link,.link-back,.card,.perks div,.chip,.hbtn,.vt,.opt,.mini,.ord,.slots button,.fav-btn,.share,.cat-t span,.stepper,.line,#favBtn,#theme';
addEventListener('pointermove', e => {
  const el = e.target.closest && e.target.closest(SEL); if(!el) return;
  const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, {passive:true});
})();
