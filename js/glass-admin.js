/* glass-admin.js — orbs, refraction filter and pointer-following highlight for admin pages */
(function(){
document.body.insertAdjacentHTML('beforeend','<div id="orbs"><i></i><i></i><i></i></div><svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="lg" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".008 .012" numOctaves="2" seed="4" result="n"/><feGaussianBlur in="n" stdDeviation="2" result="b"/><feDisplacementMap in="SourceGraphic" in2="b" scale="28" xChannelSelector="R" yChannelSelector="G"/></filter></svg>');
if(/Chrome\//.test(navigator.userAgent) && !matchMedia('(prefers-reduced-motion:reduce)').matches) document.documentElement.classList.add('lg-r');
const SEL = '.card,.stat-card,.pos-product-card,.cart-item,.pay-method,.range-tab,.chip,.search-box,.btn-outline,.login-card,.best-seller-row';
addEventListener('pointermove', e => { const el = e.target.closest && e.target.closest(SEL); if(!el) return; const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX-r.left)+'px'); el.style.setProperty('--my', (e.clientY-r.top)+'px'); }, {passive:true});
})();
