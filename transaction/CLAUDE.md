# Transaction Starter Safety Notes

## Tracked inventory and delayed settlement

Do not enable delayed-settlement payment methods while products use
`inventoryMode: tracked`.

Examples: ATM, ACH, SEPA, Bacs, bank transfer, delayed BLIK, and similar
rails where the success callback can arrive hours or days after checkout.

Why: tracked inventory reservations expire after 10 minutes. If a delayed
payment succeeds after that TTL, the order can be paid after the reservation
has been released, so stock may oversell.

Use one of these paths instead:

- Disable delayed-settlement methods at the payment provider dashboard.
- Use immediate-capture methods only, such as card checkout.
- Set the affected products to `inventoryMode: untracked`.

