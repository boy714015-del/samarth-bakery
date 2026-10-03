/* =========================================================
   Samarth Bakery — script.js
   Shared utilities: storage, seed data, layout behavior,
   formatting helpers, and dashboard rendering.
   Loaded on every page.
========================================================= */

const STORE_KEYS = {
  products: 'bakery_products',
  customers: 'bakery_customers',
  orders: 'bakery_orders',
  inventoryLog: 'bakery_inventory_log',
  session: 'bakery_session'
};

/* ---------------- Generic storage helpers ---------------- */
/* Data now lives on the Express server (data/db.json).
   Synchronous requests keep the rest of the admin code unchanged. */
const _cache = {};
function getData(key){
  try{
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/data/' + key, false);
    xhr.send();
    if(xhr.status !== 200) throw new Error('HTTP ' + xhr.status);
    return JSON.parse(xhr.responseText);
  }catch(e){
    console.error('Data read failed for', key, e);
    alert('Server se connect nahi hua. Terminal madhe "npm start" chalu aahe ka check kara.');
    return [];
  }
}
function setData(key, value){
  try{
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', '/api/data/' + key, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(value));
    if(xhr.status !== 200) throw new Error('HTTP ' + xhr.status);
  }catch(e){
    console.error('Data write failed for', key, e);
    alert('Data save jhala nahi. Server chalu aahe ka check kara.');
  }
}
function uid(prefix){
  return prefix + '-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random()*90+10);
}

/* ---------------- Formatting helpers ---------------- */
function formatCurrency(n){
  n = Number(n)||0;
  return '₹' + n.toLocaleString('en-IN', {maximumFractionDigits:0});
}
function formatCurrency2(n){
  n = Number(n)||0;
  return '₹' + n.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function formatDate(iso){
  const d = new Date(iso);
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
}
function formatDateTime(iso){
  const d = new Date(iso);
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) + ', ' +
         d.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});
}
function isSameDay(a,b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function daysAgo(n){
  const d = new Date();
  d.setHours(0,0,0,0);
  d.setDate(d.getDate()-n);
  return d;
}
function startOfWeek(d){
  const date = new Date(d);
  const day = date.getDay(); // 0 sun
  const diff = day===0?6:day-1; // week starts Monday
  date.setDate(date.getDate()-diff);
  date.setHours(0,0,0,0);
  return date;
}
function startOfMonth(d){
  const date = new Date(d.getFullYear(), d.getMonth(), 1);
  date.setHours(0,0,0,0);
  return date;
}

/* ---------------- Toasts ---------------- */
function toast(message, icon){
  let wrap = document.querySelector('.toast-wrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<i class="fa-solid ${icon||'fa-circle-check'}"></i><span>${message}</span>`;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(8px)'; el.style.transition='all .2s'; setTimeout(()=>el.remove(),200); }, 2600);
}
function confirmAction(message){
  return window.confirm(message);
}

/* =========================================================
   Seed data — runs once, only if localStorage is empty
========================================================= */
function seedDataIfEmpty(){ /* seeding is done by server.js on first start */ }

/* Recompute each customer's totalOrders / totalSpent / lastOrder from the orders list */
function syncCustomerStatsFromOrders(){
  const customers = getData(STORE_KEYS.customers);
  const orders = getData(STORE_KEYS.orders);
  customers.forEach(c=>{
    const mine = orders.filter(o=>o.mobile===c.mobile && o.status!=='Cancelled');
    c.totalOrders = mine.length;
    c.totalSpent = mine.reduce((s,o)=>s+o.total,0);
    c.lastOrder = mine.length ? mine.sort((a,b)=> new Date(b.dateTime)-new Date(a.dateTime))[0].dateTime : '';
  });
  setData(STORE_KEYS.customers, customers);
}

