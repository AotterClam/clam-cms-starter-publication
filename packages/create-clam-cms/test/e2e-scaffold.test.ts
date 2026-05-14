import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installFromExtractedRoot } from "../src/index.js";

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(join(tmpdir(), "create-clam-cms-e2e-"));
});

afterEach(() => {
  rmSync(tempRoot, { recursive: true, force: true });
});

function repoRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..", "..");
}

describe("real starter scaffold smoke", () => {
  it("scaffolds transaction with substituted config and valid trigger paths", () => {
    const destination = join(tempRoot, "fixture-shop");
    const notes = installFromExtractedRoot({
      archetype: "transaction",
      projectName: "fixture-shop",
      destination,
      extractedRoot: repoRoot(),
      brand: "Fixture Shop",
      description: "A transaction starter scaffold fixture.",
      locales: ["en"],
      githubOwner: "aotterclam",
      summary: "Create transaction starter scaffold fixture.",
      skipInstall: true,
      skipGitInit: true,
    });

    expect(notes.archetype).toBe("transaction");
    expect(existsSync(join(destination, "src", "clamConfig.ts"))).toBe(true);

    const cfg = readFileSync(join(destination, "src", "clamConfig.ts"), "utf8");
    expect(cfg).toContain('brand: "Fixture Shop"');
    expect(cfg).toContain('title: "Fixture Shop"');
    expect(cfg).toContain('description: "A transaction starter scaffold fixture."');
    expect(cfg).toContain('origin: "https://example.com"');
    expect(cfg).toContain(`JSON.parse('["en"]')`);
    expect(cfg).not.toContain("{{");

    const inventory = readFileSync(
      join(destination, "manifests", "inventory.yaml"),
      "utf8",
    );
    expect(inventory).toContain("path: /api/staff/restock");
    expect(inventory).not.toContain("path: /staff/api/restock");

    const checkout = readFileSync(
      join(destination, "manifests", "checkout.yaml"),
      "utf8",
    );
    expect(checkout).toContain("name: set-cart-qty");
    expect(checkout).toContain("path: /api/cart/set-qty");
  });
});
