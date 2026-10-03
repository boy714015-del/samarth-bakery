# Samarth Bakery - Full Stack Version

HTML/CSS/JavaScript frontend + Node.js + Express backend. Data is saved in `data/db.json` (no MongoDB needed).

## Requirements
- Node.js 18+ recommended
- VS Code (optional)

## Direct Run (Windows)

After Node.js is installed, double-click:

`START-SAMARTH-BAKERY.bat`

It installs packages the first time, starts the server and opens the shop in your browser.
Live Server is **not** required - the same server serves both the frontend and backend.

## Direct Run (Mac / Linux)

```bash
chmod +x start-samarth-bakery.sh
./start-samarth-bakery.sh
```

## Run in VS Code

1. Open the `Samarth-Bakery` folder in VS Code.
2. Open Terminal and run:

```bash
npm install
npm start
```

`npm install` is needed only the first time. Later runs: just `npm start`.

## Links
- Customer shop : http://localhost:3000/shop.html
- Admin login   : http://localhost:3000/index.html
- Backend check : http://localhost:3000/api/health  (should show `"status": "running"`)

## Admin demo
Username: `admin`
Password: `admin123`

## API
- GET  `/api/health`
- GET  `/api/products`
- POST `/api/orders`
- GET / PUT `/api/data/:key`  (`bakery_products`, `bakery_customers`, `bakery_orders`, `bakery_inventory_log`)

## Data
Products, customers and orders are saved in `data/db.json`. The first time the server starts, demo data is created automatically.

**Reset data:** stop the server, delete `data/db.json`, start again.

## Customer accounts (new)
On the shop page: **Login / Register** buttons (next to Admin login). Customers register with mobile + password (passwords are stored hashed in `data/db.json`). Logged-in customers get auto-filled checkout, **My orders** and **Reorder**.

## New shop options
Search, category chips, sort (price / name), favourites (heart), product details popup, home delivery or pickup, preferred date & time, order status in My orders.

## Real product photos
Run once with internet: `npm run photos` (downloads free photos from Wikimedia Commons into `images/`, credits in `images/CREDITS.txt`), then restart. Check each photo; replace any wrong one from Admin > Products > Edit.

## Product photos
Photos live in `images/`. To use your own photo, put the file in `images/` and either edit the product in Admin > Products > Edit and upload the image, or change the `image` path in `data/db.json`.

## Change port
Windows (cmd): `set PORT=4000 && npm start`

## v7 — iOS 26 "Liquid Glass" look + new options
- **iOS 26 look everywhere**: `css/ios26.css` (shop) and `css/ios26-admin.css` (all admin pages) load last and restyle everything: glossy glass with bright rim light, floating capsule header, floating sidebar, big rounded corners, spring animations, sheet-style cart drawer and popups. Dark mode (moon button) is supported.
- **Floating glass tab bar** on the shop (Home / Menu / Saved / Cart / Account) with a sliding glass "lens" and a cart count badge.
- **Buy now** button on every product card and in the product popup: it adds the item and opens the checkout form directly.
- **5 new categories, 10 new products**: Cupcakes & Muffins, Brownies & Desserts, Sandwiches & Burgers, Drinks & Shakes, Eggless Cakes. Existing `data/db.json` gets them automatically once on the next start (if you delete them later they will not come back).
- Category chips now scroll sideways with an icon and item count; new sort option "Newest first".
- Admin > Products: the category box suggests the new categories (you can still type any new category).
