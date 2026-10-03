/* =========================================================
   Samarth Bakery — server.js
   Express backend. NO MongoDB: data is saved in data/db.json
========================================================= */
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const KEYS = ['bakery_products', 'bakery_customers', 'bakery_orders', 'bakery_inventory_log'];

app.use(express.json({ limit: '5mb' }));

/* ---------------- JSON "database" ---------------- */
function seedDB() {
  const products = [
    { id: 'P-1001', name: 'Birthday Cake', category: 'Cakes', price: 650, stock: 14, image: 'images/birthday-cake.svg', status: 'Active', icon: 'fa-cake-candles' },
    { id: 'P-1002', name: 'Chocolate Cake', category: 'Cakes', price: 500, stock: 18, image: 'images/chocolate-cake.svg', status: 'Active', icon: 'fa-cake-candles' },
    { id: 'P-1003', name: 'Pineapple Cake', category: 'Cakes', price: 480, stock: 9, image: 'images/pineapple-cake.svg', status: 'Active', icon: 'fa-cake-candles' },
    { id: 'P-1004', name: 'Pastry', category: 'Pastries', price: 60, stock: 40, image: 'images/pastry.svg', status: 'Active', icon: 'fa-cookie' },
    { id: 'P-1005', name: 'Bread', category: 'Bakery', price: 45, stock: 35, image: 'images/bread.svg', status: 'Active', icon: 'fa-bread-slice' },
    { id: 'P-1006', name: 'Bun', category: 'Bakery', price: 15, stock: 8, image: 'images/bun.svg', status: 'Active', icon: 'fa-bread-slice' },
    { id: 'P-1007', name: 'Cream Roll', category: 'Pastries', price: 35, stock: 25, image: 'images/cream-roll.svg', status: 'Active', icon: 'fa-cookie' },
    { id: 'P-1008', name: 'Cookies', category: 'Biscuits', price: 120, stock: 30, image: 'images/cookies.svg', status: 'Active', icon: 'fa-cookie-bite' },
    { id: 'P-1009', name: 'Khari', category: 'Biscuits', price: 80, stock: 22, image: 'images/khari.svg', status: 'Active', icon: 'fa-cookie-bite' },
    { id: 'P-1010', name: 'Toast', category: 'Bakery', price: 70, stock: 6, image: 'images/toast.svg', status: 'Active', icon: 'fa-bread-slice' },
    { id: 'P-1011', name: 'Puffs', category: 'Snacks', price: 30, stock: 28, image: 'images/puffs.svg', status: 'Active', icon: 'fa-stroopwafel' },
    { id: 'P-1012', name: 'Donuts', category: 'Snacks', price: 45, stock: 20, image: 'images/donuts.svg', status: 'Active', icon: 'fa-stroopwafel' },
    { id: 'P-1013', name: 'Chocolate Cupcake', category: 'Cupcakes & Muffins', price: 40, stock: 30, image: 'images/chocolate-cupcake.svg', status: 'Active', icon: 'fa-cookie' },
    { id: 'P-1014', name: 'Blueberry Muffin', category: 'Cupcakes & Muffins', price: 55, stock: 24, image: 'images/blueberry-muffin.svg', status: 'Active', icon: 'fa-cookie' },
    { id: 'P-1015', name: 'Walnut Brownie', category: 'Brownies & Desserts', price: 70, stock: 26, image: 'images/walnut-brownie.svg', status: 'Active', icon: 'fa-ice-cream' },
    { id: 'P-1016', name: 'Choco Lava Cake', category: 'Brownies & Desserts', price: 85, stock: 18, image: 'images/choco-lava.svg', status: 'Active', icon: 'fa-ice-cream' },
    { id: 'P-1017', name: 'Veg Grilled Sandwich', category: 'Sandwiches & Burgers', price: 60, stock: 20, image: 'images/veg-sandwich.svg', status: 'Active', icon: 'fa-burger' },
    { id: 'P-1018', name: 'Veg Burger', category: 'Sandwiches & Burgers', price: 55, stock: 20, image: 'images/veg-burger.svg', status: 'Active', icon: 'fa-burger' },
    { id: 'P-1019', name: 'Cold Coffee', category: 'Drinks & Shakes', price: 70, stock: 25, image: 'images/cold-coffee.svg', status: 'Active', icon: 'fa-mug-hot' },
    { id: 'P-1020', name: 'Chocolate Shake', category: 'Drinks & Shakes', price: 90, stock: 25, image: 'images/chocolate-shake.svg', status: 'Active', icon: 'fa-mug-hot' },
    { id: 'P-1021', name: 'Eggless Black Forest', category: 'Eggless Cakes', price: 520, stock: 10, image: 'images/eggless-black-forest.svg', status: 'Active', icon: 'fa-cake-candles' },
    { id: 'P-1022', name: 'Eggless Butterscotch', category: 'Eggless Cakes', price: 500, stock: 10, image: 'images/eggless-butterscotch.svg', status: 'Active', icon: 'fa-cake-candles' }
  ];
  const customers = [
    { id: 'C-2001', name: 'Rohan Patil', mobile: '9876543210', totalOrders: 0, totalSpent: 0, lastOrder: '' },
    { id: 'C-2002', name: 'Sneha Kulkarni', mobile: '9822345671', totalOrders: 0, totalSpent: 0, lastOrder: '' },
    { id: 'C-2003', name: 'Amit Deshmukh', mobile: '9765432109', totalOrders: 0, totalSpent: 0, lastOrder: '' }
  ];
  const P = n => products.find(p => p.name === n);
  const it = (n, qty) => ({ productId: P(n).id, name: n, price: P(n).price, qty });
  const mk = (id, customerName, mobile, items, paymentMethod, status, daysBack, hour) => {
    const d = new Date(); d.setDate(d.getDate() - daysBack); d.setHours(hour, 15, 0, 0);
    return { id, customerName, mobile, items, total: items.reduce((s, i) => s + i.price * i.qty, 0), paymentMethod, status, dateTime: d.toISOString() };
  };
  const orders = [
    mk('ORD-3001', 'Rohan Patil', '9876543210', [it('Chocolate Cake', 1), it('Pastry', 4)], 'UPI', 'Delivered', 0, 10),
    mk('ORD-3002', 'Sneha Kulkarni', '9822345671', [it('Bread', 2), it('Bun', 6)], 'Cash', 'Delivered', 0, 12),
    mk('ORD-3003', 'Amit Deshmukh', '9765432109', [it('Birthday Cake', 1)], 'Card', 'Preparing', 0, 15),
    mk('ORD-3004', 'Rohan Patil', '9876543210', [it('Cookies', 2), it('Donuts', 4)], 'UPI', 'Delivered', 1, 11),
    mk('ORD-3005', 'Sneha Kulkarni', '9822345671', [it('Cream Roll', 5)], 'Cash', 'Delivered', 2, 9),
    mk('ORD-3006', 'Amit Deshmukh', '9765432109', [it('Pineapple Cake', 1), it('Puffs', 3)], 'UPI', 'Delivered', 3, 16),
    mk('ORD-3007', 'Rohan Patil', '9876543210', [it('Toast', 2), it('Khari', 1)], 'Cash', 'Cancelled', 4, 10),
    mk('ORD-3008', 'Sneha Kulkarni', '9822345671', [it('Chocolate Cake', 1)], 'Card', 'Delivered', 5, 13),
    mk('ORD-3009', 'Amit Deshmukh', '9765432109', [it('Donuts', 6)], 'UPI', 'Delivered', 7, 17),
    mk('ORD-3010', 'Rohan Patil', '9876543210', [it('Bread', 3), it('Cookies', 1)], 'Cash', 'Delivered', 9, 10)
  ];
  const db = { bakery_products: products, bakery_customers: customers, bakery_orders: orders, bakery_inventory_log: [] };
  recalcCustomers(db);
  return db;
}

