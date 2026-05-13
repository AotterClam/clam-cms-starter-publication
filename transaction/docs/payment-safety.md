# Payment Safety

## Tracked inventory rule

Do not combine `inventoryMode: tracked` with delayed-settlement payment
methods.

Delayed-settlement methods include ATM, ACH, SEPA, Bacs, bank transfer,
delayed BLIK, and similar flows where the provider can report success hours
or days after checkout. The transaction starter reserves tracked inventory
for 10 minutes. After that TTL, the reservation is released. A later success
callback can still create the order, but there is no reservation left to
commit, so stock can oversell.

Supported tracked-inventory path:

- Card / immediate-capture checkout.
- Provider callback succeeds within the reservation TTL.
- `succeeded` callback commits the reservation and writes the order.

Unsupported tracked-inventory path:

- ATM / ACH / SEPA / bank-transfer checkout.
- Success callback can arrive after the reservation TTL.
- Order may be paid without decrementing stock.

If the shop must offer delayed-settlement methods, set those products to
`inventoryMode: untracked` and handle availability manually or in a future
commerce-pro flow.

