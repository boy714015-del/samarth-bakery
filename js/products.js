/* =========================================================
   products.js — Product management (Add / Edit / Delete)
========================================================= */
let editingProductId = null;
let tempImageData = '';

function loadProducts(){
  return getData(STORE_KEYS.products);
}
function saveProducts(list){
  setData(STORE_KEYS.products, list);
}

function renderProductsPage(){
  const root = document.getElementById('productsRoot');
  if(!root) return;

  const searchInput = document.getElementById('productSearch');
  const categoryFilter = document.getElementById('productCategoryFilter');
  const products = loadProducts();

  // populate category filter once
  if(categoryFilter && categoryFilter.dataset.filled !== '1'){
    const cats = [...new Set(products.map(p=>p.category))];
    cats.forEach(c=>{
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      categoryFilter.appendChild(opt);
    });
    categoryFilter.dataset.filled = '1';
  }

  function draw(){
    let list = loadProducts();
    const q = (searchInput?.value||'').toLowerCase().trim();
    const cat = categoryFilter?.value||'';
    if(q) list = list.filter(p=>p.name.toLowerCase().includes(q));
    if(cat) list = list.filter(p=>p.category===cat);

    setText('productCount', list.length + ' product' + (list.length===1?'':'s'));
    const tbody = document.getElementById('productsBody');
    tbody.innerHTML = list.length ? list.map(p=>`
      <tr>
        <td>
          <div class="cell-prod">
            <div class="cell-thumb">${productThumbHTML(p)}</div>
            <div>
              <div style="font-weight:600;">${escapeHTML(p.name)}</div>
              <div class="text-muted" style="font-size:.72rem;">${escapeHTML(p.id)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHTML(p.category)}</td>
        <td>${formatCurrency(p.price)}</td>
        <td>${p.stock<=10 ? `<span class="badge badge-red">${p.stock} left</span>` : p.stock}</td>
        <td>${statusBadge(p.status)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-outline btn-icon" title="Edit" onclick="openProductModal('${p.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-icon" title="Delete" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-box-open"></i>No products found</div></td></tr>`;
  }

  searchInput && searchInput.addEventListener('input', draw);
  categoryFilter && categoryFilter.addEventListener('change', draw);
  draw();
  window.refreshProductsPage = draw;
}

function openProductModal(id){
  editingProductId = id || null;
  tempImageData = '';
  const modal = document.getElementById('productModal');
  const title = document.getElementById('productModalTitle');
  const form = document.getElementById('productForm');
  form.reset();
  document.getElementById('imgPreview').innerHTML = '<i class="fa-solid fa-image"></i>';

  if(id){
    const p = loadProducts().find(x=>x.id===id);
    if(!p) return;
    title.textContent = 'Edit Product';
    form.name.value = p.name;
    form.category.value = p.category;
    form.price.value = p.price;
    form.stock.value = p.stock;
    form.status.value = p.status;
    tempImageData = p.image || '';
    document.getElementById('imgPreview').innerHTML = productThumbHTML(p);
  }else{
    title.textContent = 'Add Product';
  }
  modal.classList.add('open');
}
function closeProductModal(){
  document.getElementById('productModal').classList.remove('open');
}

function handleImagePick(input){
  const file = input.files[0];
  if(!file) return;
  if(file.size > 900*1024){
    toast('Image too large — please pick one under 900KB', 'fa-triangle-exclamation');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e=>{
    tempImageData = e.target.result;
    document.getElementById('imgPreview').innerHTML = `<img src="${tempImageData}" alt="preview">`;
  };
  reader.readAsDataURL(file);
}

function submitProductForm(e){
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const category = form.category.value.trim();
  const price = parseFloat(form.price.value);
  const stock = parseInt(form.stock.value, 10);
  const status = form.status.value;

  if(!name || !category || isNaN(price) || price<0 || isNaN(stock) || stock<0){
    toast('Please fill all fields with valid values', 'fa-triangle-exclamation');
    return;
  }

  let products = loadProducts();
  if(editingProductId){
    products = products.map(p=> p.id===editingProductId ? {...p, name, category, price, stock, status, image:tempImageData} : p);
    toast('Product updated successfully');
  }else{
    products.push({
      id: uid('P'), name, category, price, stock, status,
      image: tempImageData, icon:'fa-cookie'
    });
    toast('Product added successfully');
  }
  saveProducts(products);
  closeProductModal();
  window.refreshProductsPage && window.refreshProductsPage();
}

function deleteProduct(id){
  if(!confirmAction('Delete this product? This cannot be undone.')) return;
  const products = loadProducts().filter(p=>p.id!==id);
  saveProducts(products);
  toast('Product deleted', 'fa-trash');
  window.refreshProductsPage && window.refreshProductsPage();
}

document.addEventListener('DOMContentLoaded', renderProductsPage);
