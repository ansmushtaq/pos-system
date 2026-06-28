# POS System — Rules & Constraints

> Re-read this file before every action. These rules are non-negotiable.
> Schema, folder structure, business logic, and cycle plan are in `MASTER_CONTEXT.md`.

---

## 1. Session Workflow

> Follow this order every session without skipping steps.

### Step 1 — Orient before acting
- Read `MASTER_CONTEXT.md` from top to bottom.
- Check Section 21 (Session Status) to see what has been completed.
- Identify the current cycle and its scope.
- If scope is unclear or conflicts with anything here, **ask before proceeding**.

### Step 2 — Plan before coding
Before writing any code:
- Identify all Prisma models it touches.
- Identify which services, routes, and validators are involved.
- Identify files that already exist and must not be regenerated.
- State out loud what you will create vs. modify before starting.

### Step 3 — Code incrementally
- **Never regenerate an existing file** unless explicitly instructed with the words "rewrite" or "regenerate."
- When modifying an existing file, make targeted edits only.
- Create files only in paths defined in `MASTER_CONTEXT.md` Section 3 (Folder Structure). Never invent new paths.
- Never add a new Prisma model or field to `schema.prisma` without approval.

### Step 4 — End of session summary
At the end of every session, output this exact format:

```
## Session Summary — Cycle [N]

### Files Created
- path/to/file.js — what it does

### Files Modified
- path/to/file.js — what changed and why

### Pending (carry to next session)
- [ ] incomplete task

### Notes
Decisions made, edge cases found, or approved deviations.
```

### Standing rules
- **Never introduce a new npm package** without explicit approval. Name the package, state why, wait.
- **Never change a Prisma model field** (add, remove, rename, retype) without approval.
- **Never change the folder structure** without approval.
- **Never skip a business logic step** defined in `MASTER_CONTEXT.md` Section 10. If something is hard, say so — do not simplify around it.
- **If in doubt: ask. Do not assume.**

---

## 2. Code Quality Rules

Apply to every file in every cycle without exception.

### General
- `async/await` only. No `.then().catch()` chains anywhere.
- One `try/catch` per function at most. No nested try/catch pyramids.
- No `console.log` in production code. HTTP logs via `morgan`. Errors to `console.error` only.
- No commented-out code blocks in committed files.
- No `TODO` comments in generated code — implement it or put it in the session summary as pending.

### Backend — Controllers
- Controllers are thin. Their only jobs: receive request, call a service, return a response.
- No Prisma queries inside controllers. All DB access goes through services.
- No business logic inside controllers. Extract to services.
- Maximum ~40 lines per controller function.

### Backend — Services
- All business logic and all Prisma queries live in services.
- Services never import `req` or `res`. They receive plain data, return plain data.
- Each service file handles one domain only (`inventory.service.js` only touches inventory).
- Functions do one thing. If a function name contains "and", split it.
- Keep functions under ~50 lines. Extract helpers when needed.
- When a service function participates in a transaction, it receives `tx` (the Prisma transaction client) as a parameter instead of using the global `prisma` instance.

### Backend — Routes
- Routes only: define path, attach middleware, call controller.
- No inline validation logic. All validation goes in `validators/`.
- No business logic or Prisma queries in routes. Ever.

### Database (Prisma)
- Use the Prisma singleton from `src/config/db.js`. Never call `new PrismaClient()` anywhere else.
- Prisma always returns plain JS objects. No `.lean()` needed or used.
- Use `select` or `include` to return only the fields needed. Never return full objects when partial data is enough.
- All multi-record write operations that affect business state must use `prisma.$transaction()`. See `MASTER_CONTEXT.md` Section 11.
- When passing a transaction client through service calls, always name the parameter `tx`.

### Frontend
- No direct Axios calls inside React components. All API calls go through `src/api/`.
- No business logic inside components. Extract to hooks or utils.
- No inline styles. Tailwind utility classes only.
- Form state managed by React Hook Form. Do not use `useState` for form fields.
- Server state managed by TanStack Query. Do not use `useState` for fetched data.
- Client-only UI state (cart, auth) goes in Zustand stores.

### Composition
- Small, composed functions over large utility files.
- Explicit imports over barrel `index.js` files.

---

## 3. Forbidden Patterns

These are banned. If tempted to use one, stop and find the correct approach.

### Data integrity
| Forbidden | Correct approach |
|-----------|-----------------|
| Directly mutating `Inventory.quantityOnHand` outside `inventory.service.js` | Always call inventory service functions |
| Updating product prices without creating a `ProductPriceHistory` row | Always go through `pricing.service.js` |
| Setting `SaleOrderItem.unitPrice` from live product data after sale creation | Prices are frozen at sale creation — copy once, never again |
| Using Prisma's `delete()` or `deleteMany()` on business records | Always soft-delete: set `isDeleted = true`, `deletedAt`, `deletedById` |
| Running EOD without checking if a summary already exists for today | Guard: `prisma.endOfDaySummary.findUnique({ where: { date: todayMidnight } })` |
| Creating a second `AppSettings` document | Always `upsert({ where: { id: 'settings' }, ... })`. One row only |