function recalcCustomers(db) {
  db.bakery_customers.forEach(c => {
    const mine = db.bakery_orders.filter(o => o.mobile === c.mobile && o.status !== 'Cancelled');
    c.totalOrders = mine.length;
    c.totalSpent = mine.reduce((s, o) => s + o.total, 0);
    c.lastOrder = mine.length ? mine.map(o => o.dateTime).sort().pop() : '';
  });
}

function loadDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) saveDB(seedDB());
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    KEYS.forEach(k => { if (!Array.isArray(db[k])) db[k] = []; });
    if (!Array.isArray(db.bakery_users)) db.bakery_users = [];
    if (!db.sessions || typeof db.sessions !== 'object') db.sessions = {};
    // v7 migration: add the new categories/products once to an existing db.json (never re-adds if the owner deletes them)
    if (!db.meta_v7_products) {
      const have = new Set(db.bakery_products.map(p => p.id));
      seedDB().bakery_products.filter(p => Number(p.id.slice(2)) >= 1013 && !have.has(p.id)).forEach(p => db.bakery_products.push(p));
      db.meta_v7_products = true; saveDB(db);
    }
    // if a real photo (images/<name>.jpg) exists, use it instead of the drawing
    db.bakery_products.forEach(p => {
      const slug = path.basename(p.image || '').replace(/\.\w+$/, '');
      if (/\.svg$/i.test(p.image || '') && fs.existsSync(path.join(__dirname, 'images', slug + '.jpg'))) p.image = 'images/' + slug + '.jpg';
    });
    return db;
  } catch (e) {
    console.error('db.json is corrupted, re-creating it.', e.message);
    const db = seedDB(); saveDB(db); return db;
  }
}
function saveDB(db) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE); // safe write
}

