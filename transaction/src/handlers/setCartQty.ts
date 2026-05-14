/**
 * setCartQty — set, update, or remove one cart line in KV.
 *
 * qty=0 removes the line. Like addToCart, pricing is not stored in
 * the cart; the response enriches the updated cart from current
 * product entries so the storefront can repaint without a second
 * request.
 */

import type { AnyHandler } from "@aotterclam/clam-cms-runtime";
import { defineHandler } from "./_context.js";
import { loadProductCatalog } from "./_productEnrichment.js";

interface CartState {
  items: { productSlug: string; qty: number }[];
  updatedAt: number;
}

const CART_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const MAX_QTY_PER_LINE = 99;

export interface SetCartQtyEnv {
  readonly KV: KVNamespace;
}

export interface SetCartQtyInput {
  readonly cartId: string;
  readonly productSlug: string;
  readonly qty: number;
}

export interface SetCartQtyOutput {
  readonly cartId: string;
  readonly items: ReadonlyArray<{
    readonly productSlug: string;
    readonly qty: number;
    readonly priceMinor: number;
    readonly title: string;
    readonly lineTotalMinor: number;
  }>;
  readonly subtotalMinor: number;
  readonly currency?: string;
}

export function buildSetCartQty(env: SetCartQtyEnv): AnyHandler {
  return defineHandler<SetCartQtyInput, SetCartQtyOutput>(async (input, ctx) => {
    if (!input.cartId || !input.productSlug || typeof input.qty !== "number") {
      throw new Error("setCartQty: missing cartId / productSlug / qty");
    }
    if (input.qty < 0 || input.qty > MAX_QTY_PER_LINE) {
      throw new Error(`setCartQty: qty must be 0..${MAX_QTY_PER_LINE}`);
    }

    const key = `cart:${input.cartId}`;
    const existing = (await env.KV.get<CartState>(key, "json")) ?? {
      items: [],
      updatedAt: 0,
    };
    const nextItems = existing.items.filter(
      (i) => i.productSlug !== input.productSlug,
    );
    if (input.qty > 0) {
      nextItems.push({
        productSlug: input.productSlug,
        qty: Math.floor(input.qty),
      });
    }

    const next: CartState = { items: nextItems, updatedAt: Date.now() };
    if (next.items.length > 0) {
      await env.KV.put(key, JSON.stringify(next), {
        expirationTtl: CART_TTL_SECONDS,
      });
    } else {
      await env.KV.delete(key);
    }

    const catalog = await loadProductCatalog(ctx.runtime);
    const items: SetCartQtyOutput["items"][number][] = [];
    let subtotalMinor = 0;
    let currency: string | undefined;
    for (const item of next.items) {
      const product = catalog.bySlug.get(item.productSlug);
      if (!product) continue;
      const lineTotalMinor = product.priceMinor * item.qty;
      subtotalMinor += lineTotalMinor;
      currency ??= product.currency;
      items.push({
        productSlug: product.slug,
        qty: item.qty,
        priceMinor: product.priceMinor,
        title: product.title,
        lineTotalMinor,
      });
    }

    return {
      cartId: input.cartId,
      items,
      subtotalMinor,
      currency,
    } satisfies SetCartQtyOutput;
  });
}
