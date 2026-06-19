# Toko Lawanglimo — PRD

## Original Problem Statement
Indonesian e-commerce web app like Tokopedia / Shopee. Homepage has 3-slide auto-scrolling photo carousel of the offline store, a Google Maps embed for https://maps.app.goo.gl/ujmyhaeKVCEXRX717, and a primary "Belanja Sekarang" CTA leading to the shopping page. Shop page lists items, supports add-to-cart and buy-now, with category filters. Admin panel lets the owner input products (with description and an optional per-product discount code/percent). Checkout redirects directly to WhatsApp (6281329856815) with the order details.

## User Choices
- WA target: `6281329856815`
- Store photos uploaded via admin panel
- Simple username/password admin login (default `admin/admin123`) – editable in admin panel
- Categories empty by default; admin adds them
- Store name: **Toko Lawanglimo**

## Architecture
- Backend: FastAPI + MongoDB (motor). JWT auth (PyJWT + bcrypt). Emergent Object Storage for image uploads.
- Frontend: React 19 + Tailwind + Shadcn UI + Sonner toast + Embla Carousel (autoplay).
- Routing: `/` (home), `/shop`, `/cart`, `/admin/login`, `/admin`.

## Core Requirements (Static)
1. Homepage: 3-slide auto-scrolling carousel, Maps embed, Belanja Sekarang CTA.
2. Shop page with category filter, add-to-cart and buy-now per product card.
3. Cart page with quantity controls, discount-code input, WhatsApp checkout redirect.
4. Admin panel: products CRUD with image upload + description + discount code/percent + stock; categories CRUD; manage 3 slider images; change admin username/password.
5. Public endpoints must NOT expose `discount_code` field.

## Implemented (2026-02)
- Backend endpoints: `/api/auth/{login,me,change-credentials}`, `/api/products` (public + admin), `/api/categories`, `/api/slides`, `/api/discounts/validate`, `/api/upload`, `/api/files/{path}`.
- Default admin seeded on startup.
- Object Storage initialised at startup; soft-delete via DB flag.
- Frontend: Indonesian copy, Outfit/Plus Jakarta Sans fonts, terracotta primary + WhatsApp green CTA, hero + maps section, full Shop/Cart/Admin flows, sonner toasts, embla autoplay carousel.
- Cart persists across reloads via lazy-initialised localStorage state.

## Backlog (P0 / P1)
- P1: Admin order history / log (currently orders bypass via WhatsApp without DB storage).
- P1: Product detail page with image zoom + related products.
- P1: Pagination / search on admin product list.
- P2: Multi-image product gallery.
- P2: SEO meta tags / OpenGraph for sharing.
- P2: Coupon system: unique-code enforcement and storewide coupons (not tied to a single product).

## Next Actions
- Optional: customise the Maps embed to the exact pinpoint (currently uses query "Lawanglimo").
- Add product detail page if needed.
