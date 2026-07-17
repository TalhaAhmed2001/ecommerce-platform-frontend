# E-Commerce Platform Frontend

Minimal React frontend for the e-commerce platform authentication flow.

Related backend repository: https://github.com/TalhaAhmed2001/ecommerce-platform-backend

## Stack

- React
- TypeScript
- Vite
- React Router

## Current Scope

Implemented pages:

- `/register`
- `/login`
- `/dashboard`

The frontend calls the backend auth API with `credentials: "include"` so httpOnly auth cookies are sent with requests.

Not implemented yet:

- Product UI
- Cart UI
- Order UI
- Payment UI

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

## Project Direction

This frontend is intentionally minimal while the backend foundation is being built. Future UI should stay aligned with the modular backend and avoid adding product, cart, or order screens before the corresponding backend modules exist.

Project-specific agent guidance is documented in `AGENTS.md`.
