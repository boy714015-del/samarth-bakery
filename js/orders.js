/* =========================================================
   orders.js — Order management
========================================================= */
let editingOrderId = null;
let orderFormItems = []; // {productId, name, price, qty}

function loadOrders(){ return getData(STORE_KEYS.orders); }
function saveOrders(list){ setData(STORE_KEYS.orders, list); }

function renderOrdersPage(){
  const root = document.getElementById('ordersRoot');
  if(!root) return;

  const searchInput = document.getElementById('orderSearch');
  const statusFilter = document.getElementById('orderStatusFilter');

  function draw(){
    let list = loadOrders().sort((a,b)=> new Date(b.dateTime)-new Date(a.dateTime));
    const q = (searchInput?.value||'').toLowerCase().trim();
    const st = statusFilter?.value||'';
    if(q) list = list.filter(o=> o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.mobile.includes(q));
    if(st) list = list.filter(o=>o.status===st);

    setText('orderCount', list.length + ' order' + (list.length===1?'':'s'));
    const tbody = document.getElementById('ordersBody');
    tbody.innerHTML = list.length ? list.map(o=>`
      <tr>
        <td>#${escapeHTML(o.id)}</td>
        <td>
          <div style="font-weight:600;">${escapeHTML(o.customerName)}</div>
          <div class="text-muted" style="font-size:.72rem;">${escapeHTML(o.mobile)}</div>
        </td>
        <td>${o.items.map(i=>escapeHTML(i.name)+' x'+i.qty).join(', ')}</td>
        <td>${formatCurrency(o.total)}</td>
        <td>${escapeHTML(o.paymentMethod)}</td>
        <td>
          <select class="field btn-sm" style="padding:.3rem .5rem;" onchange="updateOrderStatus('${o.id}', this.value)">
            ${['Pending','Preparing','Out for Delivery','Delivered','Cancelled'].map(s=>`<option value="${s}" ${s===o.status?'selected':''}>${s}</option>`).join('')}
          </select>
        </td>
        <td class="text-muted">${formatDateTime(o.dateTime)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-outline btn-icon" title="View / Edit" onclick="openOrderModal('${o.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-icon" title="Delete" onclick="deleteOrder('${o.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-receipt"></i>No orders found</div></td></tr>`;
  }

  searchInput && searchInput.addEventListener('input', draw);
  statusFilter && statusFilter.addEventListener('change', draw);
  draw();
  window.refreshOrdersPage = draw;
}

function updateOrderStatus(id, status){
  const orders = loadOrders().map(o=> o.id===id ? {...o, status} : o);
  saveOrders(orders);
  syncCustomerStatsFromOrders();
  toast('Order status updated');
  window.refreshOrdersPage && window.refreshOrdersPage();
}

function deleteOrder(id){
  if(!confirmAction('Delete this order? This cannot be undone.')) return;
  saveOrders(loadOrders().filter(o=>o.id!==id));
  syncCustomerStatsFromOrders();
  toast('Order deleted', 'fa-trash');
  window.refreshOrdersPage && window.refreshOrdersPage();
}

/* ---- Add / Edit order modal ---- */
function openOrderModal(id){
  editingOrderId = id || null;
  orderFormItems = [];
  const modal = document.getElementById('orderModal');
  const title = document.getElementById('orderModalTitle');
  const form = document.getElementById('orderForm');
  form.reset();

  // populate product select
  const productSelect = document.getElementById('orderProductSelect');
  productSelect.innerHTML = loadProducts().map(p=>`<option value="${p.id}">${escapeHTML(p.name)} — ${formatCurrency(p.price)}</option>`).join('');

  if(id){
    const o = loadOrders().find(x=>x.id===id);
    if(!o) return;
    title.textContent = 'Edit Order';
    form.customerName.value = o.customerName;
    form.mobile.value = o.mobile;
    form.paymentMethod.value = o.paymentMethod;
    form.status.value = o.status;
    orderFormItems = o.items.map(i=>({...i}));
  }else{
    title.textContent = 'New Order';
  }
  drawOrderItems();
  modal.classList.add('open');
}
function closeOrderModal(){
  document.getElementById('orderModal').classList.remove('open');
}

function addOrderItem(){
  const select = document.getElementById('orderProductSelect');
  const qtyInput = document.getElementById('orderProductQty');
  const productId = select.value;
  const qty = parseInt(qtyInput.value, 10) || 1;
  const p = loadProducts().find(x=>x.id===productId);
  if(!p) return;
  const existing = orderFormItems.find(i=>i.productId===productId);
  if(existing){ existing.qty += qty; }
  else { orderFormItems.push({productId:p.id, name:p.name, price:p.price, qty}); }
  qtyInput.value = 1;
  drawOrderItems();
}
function removeOrderItem(productId){
  orderFormItems = orderFormItems.filter(i=>i.productId!==productId);
  drawOrderItems();
}
function drawOrderItems(){
  const wrap = document.getElementById('orderItemsList');
  wrap.innerHTML = orderFormItems.length ? orderFormItems.map(i=>`
    <div class="cart-item">
      <div class="info">
        <div class="name">${escapeHTML(i.name)}</div>
        <div class="price">${formatCurrency(i.price)} x ${i.qty} = ${formatCurrency(i.price*i.qty)}</div>
      </div>
      <button type="button" class="btn btn-danger btn-icon btn-sm" onclick="removeOrderItem('${i.productId}')"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `).join('') : `<div class="text-muted" style="font-size:.82rem;padding:.5rem 0;">No products added yet</div>`;
  const total = orderFormItems.reduce((s,i)=>s+i.price*i.qty,0);
  setText('orderFormTotal', formatCurrency(total));
}

function submitOrderForm(e){
  e.preventDefault();
  const form = e.target;
  const customerName = form.customerName.value.trim();
  const mobile = form.mobile.value.trim();
  const paymentMethod = form.paymentMethod.value;
  const status = form.status.value;

  if(!customerName || !mobile || orderFormItems.length===0){
    toast('Add customer details and at least one product', 'fa-triangle-exclamation');
    return;
  }
  const total = orderFormItems.reduce((s,i)=>s+i.price*i.qty,0);
  let orders = loadOrders();

  if(editingOrderId){
    orders = orders.map(o=> o.id===editingOrderId ? {...o, customerName, mobile, paymentMethod, status, items:orderFormItems, total} : o);
    toast('Order updated successfully');
  }else{
    orders.push({
      id: uid('ORD'), customerName, mobile, paymentMethod, status,
      items: orderFormItems, total, dateTime: new Date().toISOString()
    });
    ensureCustomerExists(customerName, mobile);
    toast('Order created successfully');
  }
  saveOrders(orders);
  syncCustomerStatsFromOrders();
  closeOrderModal();
  window.refreshOrdersPage && window.refreshOrdersPage();
}

function ensureCustomerExists(name, mobile){
  const customers = getData(STORE_KEYS.customers);
  if(!customers.find(c=>c.mobile===mobile)){
    customers.push({id: uid('C'), name, mobile, totalOrders:0, totalSpent:0, lastOrder:''});
    setData(STORE_KEYS.customers, customers);
  }
}

document.addEventListener('DOMContentLoaded', renderOrdersPage);
