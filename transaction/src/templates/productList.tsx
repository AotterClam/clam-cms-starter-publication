/** @jsxImportSource hono/jsx */
import { Layout, formatPrice, renderHtml } from "./layout.js";

/**
 * GET / — product list. Reads from the `products-public` View (same
 * URL the JSON API exposes); renders one card per published product.
 *
 * Server-rendered for SEO + first-paint speed. The cart "Add" buttons
 * POST to /api/cart/add via fetch on click; the response updates
 * a tiny cart-count badge in the header (vanilla JS, no framework).
 */

export interface ProductListItem {
  readonly slug: string;
  readonly title: string;
  readonly priceMinor: number;
  readonly currency: string;
  readonly inventoryMode: "tracked" | "untracked";
}

export interface ProductListContext {
  readonly products: ReadonlyArray<ProductListItem>;
}

export function renderProductList(ctx: ProductListContext): string {
  const featured = ctx.products[0];
  const tree = (
    <Layout title="Shop">
      <section class="hero">
        <div>
          <p class="muted">Small-catalog transaction starter</p>
          <h1>Products, cart, checkout, and order confirmation.</h1>
          <p>
            This neutral storefront is the default transaction backbone.
            Add products in the admin, wire a payment provider during
            install, then replace the copy and theme with your brand.
          </p>
          <a href="#products" class="btn-primary">Browse products</a>
        </div>
        <div class="panel">
          <h2>Transaction flow</h2>
          <p class="muted">
            Product pages call cart Procedures. Checkout reserves
            tracked inventory, starts the provider flow, then the order
            page polls until the callback consumer commits the order.
          </p>
          {featured ? (
            <p>
              Featured:{" "}
              <a href={`/product/${encodeURIComponent(featured.slug)}`}>
                {featured.title}
              </a>
            </p>
          ) : null}
        </div>
      </section>
      <h2 id="products">Products</h2>
      {ctx.products.length === 0 ? (
        <div class="empty">
          No products yet. Sign in as staff to add some.
        </div>
      ) : (
        <div class="product-grid">
          {ctx.products.map((p) => (
            <div class="product-card">
              <h3>
                <a href={`/product/${encodeURIComponent(p.slug)}`}>{p.title}</a>
              </h3>
              <div class="price">{formatPrice(p.priceMinor, p.currency)}</div>
              {p.inventoryMode === "tracked" ? (
                <div class="muted">Limited stock</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
  return renderHtml(tree);
}
