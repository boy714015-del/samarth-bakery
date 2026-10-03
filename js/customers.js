/* =========================================================
   customers.js — Customer management
========================================================= */
let editingCustomerId = null;

function loadCustomers(){ return getData(STORE_KEYS.customers); }
function saveCustomers(list){ setData(STORE_KEYS.customers, list); }

function renderCustomersPage(){
  const root = document.getElementById('customersRoot');
  if(!root) return;
  syncCustomerStatsFromOrders();

  const searchInput = document.getElementById('customerSearch');

  function draw(){
    let list = loadCustomers().sort((a,b)=>b.totalSpent-a.totalSpent);
    const q = (searchInput?.value||'').toLowerCase().trim();
    if(q) list = list.filter(c=> c.name.toLowerCase().includes(q) || c.mobile.includes(q));

    setText('customerCount', list.length + ' customer' + (list.length===1?'':'s'));
    const tbody = document.getElementById('customersBody');
    tbody.innerHTML = list.length ? list.map(c=>`
      <tr>
        <td>
          <div class="cell-prod">
            <div class="cell-thumb"><i class="fa-solid fa-user"></i></div>
            <div style="font-weight:600;">${escapeHTML(c.name)}</div>
          </div>
        </td>
        <td>${escapeHTML(c.mobile)}</td>
        <td>${c.totalOrders}</td>
        <td>${formatCurrency(c.totalSpent)}</td>
        <td class="text-muted">${c.lastOrder ? formatDate(c.lastOrder) : '—'}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-outline btn-icon" title="Edit" onclick="openCustomerModal('${c.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-icon" title="Delete" onclick="deleteCustomer('${c.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-users"></i>No customers found</div></td></tr>`;
  }

  searchInput && searchInput.addEventListener('input', draw);
  draw();
  window.refreshCustomersPage = draw;
}

function openCustomerModal(id){
  editingCustomerId = id || null;
  const modal = document.getElementById('customerModal');
  const title = document.getElementById('customerModalTitle');
  const form = document.getElementById('customerForm');
  form.reset();
  if(id){
    const c = loadCustomers().find(x=>x.id===id);
    if(!c) return;
    title.textContent = 'Edit Customer';
    form.name.value = c.name;
    form.mobile.value = c.mobile;
  }else{
    title.textContent = 'Add Customer';
  }
  modal.classList.add('open');
}
function closeCustomerModal(){
  document.getElementById('customerModal').classList.remove('open');
}
function submitCustomerForm(e){
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const mobile = form.mobile.value.trim();
  if(!name || !/^\d{10}$/.test(mobile)){
    toast('Enter a valid name and 10-digit mobile number', 'fa-triangle-exclamation');
    return;
  }
  let customers = loadCustomers();
  if(editingCustomerId){
    customers = customers.map(c=> c.id===editingCustomerId ? {...c, name, mobile} : c);
    toast('Customer updated successfully');
  }else{
    if(customers.find(c=>c.mobile===mobile)){
      toast('A customer with this mobile number already exists', 'fa-triangle-exclamation');
      return;
    }
    customers.push({id: uid('C'), name, mobile, totalOrders:0, totalSpent:0, lastOrder:''});
    toast('Customer added successfully');
  }
  saveCustomers(customers);
  closeCustomerModal();
  window.refreshCustomersPage && window.refreshCustomersPage();
}
function deleteCustomer(id){
  if(!confirmAction('Delete this customer? Their past orders will remain on record.')) return;
  saveCustomers(loadCustomers().filter(c=>c.id!==id));
  toast('Customer deleted', 'fa-trash');
  window.refreshCustomersPage && window.refreshCustomersPage();
}

document.addEventListener('DOMContentLoaded', renderCustomersPage);
