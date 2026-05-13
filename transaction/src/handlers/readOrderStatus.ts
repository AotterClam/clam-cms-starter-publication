/**
 * readOrderStatus — polled by the frontend after customer returns
 * from the provider. Returns { orderId, exists, orderStatus? } so
 * the UI can detect when the async callback consumer has placed
 * the order. See manifests/checkout.yaml for the output contract.
 *
 * Uses D1 directly against the deterministic `entry_<orderId>` id —
 * direct lookup, no 1000-row scan + no silent miss past the limit cap.
 */

import type { AnyHandler } from "@aotterclam/clam-cms-runtime";
import { defineHandler } from "./_context.js";
import { orderEntryId, type OrderLineItem, type OrderRowData } from "./orderConsumer.js";

export interface ReadOrderStatusInput {
  readonly orderId: string;
}

export interface ReadOrderStatusEnv {
  readonly DB: D1Database;
}

export interface ReadOrderStatusOutput {
  readonly orderId: string;
  readonly exists: boolean;
  readonly orderStatus?: string;
  readonly currency?: string;
  readonly totalMinor?: number;
  readonly customerEmail?: string;
  readonly paymentProvider?: string;
  readonly paymentIntentId?: string;
  readonly items?: ReadonlyArray<OrderLineItem>;
}

export function buildReadOrderStatus(env: ReadOrderStatusEnv): AnyHandler {
  return defineHandler<ReadOrderStatusInput, ReadOrderStatusOutput>(async (input, _ctx) => {
    if (!input.orderId) {
      throw new Error("readOrderStatus: missing orderId");
    }
    const row = await env.DB.prepare(
      `SELECT data FROM entries WHERE id = ? AND collection = ? LIMIT 1`,
    )
      .bind(orderEntryId(input.orderId), "orders")
      .first<{ data: string } | null>();
    if (!row) {
      return {
        orderId: input.orderId,
        exists: false,
      } satisfies ReadOrderStatusOutput;
    }
    const d = JSON.parse(row.data) as OrderRowData;
    return {
      orderId: d.orderNumber ?? input.orderId,
      exists: true,
      orderStatus: d.orderStatus ?? "placed",
      currency: d.currency,
      totalMinor: d.totalMinor,
      customerEmail: d.customerEmail,
      paymentProvider: d.paymentProvider,
      paymentIntentId: d.paymentIntentId,
      items: d.items,
    } satisfies ReadOrderStatusOutput;
  });
}
