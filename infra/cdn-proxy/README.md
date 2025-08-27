# Supabase CDN Proxy (NGINX)

## Zweck
Liefert Supabase-Storage-Objekte unter eigener Domain (z. B. cdn.brennholz-koenig.de) aus. Vorteil: SEO/Branding, saubere URLs, Caching.

## Erwartete URL-Struktur
https://cdn.DEINEDOMAIN.de/<bucket>/<pfad>  ->  https://<SUPABASE_HOST>/storage/v1/object/public/<bucket>/<pfad>

## Coolify-Deployment
- Projekt-Typ: Dockerfile
- Internal Port: 8080
- Domain: https://cdn.brennholz-koenig.de
- Healthcheck: Path `/`, Port 8080
- ENV Variablen:
  - SUPABASE_HOST=<deinproject>.supabase.co
  - SUPABASE_PUBLIC_PREFIX=/storage/v1/object/public   (Standard)
  - ORIGIN_CACHE_MAX_AGE=31536000

## DNS
Lege A/AAAA für cdn.brennholz-koenig.de auf denselben Server wie Coolify.
