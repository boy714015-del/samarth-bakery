/* =========================================================
   billing.js — Billing / POS
========================================================= */
let cart = []; // {productId, name, price, qty, stock}
let selectedCategory = '';
let selectedPayMethod = 'Cash';
let lastInvoice = null;

function renderBillingPage(){
  const root = document.getElementById('billingRoot');
  if(!root) return;

  const products = getData(STORE_KEYS.products).filter(p=>p.status==='Active');
  const cats = ['All', ...new Set(products.map(p=>p.category))];
  const catWrap = document.getElementById('posCategories');
  catWrap.innerHTML = cats.map(c=>`<button type="button" class="chip ${(!selectedCategory && c==='All') || selectedCategory===c ? 'active':''}" data-cat="${c==='All'?'':c}">${c}</button>`).join('');
  catWrap.querySelectorAll('.chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{ selectedCategory = chip.dataset.cat; drawProductGrid(); catWrap.querySelectorAll('.chip').forEach(c=>c.classList.remove('active')); chip.classList.add('active'); });
  });

  drawProductGrid();
  drawCart();

  document.getElementById('posSearch').addEventListener('input', drawProductGrid);

  document.querySelectorAll('.pay-method').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.pay-method').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      selectedPayMethod = btn.dataset.method;
    });
  });

  document.getElementById('discountInput').addEventListener('input', drawCart);
  document.getElementById('gstInput').addEventListener('input', drawCart);
  document.getElementById('customerNameInput').addEventListener('input', ()=>{});
}

function drawProductGrid(){
  const grid = document.getElementById('posProducts');
  const q = (document.getElementById('posSearch').value||'').toLowerCase().trim();
  let products = getData(STORE_KEYS.products).filter(p=>p.status==='Active');
  if(selectedCategory) products = products.filter(p=>p.category===selectedCategory);
  if(q) products = products.filter(p=>p.name.toLowerCase().includes(q));

  grid.innerHTML = products.length ? products.map(p=>`
    <button type="button" class="pos-product-card" ${p.stock<=0?'disabled':''} onclick="addToCart('${p.id}')">
      <div class="thumb">${productThumbHTML(p)}</div>
      <div class="name">${escapeHTML(p.name)}</div>
      <div class="price">${formatCurrency(p.price)}</div>
      <div class="stock-note">${p.stock<=0 ? 'Out of stock' : p.stock + ' in stock'}</div>
    </button>
  `).join('') : `<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-cookie"></i>No products found</div>`;
}

function addToCart(productId){
  const p = getData(STORE_KEYS.products).find(x=>x.id===productId);
  if(!p || p.stock<=0) return;
  const existing = cart.find(i=>i.productId===productId);
  if(existing){
    if(existing.qty >= p.stock){ toast('No more stock available', 'fa-triangle-exclamation'); return; }
    existing.qty++;
  }else{
    cart.push({productId:p.id, name:p.name, price:p.price, qty:1, stock:p.stock});
  }
  drawCart();
}
function changeCartQty(productId, delta){
  const item = cart.find(i=>i.productId===productId);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){ cart = cart.filter(i=>i.productId!==productId); }
  else if(item.qty > item.stock){ item.qty = item.stock; toast('Reached available stock limit', 'fa-triangle-exclamation'); }
  drawCart();
}
function removeCartItem(productId){
  cart = cart.filter(i=>i.productId!==productId);
  drawCart();
}

function computeBillTotals(){
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const discountPct = parseFloat(document.getElementById('discountInput').value)||0;
  const gstPct = parseFloat(document.getElementById('gstInput').value)||0;
  const discountAmt = subtotal * (discountPct/100);
  const afterDiscount = subtotal - discountAmt;
  const gstAmt = afterDiscount * (gstPct/100);
  const grandTotal = afterDiscount + gstAmt;
  return {subtotal, discountPct, discountAmt, gstPct, gstAmt, grandTotal};
}

function drawCart(){
  const wrap = document.getElementById('cartList');
  wrap.innerHTML = cart.length ? cart.map(i=>`
    <div class="cart-item">
      <div class="info">
        <div class="name">${escapeHTML(i.name)}</div>
        <div class="price">${formatCurrency(i.price)} each</div>
      </div>
      <div class="qty-control">
        <button type="button" onclick="changeCartQty('${i.productId}', -1)"><i class="fa-solid fa-minus"></i></button>
        <span>${i.qty}</span>
        <button type="button" onclick="changeCartQty('${i.productId}', 1)"><i class="fa-solid fa-plus"></i></button>
      </div>
      <button type="button" class="btn btn-danger btn-icon btn-sm" onclick="removeCartItem('${i.productId}')"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `).join('') : `<div class="text-muted" style="font-size:.85rem;padding:1rem 0;text-align:center;">Cart is empty — tap a product to add it</div>`;

  const t = computeBillTotals();
  setText('posSubtotal', formatCurrency2(t.subtotal));
  setText('posDiscountAmt', '- ' + formatCurrency2(t.discountAmt));
  setText('posGstAmt', '+ ' + formatCurrency2(t.gstAmt));
  setText('posGrandTotal', formatCurrency2(t.grandTotal));
}

