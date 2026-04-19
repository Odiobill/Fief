# Fief

Fief is a self-hosted DNS delegation manager. It allows you to grant scoped, revocable control over specific subdomains to other people without exposing your registrar credentials or root domain.

![Fief Logo](/logo.png)

## Features

- **Multi-tenant**: Each tenant has their own API key and subdomain path.
- **Registrar Integration**: Support for NameCheap with safe fetch-patch-push logic to prevent record data loss.
- **REST API**: Full CRUD support for DNS records (A, AAAA, CNAME, TXT).
- **Interactive Documentation**: Built-in sleek API documentation for tenants.
- **Web UI**: Modern, responsive interface with separate dashboards for tenants and administrators.
- **Security**: Timing-safe admin key verification and secure session management.
- **PWA**: Installable web app for on-the-go management.
- **i18n**: Fully localized in English and Italian.
- **Extensible Architecture**: While it currently supports Namecheap, Fief is built with a provider-agnostic interface, making it easy to add support for any DNS registrar (Cloudflare, AWS Route53, etc.) by creating a dedicated module.

## Tech Stack

- **UI/API**: Next.js 16.2 (App Router, TypeScript, Tailwind)
- **Database**: PostgreSQL (Prisma 7)
- **i18n**: next-intl
- **DNS Provider**: Custom NameCheap module (XML API)

## Getting Started

### Infrastructure

Fief is designed to take advantage of the shared services provided by [Portcullis](https://github.com/Odiobill/Portcullis), such as the central Caddy reverse proxy and shared PostgreSQL instance. 

#### Option A: Running under Portcullis (Recommended)

Fief joins the `caddy_gateway` and `db_network` external networks. No extra containers are needed.

1.  Register Fief as a service in the Portcullis UI.
2.  Deploy using the provided `docker-compose.yml`.

#### Option B: Standalone Setup

If you wish to run Fief independently, you can easily add Caddy and PostgreSQL containers to your stack.

**Example `docker-compose.yml` for standalone:**

```yaml
services:
  app:
    build: .
    container_name: fief_app
    restart: unless-stopped
    env_file: .env
    depends_on:
      - db
    networks:
      - fief_internal

  db:
    image: postgres:15-alpine
    container_name: fief_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: fief
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: fief
    networks:
      - fief_internal

  caddy:
    image: caddy:2-alpine
    container_name: fief_caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - fief_internal

networks:
  fief_internal:

volumes:
  caddy_data:
  caddy_config:
```

**Example `Caddyfile`:**

```caddy
fief.yourdomain.com {
    reverse_proxy app:3000
}
```

### Environment Variables

Copy `.env.example` to `.env` and configure the following:

- `DATABASE_URL`: Connection string for Postgres.
- `DNS_PROVIDER`: Currently only `namecheap` is supported.
- `NAMECHEAP_*`: Your registrar credentials.
- `ADMIN_API_KEY`: Secret key for administrative access.
- `SESSION_SECRET`: Long random string for cookie signing.

## License

MIT
