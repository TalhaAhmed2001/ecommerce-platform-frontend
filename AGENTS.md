# Frontend Agent Instructions

This repository is part of a long-term learning and portfolio project for a production-style e-commerce platform. The frontend should stay aligned with the backend architecture and avoid adding UI for modules that do not exist yet.

## Product Direction

- Keep the frontend minimal while the backend foundation is being built.
- Do not add product, cart, order, payment, or notification UI until the corresponding backend modules exist.
- Prefer clear, maintainable UI code over broad feature work.
- Treat this as public GitHub portfolio code.

## Tech Stack

- React
- TypeScript
- Vite
- React Router

## Architecture Expectations

- Keep API access behind small client wrappers.
- Use route/page components for screens and small shared components for repeated UI.
- Keep auth behavior compatible with httpOnly cookie-based backend auth.
- Use `credentials: "include"` for backend API calls that depend on cookies.
- Avoid unnecessary state-management libraries until the app needs them.

## Change Guidance

- Keep diffs focused and avoid speculative rewrites.
- Match existing naming, layout, and TypeScript style.
- Add loading and error states for user-facing async flows.
- Do not introduce product/catalog/order UI before backend support exists.

## Related Repositories

- Frontend repository: https://github.com/TalhaAhmed2001/ecommerce-platform-frontend
- Backend repository: https://github.com/TalhaAhmed2001/ecommerce-platform-backend
