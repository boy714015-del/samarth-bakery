/* =========================================================
   inventory.js — Stock management
========================================================= */
let stockAdjustProductId = null;

function renderInventoryPage(){
  const root = document.getElementById('inventoryRoot');
  if(!root) return;

  const searchInput = document.getElementById('inventorySearch');

  function draw(){
    let products = getData(STORE_KEYS.products);
    const q = (searchInput?.value||'').toLowerCase().trim();
    if(q) products = products.filter(p=>p.name.toLowerCase().includes(q));

    const lowCount = products.filter(p=>p.stock<=10).length;
    setText('inventoryLowCount', lowCount);
    setText('inventoryTotalItems', products.reduce((s,p)=>s+p.stock,0));
    setText('inventoryProductCount', products.length);

    const tbody = document.getElementById('inventoryBody');
    tbody.innerHTML = products.length ? products.map(p=>`
      <tr>
        <td>
          <div class="cell-prod">
            <div class="cell-thumb">${productThumbHTML(p)}</div>
            <div style="font-weight:600;">${escapeHTML(p.name)}</div>
          </div>
        </td>
        <td>${escapeHTML(p.category)}</td>
        <td style="font-weight:700;">${p.stock}</td>
        <td>${p.stock<=5 ? '<span class="badge badge-red">Critical</span>' : p.stock<=10 ? '<span class="badge badge-amber">Low</span>' : '<span class="badge badge-green">Healthy</span>'}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-success btn-sm" onclick="openStockModal('${p.id}','IN')"><i class="fa-solid fa-arrow-down"></i> Stock In</button>
            <button class="btn btn-outline btn-sm" onclick="openStockModal('${p.id}','OUT')"><i class="fa-solid fa-arrow-up"></i> Stock Out</button>
          </div>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="5"><div class="empty-state"><i class="fa-solid fa-boxes-stacked"></i>No products found</div></td></tr>`;
  }

  searchInput && searchInput.addEventListener('input', draw);
  draw();
  window.refreshInventoryPage = draw;

  drawInventoryHistory();
}

function openStockModal(productId, type){
  stockAdjustProductId = productId;
  const p = getData(STORE_KEYS.products).find(x=>x.id===productId);
  if(!p) return;
  document.getElementById('stockModalTitle').textContent = (type==='IN' ? 'Stock In — ' : 'Stock Out — ') + p.name;
  document.getElementById('stockForm').reset();
  document.getElementById('stockForm').dataset.type = type;
  document.getElementById('stockCurrentQty').textContent = p.stock;
  document.getElementById('stockModal').classList.add('open');
}
function closeStockModal(){
  document.getElementById('stockModal').classList.remove('open');
}

function submitStockForm(e){
  e.preventDefault();
  const form = e.target;
  const type = form.dataset.type;
  const qty = parseInt(form.qty.value, 10);
  const note = form.note.value.trim();
  if(isNaN(qty) || qty<=0){ toast('Enter a valid quantity', 'fa-triangle-exclamation'); return; }

  const products = getData(STORE_KEYS.products);
  const p = products.find(x=>x.id===stockAdjustProductId);
  if(!p) return;

  if(type==='OUT' && qty > p.stock){
    toast('Cannot remove more than available stock', 'fa-triangle-exclamation');
    return;
  }
  p.stock = type==='IN' ? p.stock + qty : p.stock - qty;
  setData(STORE_KEYS.products, products);

  const log = getData(STORE_KEYS.inventoryLog);
  log.push({id:uid('INV'), productId:p.id, productName:p.name, type, qty, date:new Date().toISOString(), note: note || (type==='IN' ? 'Manual stock in' : 'Manual stock out')});
  setData(STORE_KEYS.inventoryLog, log);

  toast('Stock updated successfully');
  closeStockModal();
  window.refreshInventoryPage && window.refreshInventoryPage();
  drawInventoryHistory();
}

function drawInventoryHistory(){
  const tbody = document.getElementById('inventoryHistoryBody');
  if(!tbody) return;
  const log = getData(STORE_KEYS.inventoryLog).sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,25);
  tbody.innerHTML = log.length ? log.map(l=>`
    <tr>
      <td>${escapeHTML(l.productName)}</td>
      <td>${l.type==='IN' ? '<span class="badge badge-green">Stock In</span>' : '<span class="badge badge-red">Stock Out</span>'}</td>
      <td>${l.qty}</td>
      <td class="text-muted">${escapeHTML(l.note)}</td>
      <td class="text-muted">${formatDateTime(l.date)}</td>
    </tr>
  `).join('') : `<tr><td colspan="5"><div class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i>No stock movements yet</div></td></tr>`;
}

document.addEventListener('DOMContentLoaded', renderInventoryPage);
