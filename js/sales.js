/* =========================================================
   sales.js — Sales dashboard
========================================================= */
let salesChartRef = null;
let salesRangeDays = 7;

function renderSalesPage(){
  const root = document.getElementById('salesRoot');
  if(!root) return;

  const s = computeSalesSummary();
  setText('salesToday', formatCurrency(s.todaySales));
  setText('salesWeek', formatCurrency(s.weekSales));
  setText('salesMonth', formatCurrency(s.monthSales));
  setText('salesTotal', formatCurrency(s.totalSales));
  setText('salesTotalOrders', s.totalOrders);
  setText('salesAOV', formatCurrency(Math.round(s.aov)));

  document.querySelectorAll('.range-tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      document.querySelectorAll('.range-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      salesRangeDays = parseInt(tab.dataset.range, 10);
      drawSalesChart();
    });
  });

  drawSalesChart();

  // Best sellers table (fuller list than dashboard widget)
  const bestSellers = computeBestSellers(10);
  const tbody = document.getElementById('salesBestSellersBody');
  if(tbody){
    tbody.innerHTML = bestSellers.length ? bestSellers.map((b,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${escapeHTML(b.name)}</td>
        <td>${b.qty}</td>
        <td>${formatCurrency(b.revenue)}</td>
      </tr>
    `).join('') : `<tr><td colspan="4"><div class="empty-state"><i class="fa-solid fa-chart-simple"></i>No sales yet</div></td></tr>`;
  }
}

function drawSalesChart(){
  const ctx = document.getElementById('salesChart');
  if(!ctx || !window.Chart) return;
  const {labels, values} = salesForLastNDays(salesRangeDays);
  if(salesChartRef) salesChartRef.destroy();
  salesChartRef = new Chart(ctx, {
    type:'bar',
    data:{
      labels,
      datasets:[{
        label:'Sales',
        data:values,
        backgroundColor:'#C9812D',
        borderRadius:6,
        maxBarThickness:34
      }]
    },
    options:{
      plugins:{legend:{display:false}},
      scales:{ y:{beginAtZero:true, ticks:{callback:v=>'₹'+v}} }
    }
  });
}

document.addEventListener('DOMContentLoaded', renderSalesPage);
