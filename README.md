# Fief

Fief is a self-hosted DNS delegation manager. It allows you to grant scoped, revocable control over specific subdomains to other people without exposing your registrar credentials or root domain.

## Features

- **Multi-tenant**: Each tenant has their own API key and subdomain path.
- **Registrar Integration**: Initial support for NameCheap.
- **REST API**: Manage DNS records (A, AAAA, CNAME, TXT) programmatically.
- **Web UI**: Simple, mobile-friendly interface for managing records.
- **PWA**: Installable web app for on-the-go management.
- **Admin Dashboard**: Comprehensive management of all tenants and records.

## Tech Stack

- **UI/API**: Next.js 16.2 (App Router, TypeScript, Tailwind)
- **Database**: PostgreSQL (Prisma 7)
- **i18n**: next-intl (English, Italian)
- **PWA**: next-pwa

## Getting Started

### Local Development

1.  Copy `.env.example` to `.env` and fill in the required variables.
2.  Start the stack:
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
    ```
3.  Access the app (usually behind a proxy or via the internal network).

## Deployment

Fief is designed to run under **Portcullis**.

1.  Register Fief as a service in Portcullis.
2.  Deploy via Docker Compose on your VPS.

## License

MIT
