#!/usr/bin/env bash
# Applies the Supabase migrations to an empty PostgreSQL database and runs the
# policy tests. Needs psql and DATABASE_URL pointing at a THROWAWAY database.
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to an empty, throwaway PostgreSQL database}"
cd "$(dirname "$0")/.."

run() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$1"; }

run supabase/tests/supabase-shim.sql
for migration in supabase/migrations/*.sql; do
  echo "→ $migration"
  run "$migration"
done
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f supabase/tests/policies.test.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /'
