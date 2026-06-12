# Dissanayaka Super Web POS - Frontend

React frontend for the Dissanayaka Super Web POS system. This app provides the cashier checkout screen, product and supplier management, inventory views, dashboards, reorder workflows, mailbox tools, and reporting screens used by the POS platform.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui and Radix UI
- React Router
- Axios
- Recharts
- Vitest

## Main Features

- Fast POS checkout with product search, barcode scanning, cart management, and invoice flow.
- Live inventory-aware product availability in checkout.
- Product management with CSV import, barcode support, and supplier assignment.
- Inventory stock management, low-stock alerts, reorder planning, and stock history.
- Supplier management with purchase order and reorder workflows.
- Owner and manager dashboards.
- Sales records, returns, export tools, and PDF generation.
- JWT-based authenticated API requests.

## Prerequisites

- Node.js 20 or newer recommended
- npm 10 or newer
- Backend API running on `http://localhost:8080`

This repository contains both `package-lock.json` and `bun.lockb`. The commands below use npm because `package-lock.json` is present and works on most machines. Bun can also be used if your team standardizes on it.

## Quick Start

```powershell
cd "D:\Project\GitHub Project\Dissanayaka Super Web POS\Dissanayake-Super-Web-POS-FrontEnd"
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Environment Variables

The frontend can run without a local `.env` file during development. In that mode, API calls are made to relative `/api/...` paths and Vite proxies them to the backend.

Optional `.env` values:

```env
VITE_BACKEND_URL=http://localhost:8080
VITE_API_URL=http://localhost:8080
```

Use only one of these in normal development. `VITE_BACKEND_URL` and `VITE_API_URL` are both supported by the Axios client and Vite proxy.

## Available Scripts

```powershell
npm run dev
```

Starts the Vite development server on `http://localhost:5173`.

```powershell
npm run build
```

Builds the production app into `dist/`.

```powershell
npm run preview
```

Serves the production build locally.

```powershell
npm run lint
```

Runs ESLint across the project.

```powershell
npm run test
```

Runs the Vitest test suite once.

## Backend Connection

Local development flow:

1. Start the Spring Boot backend on `http://localhost:8080`.
2. Start the frontend with `npm run dev`.
3. Frontend requests like `/api/products` are forwarded by `vite.config.ts` to the backend.

For production, set:

```env
VITE_API_URL=https://your-backend-domain.example
```

## Project Structure

```text
src/
  api/           API helper modules
  components/    Reusable UI and feature components
  context/       Auth, inventory, reorder, toast, and dialog providers
  data/          Shared frontend types and static fallback data
  hooks/         Custom React hooks
  lib/           Axios instance and utility helpers
  pages/         Route-level application screens
  utils/         Formatting, IDs, PDF, and export utilities
```

## Important Runtime Notes

- Login stores the JWT session in `localStorage` under `pos_auth_user`.
- Axios automatically attaches `Authorization: Bearer <token>` for authenticated requests.
- On `401` responses, the app dispatches a session-expired event and redirects users back to login.
- Checkout stock is resolved from `/api/inventory/status`; products without inventory records are treated as unavailable.

## Common Problems

### Frontend opens, but API data is empty

Make sure the backend is running:

```text
http://localhost:8080
```

Also confirm `VITE_BACKEND_URL` or `VITE_API_URL` is not pointing to the wrong server.

### Port `5173` is already in use

Stop the other Vite process, or edit `vite.config.ts` if you intentionally need a different port.

### Build succeeds but lint fails

Fix the ESLint errors shown in the terminal. Some older files may contain existing lint debt; build output is the source of truth for compile readiness.

## Production Build

```powershell
npm install
npm run build
```

Deploy the generated `dist/` directory to any static hosting provider. Configure the hosting environment with `VITE_API_URL` pointing to the deployed backend.
