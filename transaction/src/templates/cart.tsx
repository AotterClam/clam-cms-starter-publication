/** @jsxImportSource hono/jsx */
import { raw } from "hono/html";
import { Layout, renderHtml } from "./layout.js";

/**
 * GET /cart — cart contents.
 *
 * Server doesn't know the per-browser cartId yet (it's in
 * localStorage), so the page renders an empty shell and the inline
 * script hydrates it by calling `/api/cart/get?cartId=<id>` — a
 * lookup that the runtime exposes via the manifest's
 * `cart-snapshot` View if/when wired. For v0.1 we leave the cart
 * fetch as an explicit roundtrip the customer sees as a brief
 * "loading" state.
 *
 * The "Proceed to checkout" link carries cartId in the query string
 * so the checkout page can prefill state without another lookup.
 */

const CART_BOOTSTRAP_JS = `
(function() {
  const esc = window.__escapeHtml;
  const tbody = document.getElementById("cart-rows");
  const totalCell = document.getElementById("cart-total");
  const emptyMsg = document.getElementById("cart-empty");
  const summary = document.getElementById("cart-summary");
  const loading = document.getElementById("summary-loading");
  const cartId = window.__cartId;

  async function render() {
    try {
      const res = await fetch("/api/cart/get?cartId=" + encodeURIComponent(cartId));
      if (!res.ok) {
        if (res.status === 404) { showEmpty(); return; }
        throw new Error("HTTP " + res.status);
      }
      const data = await res.json();
      if (!data.items || data.items.length === 0) { showEmpty(); return; }
      loading.style.display = "none";
      summary.style.display = "block";
      emptyMsg.style.display = "none";
      tbody.innerHTML = "";
      for (const item of data.items) {
        const tr = document.createElement("tr");
        tr.dataset.slug = item.productSlug;
        tr.innerHTML =
          "<td><a href=\\"/product/" + encodeURIComponent(item.productSlug) + "\\">" + esc(item.title || item.productSlug) + "</a></td>" +
          "<td>" + ((item.priceMinor / 100).toFixed(2)) + " " + (data.currency || "") + "</td>" +
          "<td><input data-qty type=\\"number\\" min=\\"0\\" max=\\"99\\" value=\\"" + item.qty + "\\" /></td>" +
          "<td>" + ((item.lineTotalMinor / 100).toFixed(2)) + " " + (data.currency || "") + "</td>" +
          "<td><button type=\\"button\\" data-remove>Remove</button></td>";
        tbody.appendChild(tr);
      }
      tbody.querySelectorAll("[data-qty]").forEach(function(input) {
        input.addEventListener("change", function() {
          const row = input.closest("tr");
          setQty(row.dataset.slug, Number(input.value || 0));
        });
      });
      tbody.querySelectorAll("[data-remove]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          const row = btn.closest("tr");
          setQty(row.dataset.slug, 0);
        });
      });
      const total = (data.subtotalMinor / 100).toFixed(2) + " " + (data.currency || "");
      totalCell.textContent = total;
      document.getElementById("checkout-link").href =
        "/checkout?cartId=" + encodeURIComponent(cartId);
    } catch (err) {
      emptyMsg.textContent = "Could not load cart: " + err.message;
      emptyMsg.style.display = "block";
    }
  }
  function showEmpty() {
    loading.style.display = "none";
    summary.style.display = "none";
    emptyMsg.style.display = "block";
  }
  async function setQty(productSlug, qty) {
    const res = await fetch("/api/cart/set-qty", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cartId, productSlug, qty })
    });
    if (!res.ok) {
      loading.style.display = "none";
      emptyMsg.textContent = "Could not update cart: " + (await res.text()).slice(0, 200);
      emptyMsg.style.display = "block";
      return;
    }
    render();
  }
  render();
})();
`;

export function renderCart(): string {
  const tree = (
    <Layout title="Cart">
      <h1>Your Cart</h1>
      <p class="muted">Review quantities before starting checkout.</p>
      <div id="summary-loading" class="panel">Loading…</div>
      <div id="cart-empty" class="empty" style="display: none">
        Your cart is empty. <a href="/">Browse the shop →</a>
      </div>
      <div id="cart-summary" style="display: none">
        <table class="cart">
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit</th>
              <th>Qty</th>
              <th>Line total</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="cart-rows"></tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td id="cart-total"></td>
            </tr>
          </tfoot>
        </table>
        <a id="checkout-link" class="btn-primary" href="/checkout">
          Proceed to checkout →
        </a>
      </div>
      <script>{raw(CART_BOOTSTRAP_JS)}</script>
    </Layout>
  );
  return renderHtml(tree);
}