/* ---------------- Health check ---------------- */
app.get('/api/health', (req, res) => {
  res.json({ name: 'Samarth Bakery Backend', version: '1.0.0', status: 'running', api: '/api/health' });
});

/* ---------------- Public API (customer shop) ---------------- */
app.get('/api/products', (req, res) => {
  const db = loadDB();
  res.json(db.bakery_products.filter(p => p.status === 'Active'));
});

const COUPONS = {
  SAMARTH10: { pct: 10, min: 200, label: '10% off on orders above ₹200' },
  SWEET50: { flat: 50, min: 400, label: '₹50 off on orders above ₹400' }
};
const couponOff = (code, sub) => { const c = COUPONS[String(code || '').toUpperCase()]; if (!c) return -1; if (sub < c.min) return -2; return Math.min(sub, c.pct ? Math.round(sub * c.pct / 100) : c.flat); };
app.get('/api/coupons', (req, res) => res.json(COUPONS));

app.post('/api/orders', (req, res) => {
  const { customerName, mobile, address, note, paymentMethod, items, fulfilment, slot } = req.body || {};
  const name = String(customerName || '').trim();
  const phone = String(mobile || '').replace(/\D/g, '');
  const a = auth(req);
  const fulfil = fulfilment === 'Pickup' ? 'Pickup' : 'Delivery';
  const pay = ['Cash', 'UPI', 'Card'].includes(paymentMethod) ? paymentMethod : 'Cash';

  if (!name) return res.status(400).json({ error: 'Please enter your name.' });
  if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Your cart is empty.' });

  if (fulfil === 'Delivery' && !String(address || '').trim()) return res.status(400).json({ error: 'Please enter the delivery address (or choose Pickup).' });

  const db = loadDB();
  const lines = [];
  for (const row of items) {
    const qty = parseInt(row.qty, 10);
    const p = db.bakery_products.find(x => x.id === row.productId);
    if (!p || p.status !== 'Active') return res.status(400).json({ error: 'A product in your cart is no longer available.' });
    if (!(qty > 0)) return res.status(400).json({ error: 'Invalid quantity for ' + p.name + '.' });
    if (qty > p.stock) return res.status(400).json({ error: `Only ${p.stock} ${p.name} left in stock.` });
    lines.push({ p, qty });
  }

  // prices are taken from the server, never from the browser
  const orderItems = lines.map(({ p, qty }) => ({ productId: p.id, name: p.name, price: p.price, qty }));
  const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0; const code = String((req.body || {}).coupon || '').toUpperCase();
  if (code) { discount = couponOff(code, subtotal); if (discount === -1) return res.status(400).json({ error: 'Invalid coupon code.' }); if (discount === -2) return res.status(400).json({ error: 'Coupon needs a higher order amount.' }); }
  lines.forEach(({ p, qty }) => { p.stock -= qty; });

  const maxNo = db.bakery_orders.reduce((m, o) => Math.max(m, parseInt(String(o.id).replace(/\D/g, ''), 10) || 0), 3000);
  const order = {
    id: 'ORD-' + (maxNo + 1),
    customerName: name,
    mobile: phone,
    items: orderItems,
    total: subtotal - discount,
    discount, coupon: discount ? code : '',
    paymentMethod: pay,
    status: 'Pending',
    dateTime: new Date().toISOString(),
    address: String(address || '').trim(),
    note: String(note || '').trim(),
    source: 'Online',
    fulfilment: fulfil,
    slot: String(slot || '').trim(),
    userId: a ? a.u.id : ''
  };
  db.bakery_orders.push(order);

  if (!db.bakery_customers.find(c => c.mobile === phone)) {
    const maxC = db.bakery_customers.reduce((m, c) => Math.max(m, parseInt(String(c.id).replace(/\D/g, ''), 10) || 0), 2000);
    db.bakery_customers.push({ id: 'C-' + (maxC + 1), name, mobile: phone, totalOrders: 0, totalSpent: 0, lastOrder: '' });
  }
  recalcCustomers(db);
  saveDB(db);
  res.status(201).json(order);
});

