# ADR 001: DNS records stored at registrar only

## Context
Fief is a DNS delegation manager.

## Decision
DNS records are not stored in Postgres. They are always read from and written to the registrar's API directly. Postgres is the source of truth only for tenants and their key hashes.

## Consequences
- No sync issues between local DB and registrar.
- API calls required for every read/write.