/* =========================================================
   Layout: sidebar, topbar, active nav, auth
========================================================= */
function initLayout(activePage){
  // Highlight active nav link
  document.querySelectorAll('.sidebar-nav a[data-page]').forEach(a=>{
    a.classList.toggle('active', a.dataset.page === activePage);
  });

  // Mobile sidebar toggle
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const menuToggle = document.querySelector('.menu-toggle');
  function openSidebar(){ sidebar && sidebar.classList.add('open'); backdrop && backdrop.classList.add('open'); }
  function closeSidebar(){ sidebar && sidebar.classList.remove('open'); backdrop && backdrop.classList.remove('open'); }
  menuToggle && menuToggle.addEventListener('click', openSidebar);
  backdrop && backdrop.addEventListener('click', closeSidebar);
  document.querySelectorAll('.sidebar-nav a').forEach(a=> a.addEventListener('click', closeSidebar));

  // Topbar date
  const dateEl = document.querySelector('.topbar-date');
  if(dateEl){
    dateEl.textContent = new Date().toLocaleDateString('en-IN', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
  }

  // Logout
  document.querySelectorAll('.logout-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(confirmAction('Log out of Samarth Bakery admin?')){
        localStorage.removeItem(STORE_KEYS.session);
        window.location.href = 'index.html';
      }
    });
  });

  // Set logged-in user name in sidebar/topbar if present
  const session = JSON.parse(localStorage.getItem(STORE_KEYS.session) || 'null');
  const who = session ? session.name : 'Admin User';
  document.querySelectorAll('.js-user-name').forEach(el=> el.textContent = who);
  document.querySelectorAll('.js-user-initial').forEach(el=> el.textContent = who.charAt(0).toUpperCase());
}

/* Require login on every page except index.html */
function requireAuth(){
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const session = localStorage.getItem(STORE_KEYS.session);
  if(page !== 'index.html' && !session){
    window.location.href = 'index.html';
  }
}

/* =========================================================
   Derived business data — used across dashboard/sales/reports
========================================================= */
function getValidOrders(){
  return getData(STORE_KEYS.orders).filter(o=>o.status!=='Cancelled');
}
function sumOrders(list){
  return list.reduce((s,o)=>s+o.total,0);
}
function ordersOnDay(list, date){
  return list.filter(o=> isSameDay(new Date(o.dateTime), date));
}
function ordersSince(list, sinceDate){
  return list.filter(o=> new Date(o.dateTime) >= sinceDate);
}
function computeSalesSummary(){
  const orders = getValidOrders();
  const today = new Date();
  const todays = ordersOnDay(orders, today);
  const weekOrders = ordersSince(orders, startOfWeek(today));
  const monthOrders = ordersSince(orders, startOfMonth(today));
  const totalSales = sumOrders(orders);
  const totalOrders = orders.length;
  const aov = totalOrders ? totalSales/totalOrders : 0;
  return {
    todaySales: sumOrders(todays),
    todayOrders: todays.length,
    weekSales: sumOrders(weekOrders),
    monthSales: sumOrders(monthOrders),
    totalSales, totalOrders, aov
  };
}
function computeBestSellers(limit){
  const orders = getValidOrders();
  const tally = {};
  orders.forEach(o=>{
    o.items.forEach(it=>{
      if(!tally[it.name]) tally[it.name] = {name:it.name, qty:0, revenue:0};
      tally[it.name].qty += it.qty;
      tally[it.name].revenue += it.qty*it.price;
    });
  });
  return Object.values(tally).sort((a,b)=>b.qty-a.qty).slice(0, limit||5);
}
function computeLowStock(threshold){
  threshold = threshold||10;
  return getData(STORE_KEYS.products).filter(p=>p.stock<=threshold).sort((a,b)=>a.stock-b.stock);
}
function salesForLastNDays(n){
  const orders = getValidOrders();
  const labels = [];
  const values = [];
  for(let i=n-1;i>=0;i--){
    const d = daysAgo(i);
    labels.push(d.toLocaleDateString('en-IN',{day:'2-digit', month:'short'}));
    values.push(sumOrders(ordersOnDay(orders, d)));
  }
  return {labels, values};
}

