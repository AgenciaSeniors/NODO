import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { CATEGORIES, PLANS } from "@/lib/catalog";
import { PROVINCES } from "@/lib/geo/cuba";

// The database reference data must match what the app shows in its pickers.
const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260923000100_reference_data.sql"), "utf8");
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

test("every province and municipality is in the reference migration", () => {
  PROVINCES.forEach((p, i) => expect(sql).toContain(`(${q(p.id)}, ${q(p.name)}, ${i + 1})`));
  for (const p of PROVINCES) {
    for (const m of p.municipalities) expect(sql).toContain(`(${q(p.id)}, ${q(m.id)}, ${q(m.name)})`);
  }
  expect(sql.match(/^ {2}\('/gm)).toHaveLength(PROVINCES.length + 168 + CATEGORIES.length);
});

test("categories match the app", () => {
  CATEGORIES.forEach((c, i) => expect(sql).toContain(`(${q(c.id)}, ${q(c.label)}, ${i + 1})`));
});

test("plan limits match the database trigger", () => {
  const schema = readFileSync(join(process.cwd(), "supabase/migrations/20260923000000_initial_schema.sql"), "utf8");
  expect(schema).toContain(
    `case p.plan when 'pro' then ${PLANS.pro.limit} when 'negocio' then ${PLANS.negocio.limit} else ${PLANS.gratis.limit} end`,
  );
});
