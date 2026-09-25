# Aerchain MVP — Project Context

## Goal

Buyer creates an RFx, vendors respond in messy formats, AI extracts/understands
responses, deterministic rules normalize/compare them, and the buyer can
interrogate results in plain language.

## Guiding principle

Don't guess. Detect uncertainty → explain → suggest → ask → record.

## 1. Information architecture (locked)

Dashboard → RFx Creation → RFx Details/Workspace → Vendor Responses →
Clarifications → Comparison & Evidence → AI Analyst.

## 2. RFx creation (locked)

Three entry paths — Manual, Import, AI Suggested — all produce the same
canonical `RFx` record. No path-specific data model.

## 3. RFx Details vs. RFx Workspace (locked)

- **RFx Details** — what was asked: the auditable, canonical RFx (lines,
  terms, requirements as sent).
- **RFx Workspace** — operational surface: status, vendor responses,
  exceptions, clarifications, comparison, and the AI analyst.

## 4. AI boundaries (locked)

- **LLM**: interprets messy vendor language/documents, extracts semantics,
  detects ambiguity, drafts clarifications, answers natural-language analyst
  questions.
- **Deterministic rules**: unit/currency conversion, discounts, freight/tax
  calculations, normalization, eligibility, scenarios.
- Never hardcode AI answers or silently guess.
- Buyer approves any AI-generated RFx or clarification before it is sent.

## 5. Unit model (locked)

`Dimension → Units → Base Unit → Conversion Factor → Preferred Comparison Unit`.

- Every tenant has predefined standard units; users configure only the units
  that are missing.
- Product-specific packaging/selling-unit conversions are stored separately
  from the standard unit catalog.
- An unknown unit creates an **exception** — never an invented conversion.
- Store original, canonical, and preferred-comparison values for every
  quantity/price.

## 6. Normalization record (locked)

Every normalized price must preserve: original vendor value, currency, price
basis, pack size, conversion applied, normalized price, comparison unit,
calculation, confidence, status, and evidence.

## 7. Resolution states (locked)

- **Clear** → process automatically.
- **Ambiguous** → explain the ambiguity + ask, or offer options.
- **Missing** → mark unresolved, request clarification.
- **Contradictory** → surface the conflict and ask for resolution.

## 8. Commercial calculation order (locked)

`quoted price → discount → net product price → freight/other charges → tax
→ landed cost`.

## 9. Eligibility (locked)

Quality/technical/delivery eligibility is tracked separately from price and
can be used to filter comparison (e.g. "cheapest among quality-passed
vendors").

## Demo category

Corrugated packaging. 30 RFx lines, 5 vendors. Vendor responses arrive as
Excel, PDF, DOCX, a photographed rate card, and email — intentionally
including missing lines, different price bases, pack-size ambiguity,
footnote discounts, freight ambiguity, and USD.

## Core entities

`Tenant`, `Dimension`, `Unit`, `Product`, `PackagingConversion`, `RFx`,
`RFxLine`, `Vendor`, `VendorResponse`, `VendorResponseLine`, `Price`,
`NormalizationResult`, `Evidence`, `Exception`, `Clarification`,
`QualityResponse`.

## Architecture

- Next.js + TypeScript + Tailwind + shadcn/ui + SQLite.
- LLM and deterministic responsibilities as defined in §4.

## Trust requirements

- Preserve original vendor values and evidence.
- Every normalized value/calculation must be traceable to source evidence.
- Surface uncertainty instead of guessing.
- Quality/technical eligibility must be kept separate from price.
- Buyer approves AI-generated clarifications and the RFx before sending.

## Core analyst questions (locked)

- What did each vendor quote for line X?
- Which vendors quoted all 30 lines (completeness)?
- Lowest normalized price per line?
- Cheapest per line among quality-passed vendors?
- Split award vs. single-vendor scenario?
- Why was a price normalized to a particular value (calculation explanation)?
- Which prices cannot currently be compared, and why?

## MVP exclusions (locked)

Authentication, supplier portal, ERP integrations, payments, PO lifecycle,
complex RBAC, production email infrastructure.

Keep dependencies minimal. Prefer simple, maintainable code. AI must perform
real interpretation/reasoning — never hardcode fake AI answers.

## Current scaffold state

- `create-next-app` default scaffold (App Router), untouched.
- Dependencies: `next` 16.3.6, `react`/`react-dom` 19.2.8; dev deps:
  `typescript`, `tailwindcss` v4 + `@tailwindcss/postcss`, `eslint` v9 +
  `eslint-config-next`, `@types/*`.
- No SQLite, ORM, shadcn/ui, or LLM SDK installed yet.
- No app routes/pages beyond the default `src/app/page.tsx` and
  `src/app/layout.tsx`.
- Not yet a git repository.
- No product features have been built.
- `node`/`npm` are not on this machine's default shell PATH (Node lives at
  `C:\Program Files\nodejs`); prepend it to `$env:PATH` for any shelled-out
  npm/node/npx command.
