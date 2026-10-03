/* =========================================================
   reports.js — Business reports
========================================================= */
function renderReportsPage(){
  const root = document.getElementById('reportsRoot');
  if(!root) return;

  const orders = getValidOrders();
  const today = new Date();

  // Daily / Weekly / Monthly summary
  const daily = sumOrders(ordersOnDay(orders, today));
  const weekly = sumOrders(ordersSince(orders, startOfWeek(today)));
  const monthly = sumOrders(ordersSince(orders, startOfMonth(today)));
  const total = sumOrders(orders);
  setText('reportDaily', formatCurrency(daily));
  setText('reportWeekly', formatCurrency(weekly));
  setText('reportMonthly', formatCurrency(monthly));
  setText('reportTotalRevenue', formatCurrency(total));

  // Product-wise sales
  const tally = {};
  orders.forEach(o=> o.items.forEach(it=>{
    if(!tally[it.name]) tally[it.name] = {name:it.name, qty:0, revenue:0};
    tally[it.name].qty += it.qty;
    tally[it.name].revenue += it.qty*it.price;
  }));
  const productRows = Object.values(tally).sort((a,b)=>b.revenue-a.revenue);
  const productBody = document.getElementById('productWiseBody');
  productBody.innerHTML = productRows.length ? productRows.map(p=>`
    <tr><td>${escapeHTML(p.name)}</td><td>${p.qty}</td><td>${formatCurrency(p.revenue)}</td></tr>
  `).join('') : `<tr><td colspan="3"><div class="empty-state"><i class="fa-solid fa-chart-simple"></i>No data yet</div></td></tr>`;

  // Customer-wise sales
  syncCustomerStatsFromOrders();
  const customers = getData(STORE_KEYS.customers).sort((a,b)=>b.totalSpent-a.totalSpent);
  const custBody = document.getElementById('customerWiseBody');
  custBody.innerHTML = customers.length ? customers.map(c=>`
    <tr><td>${escapeHTML(c.name)}</td><td>${escapeHTML(c.mobile)}</td><td>${c.totalOrders}</td><td>${formatCurrency(c.totalSpent)}</td></tr>
  `).join('') : `<tr><td colspan="4"><div class="empty-state"><i class="fa-solid fa-users"></i>No customer data yet</div></td></tr>`;

  // Period table (last 14 days)
  const periodBody = document.getElementById('periodReportBody');
  let periodRowsHTML = '';
  for(let i=13;i>=0;i--){
    const d = daysAgo(i);
    const dayOrders = ordersOnDay(orders, d);
    periodRowsHTML += `<tr>
      <td>${d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
      <td>${dayOrders.length}</td>
      <td>${formatCurrency(sumOrders(dayOrders))}</td>
    </tr>`;
  }
  periodBody.innerHTML = periodRowsHTML;
}

function printReports(){
  window.print();
}

document.addEventListener('DOMContentLoaded', renderReportsPage);
