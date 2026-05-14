/** @jsxImportSource hono/jsx */
import { raw } from "hono/html";

/**
 * Minimal HTML doc envelope for the customer-facing storefront.
 *
 * Deliberately plain — no theme tokens, no SEO machinery, no
 * sidebar/header chrome. Reference templates that adopters will
 * replace with their own brand. Inline CSS keeps the entire
 * shipping surface readable; no external CSS bundle to track.
 *
 * Cart state lives in localStorage on the client (key `cartId` =
 * uuid stored on first visit) and in KV server-side
 * (`cart:<cartId>`); the server's view of the cart is authoritative
 * after addToCart, but the template renders subtotal client-side
 * while the user shops to avoid round-trips.
 */

const BRAND = "{{BRAND}}";
const LOCALE = "{{CANONICAL_LOCALE}}";

const INLINE_CSS = `
  :root {
    --fg: #1b1f23;
    --bg: #f7f8fa;
    --muted: #667085;
    --accent: #2563eb;
    --accent-dark: #1d4ed8;
    --border: #d0d7de;
    --card: #ffffff;
    --soft: #eef2f7;
    --danger: #b42318;
    --ok: #067647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    line-height: 1.5;
    color: var(--fg);
    background: var(--bg);
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100dvh; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  header.site {
    border-bottom: 1px solid var(--border);
    background: var(--card);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  header.site .row {
    max-width: 1120px;
    margin: 0 auto;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  header.site .brand { font-weight: 600; font-size: 1.05rem; }
  header.site nav { display: flex; align-items: center; gap: 1rem; }
  header.site nav a { color: var(--fg); font-size: 0.95rem; }
  main { max-width: 1120px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
  h1, h2, h3 { margin-top: 0; }
  h1 { font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1.08; letter-spacing: 0; }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
    gap: 2rem;
    align-items: center;
    padding: 2.5rem 0 3rem;
  }
  .hero p { color: var(--muted); font-size: 1.05rem; max-width: 42rem; }
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.25rem;
  }
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.25rem;
  }
  .product-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    min-height: 12rem;
  }
  .product-card .price { color: var(--accent); font-weight: 700; margin-top: auto; }
  .price-tag { font-size: 1.7rem; color: var(--accent); font-weight: 700; }
  .product-layout, .checkout-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 2rem;
    align-items: start;
  }
  form.checkout { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; }
  form.checkout label { display: block; margin-top: 1rem; font-weight: 500; }
  form.checkout input, form.checkout textarea, input[type="number"] {
    width: 100%; padding: 0.5rem; margin-top: 0.25rem;
    border: 1px solid var(--border); border-radius: 4px;
    font-family: inherit; font-size: 1rem;
  }
  button.primary, .btn-primary {
    background: var(--accent); color: white; border: 0;
    padding: 0.65rem 1.25rem; border-radius: 4px;
    font-size: 1rem; font-weight: 500; cursor: pointer;
    margin-top: 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  button.primary:hover, .btn-primary:hover { background: var(--accent-dark); text-decoration: none; }
  button.primary:disabled { opacity: 0.5; cursor: wait; }
  table.cart {
    width: 100%; border-collapse: collapse; margin-top: 1rem;
    background: var(--card); border: 1px solid var(--border); border-radius: 8px;
    overflow: hidden;
  }
  table.cart th, table.cart td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); }
  table.cart th { color: var(--muted); font-size: 0.82rem; font-weight: 600; }
  table.cart tfoot td { font-weight: 600; }
  table.cart input { max-width: 5rem; }
  table.cart button {
    border: 1px solid var(--border);
    background: var(--card);
    border-radius: 4px;
    padding: 0.4rem 0.65rem;
    cursor: pointer;
  }
  .muted { color: var(--muted); font-size: 0.9rem; }
  .notice {
    padding: 0.75rem 1rem; border-radius: 4px; margin: 1rem 0;
    background: #f3f0e8; border: 1px solid var(--border);
  }
  .notice.success { background: #ecfdf3; border-color: #abefc6; color: var(--ok); }
  .notice.error { background: #fef3f2; border-color: #fecdca; color: var(--danger); }
  .empty { text-align: center; padding: 3rem 1rem; color: var(--muted); }
  footer.site {
    text-align: center; padding: 2rem 1rem; color: var(--muted);
    font-size: 0.85rem; border-top: 1px solid var(--border); margin-top: 4rem;
  }
  @media (max-width: 760px) {
    header.site .row { align-items: flex-start; flex-direction: column; }
    .hero, .product-layout, .checkout-layout { grid-template-columns: 1fr; }
    table.cart { display: block; overflow-x: auto; }
  }
`;

// Bootstraps two things every page needs in client JS:
//   1. window.__cartId — stable per-browser uuid (server holds cart
//      state in KV under `cart:<cartId>`; this is just the key).
//   2. window.__escapeHtml — shared HTML-escape for all inline scripts
//      so each template doesn't redefine it.
const BOOTSTRAP_JS = `
  if (!localStorage.getItem("cartId")) {
    localStorage.setItem("cartId", "c_" + crypto.randomUUID());
  }
  window.__cartId = localStorage.getItem("cartId");
  window.__escapeHtml = function (s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    }[c]));
  };
`;

export interface LayoutContext {
  readonly title: string;
  readonly children: unknown;
}

export function Layout(props: LayoutContext) {
  return (
    <html lang={LOCALE}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title}</title>
        <style>{raw(INLINE_CSS)}</style>
        {/*
          Bootstrap lives in <head> so window.__cartId + window.__escapeHtml
          are defined before any page-body inline script runs.
        */}
        <script>{raw(BOOTSTRAP_JS)}</script>
      </head>
      <body>
        <header class="site">
          <div class="row">
            <a href="/" class="brand">{BRAND}</a>
            <nav>
              <a href="/">Shop</a>
              <a href="/cart">Cart</a>
            </nav>
          </div>
        </header>
        <main>{props.children}</main>
        <footer class="site">
          {BRAND} storefront
        </footer>
      </body>
    </html>
  );
}

export function formatPrice(minor: number, currency: string): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export function renderHtml(tree: unknown): string {
  return "<!doctype html>" + String(tree);
}
