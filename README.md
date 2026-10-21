# StockFlow — Inventory & Order Management

**A full-stack JavaScript portfolio demo** built to demonstrate API design, inventory business rules, algorithmic replenishment, transaction validation, and a responsive user interface.

## Features
- Dashboard with inventory value, revenue, order activity, and actionable reorder alerts
- Searchable product inventory; add products and adjust stock
- Order processing with insufficient-stock checks, deduplicated order lines, and persistent updates
- Explainable reorder point calculation: `ceil(avgDailySales * leadDays + safetyStock)`
- CSV export, responsive layout, demo reset, and seeded sample data
- Automated unit tests for core order and replenishment rules

## Quick start

Requirements: **Node.js 20+**. No external runtime packages are required.

```bash
npm start
```

Open **http://localhost:3000**. Run tests with:

```bash
npm test
```

To use a different port: `PORT=8080 npm start` (PowerShell: `$env:PORT=8080; npm start`).

## Architecture

```text
public/index.html + style.css + app.js  → Responsive client-side UI
server.js                               → Node.js HTTP REST API + persistence
lib.js                                  → Pure business logic
/data/store.json                        → Local persisted JSON data
/test/logic.test.js                     → Core automated tests
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/metrics` | Key performance metrics |
| GET | `/api/products` | Product list + derived reorder status |
| POST | `/api/products` | Add product |
| PATCH | `/api/products/:id/stock` | Adjust stock (`{ "delta": 5 }`) |
| GET | `/api/orders` | Order history |
| POST | `/api/orders` | Place order (`{ "items": [{"productId": 1,"quantity": 2}] }`) |
| POST | `/api/reset` | Reset demo seed data |

### Integrity and concurrency
Orders validate all requested items first, merge duplicate product lines, and only then deduct inventory. Mutations are serialized and data is written to a temporary file and atomically renamed. This protects order/stock consistency inside one running Node process. **This is a demo design, not a replacement for proper SQL transactions in a multi-instance production deployment.**

## Trade-offs and roadmap

This is an honest **portfolio demonstration**, not a production-ready enterprise app. It uses a lightweight local JSON store so reviewers can run it instantly without provisioning databases or secrets. It has no accounts, authorization, payments, supplier integration, or cloud AI. Before production use, migrate to PostgreSQL with transactions, add authentication/RBAC, stock movement audit records, request rate-limiting, integration tests, migrations, and monitoring. The reorder algorithm is rule-based, not machine learning. Demo revenue includes synthetic sample orders.

## For reviewers

1. Open Overview to examine inventory performance.
2. Navigate to Products and adjust inventory, add an item, search, or export CSV.
3. Create an order that exceeds stock to see validation; retry with an available quantity.
4. Visit Insights for a transparent explanation of the reorder logic.
5. Run `npm test` to verify core rules.

**Authorship note:** Initial scaffold/code generated with AI assistance. Review, test, customize, and understand this code before presenting it as your work. Do not claim features you did not implement or review.

## License
MIT
