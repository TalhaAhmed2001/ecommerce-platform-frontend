# E-Commerce Platform Frontend

Minimal React frontend for the production-style e-commerce platform.

Related backend repository: https://github.com/TalhaAhmed2001/ecommerce-platform-backend

## Stack

- React
- TypeScript
- Vite
- React Router
- Vitest + Testing Library

## Current Scope

Implemented pages:

- `/register`
- `/login`
- `/dashboard`
- `/products`
- `/cart`
- `/orders`
- `/orders/:orderId`
- `/admin/products`

Implemented behavior:

- Cookie-based registration, login, session refresh, current-user lookup, and logout
- Public product browsing with current inventory availability
- Frontend-only `localStorage` cart with quantity controls and navigation count updates
- Checkout that sends only product identifiers and quantities to the backend
- Clear checkout errors for stale products, unavailable products, and insufficient stock
- Customer order history and detailed authoritative order totals and item snapshots
- Fake payment success and failure controls for pending orders
- Cart clearing only after payment success; checkout creation and payment failure preserve it
- Administrator product creation, activation/deactivation, and stock management

The API client uses `credentials: "include"` so httpOnly authentication cookies are sent with requests and attempts one refresh after an unauthorized protected request.

Intentionally not implemented yet:

- Backend-managed or synchronized cart
- Real payment-provider UI
- Notifications
- Broader state-management framework
- Production deployment infrastructure

## Trust Boundary

Cart names, prices, availability, line totals, and totals are display-only snapshots stored in the browser. Checkout sends only `productId` and `quantity`; the backend is responsible for validating products and inventory and calculating all authoritative prices and totals.

## API Configuration

Set the backend API base URL with:

```text
VITE_API_BASE_URL=http://localhost:4000
```

The backend is expected to allow the frontend origin through CORS and credentials. For local development, the backend should run on `http://localhost:4000` and the frontend on `http://localhost:5173`.

## Commands

Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run tests:

```bash
npm test
```

## Project Direction

This frontend remains intentionally small and aligned with backend capabilities. Near-term work should focus on full-stack integration quality, route/session UX, and closing API contract gaps before introducing additional commerce modules or infrastructure.

Project-specific agent guidance is documented in `AGENTS.md`.
