#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install Node.js 18+ from https://nodejs.org"; exit 1
fi
[ -d node_modules ] || npm install || exit 1
echo "Customer Shop : http://localhost:3000/shop.html"
echo "Admin Login   : http://localhost:3000/index.html  (admin / admin123)"
(sleep 2; (open http://localhost:3000/shop.html || xdg-open http://localhost:3000/shop.html) >/dev/null 2>&1) &
npm start
