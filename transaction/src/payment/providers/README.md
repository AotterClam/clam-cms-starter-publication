# `src/payment/providers/`

This directory is where the actual `PaymentProvider` implementation
lives. **Empty by design** — the transaction starter does not ship
with a payment provider wired. Mantle scaffolds the real provider
file here during install, based on the user's answer to "which
payment provider?"

> **Tracked inventory payment rule:** do **not** enable delayed-settlement
> rails such as ATM, ACH, SEPA, Bacs, bank transfer, or delayed BLIK
> while products use `inventoryMode: tracked`. Those providers can send
> the success callback hours or days after checkout, after the starter's
> 10-minute reservation TTL. Disable those methods, or mark those products
> `untracked`.

## Two pattern templates ship in `_templates/`

The transaction starter recognizes two common payment-integration
patterns. Each is documented as a working class skeleton that
implements `PaymentProvider`:

| Template | Pattern | Example providers |
|---|---|---|
| [`_templates/redirect-checkout.ts`](_templates/redirect-checkout.ts) | Provider hosts the checkout page; merchant gets a URL and redirects the customer | Stripe Checkout, Paddle, Lemon Squeezy |
| [`_templates/merchant-form.ts`](_templates/merchant-form.ts) | Merchant renders an HTML form; customer's browser auto-POSTs to provider | ECPay (綠界), PayUni (統一金流), NewebPay (藍新), most APAC/TW gateways |

These are **starting points, not active providers**. They throw at
runtime if you try to use them as-is. The class names — `RedirectCheckoutTemplate`
and `MerchantFormTemplate` — are deliberately generic so a coding
agent (or human) immediately recognizes the integration shape and
adapts to the specific provider's API.

## How Mantle wires a real provider at install

1. Asks the user: "Which payment provider?"
2. Decides which template fits (redirect-checkout for Stripe / Paddle,
   merchant-form for ECPay / PayUni / NewebPay).
3. Copies the template to `providers/<provider>.ts`.
4. Reads the provider's docs and fills in the TODOs (API calls,
   signature/encryption scheme, status-code mapping).
   Map recoverable attempt failures (declined card, requires new payment
   method) to `failed`; map terminal checkout cancellation/expiry to
   `expired`. Only `expired` releases tracked inventory immediately.
5. Updates `../index.ts` to import + instantiate the new class.
6. Declares the provider's secrets in `wrangler.toml` so provision
   can pipe them in via `wrangler secret put`.
7. Records the provider choice in `mantle/site.md` so a future
   session knows what's wired.

## Adding a new provider yourself

If Mantle didn't run (manual install) or you want to swap providers
after install:

1. Pick the closer template. Look at the example providers above; if
   none match, redirect-checkout is the safer default for hosted
   solutions and merchant-form for self-hosted card-info collection.
2. `cp _templates/<template>.ts <provider>.ts`
3. Rename the exported class.
4. Read the provider's docs and fill in the TODOs.
5. Wire it in `../index.ts`.
6. Set secrets via `wrangler secret put`.

The `PaymentProvider` interface (`../provider.ts`) is the contract.
As long as the three methods (`startCheckout`, `parseCallback`,
`verifyReturn`) behave per their JSDoc, the transaction handlers
don't care which provider you use.