function saveOrderFromBilling(){
  if(cart.length===0){ toast('Add at least one product to the cart', 'fa-triangle-exclamation'); return; }
  const name = document.getElementById('customerNameInput').value.trim();
  const mobile = document.getElementById('customerMobileInput').value.trim();
  if(!name || !/^\d{10}$/.test(mobile)){
    toast('Enter a valid customer name and 10-digit mobile number', 'fa-triangle-exclamation');
    return;
  }
  const t = computeBillTotals();
  const orderId = uid('ORD');
  const dateTime = new Date().toISOString();
  const items = cart.map(i=>({productId:i.productId, name:i.name, price:i.price, qty:i.qty}));

  // Save order
  const orders = getData(STORE_KEYS.orders);
  orders.push({
    id: orderId, customerName:name, mobile, items,
    total: Math.round(t.grandTotal),
    paymentMethod: selectedPayMethod, status:'Delivered', dateTime
  });
  setData(STORE_KEYS.orders, orders);

  // Update stock + log inventory
  const products = getData(STORE_KEYS.products);
  const log = getData(STORE_KEYS.inventoryLog);
  cart.forEach(i=>{
    const p = products.find(x=>x.id===i.productId);
    if(p){
      p.stock = Math.max(0, p.stock - i.qty);
      log.push({id:uid('INV'), productId:p.id, productName:p.name, type:'OUT', qty:i.qty, date:dateTime, note:'Sold via Billing — Order #'+orderId});
    }
  });
  setData(STORE_KEYS.products, products);
  setData(STORE_KEYS.inventoryLog, log);

  // Update / create customer
  const customers = getData(STORE_KEYS.customers);
  if(!customers.find(c=>c.mobile===mobile)){
    customers.push({id: uid('C'), name, mobile, totalOrders:0, totalSpent:0, lastOrder:''});
    setData(STORE_KEYS.customers, customers);
  }
  syncCustomerStatsFromOrders();

  lastInvoice = {orderId, name, mobile, items, t, dateTime, paymentMethod:selectedPayMethod};
  toast('Order saved successfully');
  renderPrintInvoice(lastInvoice);

  // reset
  cart = [];
  document.getElementById('discountInput').value = 0;
  document.getElementById('customerNameInput').value = '';
  document.getElementById('customerMobileInput').value = '';
  drawCart();
  drawProductGrid();
}

function renderPrintInvoice(inv){
  const el = document.getElementById('invoicePrintArea');
  if(!el) return;
  el.innerHTML = `
    <div class="invoice-head">
      <div>
        <h2>Samarth Bakery</h2>
        <div>Fresh baked goods, made daily</div>
      </div>
      <div style="text-align:right;">
        <div><strong>Invoice #${escapeHTML(inv.orderId)}</strong></div>
        <div>${formatDateTime(inv.dateTime)}</div>
      </div>
    </div>
    <div style="margin-bottom:10px;">
      <div><strong>Customer:</strong> ${escapeHTML(inv.name)}</div>
      <div><strong>Mobile:</strong> ${escapeHTML(inv.mobile)}</div>
      <div><strong>Payment:</strong> ${escapeHTML(inv.paymentMethod)}</div>
    </div>
    <table class="invoice-table">
      <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
      <tbody>
        ${inv.items.map(i=>`<tr><td>${escapeHTML(i.name)}</td><td>${i.qty}</td><td>${formatCurrency2(i.price)}</td><td>${formatCurrency2(i.price*i.qty)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="invoice-total">
      Subtotal: ${formatCurrency2(inv.t.subtotal)}<br>
      Discount (${inv.t.discountPct}%): -${formatCurrency2(inv.t.discountAmt)}<br>
      GST (${inv.t.gstPct}%): +${formatCurrency2(inv.t.gstAmt)}<br>
      Grand Total: ${formatCurrency2(inv.t.grandTotal)}
    </div>
  `;
}

function printBill(){
  if(cart.length===0 && !lastInvoice){ toast('Add products and save the order first', 'fa-triangle-exclamation'); return; }
  if(cart.length>0){
    // Print a preview of current cart without saving
    const t = computeBillTotals();
    renderPrintInvoice({
      orderId:'PREVIEW', name:document.getElementById('customerNameInput').value||'Walk-in Customer',
      mobile:document.getElementById('customerMobileInput').value||'-',
      items:cart, t, dateTime:new Date().toISOString(), paymentMethod:selectedPayMethod
    });
  }
  window.print();
}

document.addEventListener('DOMContentLoaded', renderBillingPage);