### Architecture
| Forbidden | Correct approach |
|-----------|-----------------|
| Prisma queries inside route files | Move to service layer |
| Prisma queries inside React components | Move to `src/api/` then a hook |
| `new PrismaClient()` anywhere other than `src/config/db.js` | Import the singleton |
| JWT decoding or verification inside controllers | JWT handled exclusively in `auth.middleware.js` |
| Duplicate validation logic across multiple routes | Extract to `validators/` and reuse |
| Magic strings for roles, payment methods, movement types, etc. | Always use constants from `constants.js` |
| Magic strings for passcode modules | Use `PASSCODE_MODULES.*` constants |
| Hardcoded currency symbols or tax labels in components | Read from `AppSettings` via API |

### Code style
| Forbidden | Correct approach |
|-----------|-----------------|
| `.then().catch()` chains | `async/await` with `try/catch` |
| Nested try/catch | Flat try/catch with early returns |
| Adding a new npm package without approval | Request approval, wait for response |
| Changing a Prisma schema field without approval | Request approval, wait for response |
| Computing `costPrice` in a route or controller | Only computed in `pricing.service.js` via `calculateCostPrice()` |

---

## 4. What The AI Must Never Assume

DeepSeek V4 Pro is known to fill knowledge gaps confidently. These are the most dangerous assumptions for this codebase.

1. **Never assume a schema field exists** if it is not in `MASTER_CONTEXT.md` Section 9 (Prisma Schema). Ask.
2. **Never assume a utility function exists** unless listed in this document or a prior session summary.
3. **Never assume a business rule** not stated in `MASTER_CONTEXT.md` Section 10. If a scenario is not covered, ask.
4. **Never assume a transaction is optional.** `MASTER_CONTEXT.md` Section 11 defines which operations require `prisma.$transaction()`. Follow it exactly.
5. **Never call `new PrismaClient()`** outside `src/config/db.js`.
6. **Never assume `costPrice` equals `purchasePrice`.** It is always `purchasePrice × (1 + purchaseTaxPercent / 100)`, computed in `pricing.service.js`.
7. **Never assume credit or semi-credit sales are allowed for walk-in customers.** A linked `Customer` record is required.
8. **Never assume stock is deducted for service items.** Always check `product.isService === true` — if true, skip all stock deduction.
9. **Never assume the frontend can show profit data** without verifying the `PROFIT_VIEW` passcode first.
10. **Never assume Prisma enum values are lowercase.** They are SCREAMING_SNAKE_CASE and must match `constants.js` exactly.
11. **Never create a file not listed in `MASTER_CONTEXT.md` Section 3** without naming it, explaining why, and getting approval.
12. **Never assume `schema.prisma` has a pre-save hook** for `costPrice`. There are no hooks in Prisma — `costPrice` is calculated explicitly in the service before every create or update.

---

## 5. Core Principles (Never Violate)

1. **No hard deletes.** Every business record has `isDeleted`, `deletedAt`, `deletedById`.
2. **Price immutability on invoices.** `unitPrice` and `costPrice` on `SaleOrderItem` are copied from the product at sale creation and never touched again.
3. **Price history is append-only.** `ProductPriceHistory` rows are INSERT-only. Never update or delete.
4. **Every mutation is attributed.** Every write records the `userId` of who performed it.
5. **Stock movements are ledgered.** Every stock change creates a `StockMovement` row. Quantity is tracked via the ledger, not set directly.
6. **Profit is calculated and frozen at time of sale.** `profitAmount` per item = `(unitPrice - costPrice) × quantity`. Stored — never recalculated from live prices.
7. **Credit sales require a customer.** `CREDIT` or `SEMI_CREDIT` payment requires a linked `Customer`. Walk-in = cash or card only.
8. **Cart price overrides are logged.** If price is overridden in cart: `originalUnitPrice`, `isPriceOverridden`, `priceOverriddenById` are stored on the item.
9. **Passcode is a second layer.** Role-based JWT gates the API. Passcode gates sensitive UI. Both apply simultaneously.
10. **Validation at the API layer.** Input validated in middleware before reaching controllers.
11. **Errors handled explicitly.** Every async route wrapped with try/catch or global error handler.
12. **Standard response envelope on every response.** See `MASTER_CONTEXT.md` Section 4.
13. **Environment variables for all secrets.** No hardcoded credentials or keys.
14. **If anything is ambiguous or not defined here, ask before assuming.**