/* =========================================================
   Dashboard page rendering
========================================================= */
let dashboardChartRef = null;
function renderDashboard(){
  if(!document.getElementById('dashboardRoot')) return;

  const s = computeSalesSummary();
  setText('statTodaySales', formatCurrency(s.todaySales));
  setText('statWeekSales', formatCurrency(s.weekSales));
  setText('statMonthSales', formatCurrency(s.monthSales));
  setText('statTotalSales', formatCurrency(s.totalSales));
  setText('statTotalOrders', s.totalOrders);
  setText('statAOV', formatCurrency(Math.round(s.aov)));
  setText('statTodayOrders', s.todayOrders);

  const lowStock = computeLowStock(10);
  setText('statLowStock', lowStock.length);

  // Low stock list
  const lowStockList = document.getElementById('lowStockList');
  if(lowStockList){
    lowStockList.innerHTML = lowStock.length ? lowStock.slice(0,6).map(p=>`
      <div class="best-seller-row">
        <div class="cell-thumb">${productThumbHTML(p)}</div>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:.85rem;">${escapeHTML(p.name)}</div>
          <div class="text-muted" style="font-size:.72rem;">${escapeHTML(p.category)}</div>
        </div>
        <span class="badge ${p.stock<=5?'badge-red':'badge-amber'}">${p.stock} left</span>
      </div>
    `).join('') : `<div class="empty-state" style="padding:1.2rem;"><i class="fa-solid fa-circle-check"></i>All stock levels are healthy</div>`;
  }

  // Best sellers
  const bestSellers = computeBestSellers(5);
  const bestSellerList = document.getElementById('bestSellerList');
  if(bestSellerList){
    const maxQty = Math.max(...bestSellers.map(b=>b.qty), 1);
    bestSellerList.innerHTML = bestSellers.length ? bestSellers.map((b,i)=>`
      <div class="best-seller-row">
        <div class="best-seller-rank">${i+1}</div>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:.85rem;">${escapeHTML(b.name)}</div>
          <div class="progress-bar mt-1"><span style="width:${(b.qty/maxQty*100).toFixed(0)}%"></span></div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700;font-size:.82rem;">${formatCurrency(b.revenue)}</div>
          <div class="text-muted" style="font-size:.7rem;">${b.qty} sold</div>
        </div>
      </div>
    `).join('') : `<div class="empty-state" style="padding:1.2rem;"><i class="fa-solid fa-chart-simple"></i>No sales recorded yet</div>`;
  }

  // Recent orders
  const recentOrdersBody = document.getElementById('recentOrdersBody');
  if(recentOrdersBody){
    const orders = getData(STORE_KEYS.orders).sort((a,b)=> new Date(b.dateTime)-new Date(a.dateTime)).slice(0,6);
    recentOrdersBody.innerHTML = orders.length ? orders.map(o=>`
      <tr>
        <td>#${escapeHTML(o.id)}</td>
        <td>${escapeHTML(o.customerName)}</td>
        <td>${o.items.reduce((s,i)=>s+i.qty,0)} items</td>
        <td>${formatCurrency(o.total)}</td>
        <td>${statusBadge(o.status)}</td>
        <td class="text-muted">${formatDateTime(o.dateTime)}</td>
      </tr>
    `).join('') : `<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-receipt"></i>No orders yet</div></td></tr>`;
  }

  // Chart
  const ctx = document.getElementById('dashboardChart');
  if(ctx && window.Chart){
    const {labels, values} = salesForLastNDays(7);
    if(dashboardChartRef) dashboardChartRef.destroy();
    dashboardChartRef = new Chart(ctx, {
      type:'line',
      data:{
        labels,
        datasets:[{
          label:'Sales',
          data:values,
          borderColor:'#C9812D',
          backgroundColor:'rgba(201,129,45,0.12)',
          fill:true,
          tension:.35,
          pointBackgroundColor:'#C9812D',
          pointRadius:4
        }]
      },
      options:{
        plugins:{legend:{display:false}},
        scales:{
          y:{beginAtZero:true, ticks:{callback:v=>'₹'+v}},
        }
      }
    });
  }
}

/* ---------------- Small shared UI helpers ---------------- */
function setText(id, val){
  const el = document.getElementById(id);
  if(el) el.textContent = val;
}
function escapeHTML(str){
  return String(str).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function statusBadge(status){
  const map = {
    'Delivered':'badge-green', 'Preparing':'badge-amber', 'Pending':'badge-blue',
    'Out for Delivery':'badge-blue', 'Cancelled':'badge-red',
    'Active':'badge-green', 'Inactive':'badge-gray'
  };
  return `<span class="badge ${map[status]||'badge-gray'}">${escapeHTML(status)}</span>`;
}
function productThumbHTML(p){
  if(p.image) return `<img src="${p.image}" alt="${escapeHTML(p.name)}">`;
  return `<i class="fa-solid ${p.icon||'fa-cookie'}"></i>`;
}

/* =========================================================
   Boot
========================================================= */
document.addEventListener('DOMContentLoaded', function(){
  seedDataIfEmpty();
  requireAuth();
  const page = window.location.pathname.split('/').pop() || 'index.html';
  initLayout(page.replace('.html',''));
  renderDashboard();
});
