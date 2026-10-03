-- Cuba has no single real exchange rate: the street rate varies by who you
-- ask. Instead of NODO imposing one, each seller may say how they personally
-- value a foreign currency for their own listing. It is only used to compare
-- prices across currencies ("ordenar por precio"); left blank, the app falls
-- back to its own rough reference rates.

alter table public.products
  add column exchange_rate numeric(10, 4) check (exchange_rate is null or exchange_rate > 0);

grant insert (exchange_rate) on public.products to authenticated;
grant update (exchange_rate) on public.products to authenticated;