/* ---------------- Customer accounts (register / login) ---------------- */
const hashPw = (p, salt) => crypto.scryptSync(String(p), salt, 32).toString('hex');
const pubUser = u => ({ id: u.id, name: u.name, mobile: u.mobile, address: u.address || '' });
function auth(req) {
  const t = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!t) return null;
  const db = loadDB(), s = db.sessions[t];
  const u = s && db.bakery_users.find(x => x.id === s.userId);
  return u ? { db, u, t } : null;
}
function startSession(db, u) {
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[token] = { userId: u.id, created: new Date().toISOString() };
  return token;
}
app.post('/api/register', (req, res) => {
  const { name, mobile, password, address } = req.body || {};
  const n = String(name || '').trim(), phone = String(mobile || '').replace(/\D/g, '');
  if (!n) return res.status(400).json({ error: 'Please enter your name.' });
  if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  if (String(password || '').length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const db = loadDB();
  if (db.bakery_users.some(u => u.mobile === phone)) return res.status(409).json({ error: 'This mobile is already registered. Please login.' });
  const maxU = db.bakery_users.reduce((m, u) => Math.max(m, parseInt(String(u.id).replace(/\D/g, ''), 10) || 0), 5000);
  const salt = crypto.randomBytes(16).toString('hex');
  const u = { id: 'U-' + (maxU + 1), name: n, mobile: phone, address: String(address || '').trim(), salt, hash: hashPw(password, salt), created: new Date().toISOString() };
  db.bakery_users.push(u);
  if (!db.bakery_customers.find(c => c.mobile === phone)) {
    const maxC = db.bakery_customers.reduce((m, c) => Math.max(m, parseInt(String(c.id).replace(/\D/g, ''), 10) || 0), 2000);
    db.bakery_customers.push({ id: 'C-' + (maxC + 1), name: n, mobile: phone, totalOrders: 0, totalSpent: 0, lastOrder: '' });
  }
  const token = startSession(db, u); saveDB(db);
  res.status(201).json({ token, user: pubUser(u) });
});
app.post('/api/login', (req, res) => {
  const phone = String((req.body || {}).mobile || '').replace(/\D/g, '');
  const db = loadDB(), u = db.bakery_users.find(x => x.mobile === phone);
  const ok = u && crypto.timingSafeEqual(Buffer.from(hashPw((req.body || {}).password || '', u.salt)), Buffer.from(u.hash));
  if (!ok) return res.status(401).json({ error: 'Wrong mobile number or password.' });
  const token = startSession(db, u); saveDB(db);
  res.json({ token, user: pubUser(u) });
});
app.get('/api/me', (req, res) => { const a = auth(req); a ? res.json(pubUser(a.u)) : res.status(401).json({ error: 'Not logged in' }); });
app.post('/api/logout', (req, res) => { const a = auth(req); if (a) { delete a.db.sessions[a.t]; saveDB(a.db); } res.json({ ok: true }); });
app.get('/api/my-orders', (req, res) => {
  const a = auth(req); if (!a) return res.status(401).json({ error: 'Please login.' });
  res.json(a.db.bakery_orders.filter(o => o.mobile === a.u.mobile).sort((x, y) => new Date(y.dateTime) - new Date(x.dateTime)));
});

/* ---------------- Admin data API (used by admin pages) ---------------- */
app.get('/api/data/:key', (req, res) => {
  if (!KEYS.includes(req.params.key)) return res.status(404).json({ error: 'Unknown key' });
  res.json(loadDB()[req.params.key]);
});
app.put('/api/data/:key', (req, res) => {
  if (!KEYS.includes(req.params.key)) return res.status(404).json({ error: 'Unknown key' });
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Array expected' });
  const db = loadDB();
  db[req.params.key] = req.body;
  saveDB(db);
  res.json({ ok: true });
});

/* ---------------- Static files & routes ---------------- */
app.get('/', (req, res) => res.redirect('/shop.html'));
// never expose the database file or server source through static hosting
app.use((req, res, next) => {
  if (/^\/(data|node_modules)(\/|$)|^\/(server\.js|package(-lock)?\.json)$/i.test(req.path)) return res.status(403).send('Forbidden');
  next();
});
app.use(express.static(__dirname, { index: false }));

loadDB();
app.listen(PORT, () => {
  console.log('\n  Samarth Bakery is running!');
  console.log(`  Customer shop : http://localhost:${PORT}/shop.html`);
  console.log(`  Admin login   : http://localhost:${PORT}/index.html  (admin / admin123)\n`);
});
