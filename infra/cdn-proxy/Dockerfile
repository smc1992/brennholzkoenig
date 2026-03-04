# Reverse-Proxy für Supabase Storage (NGINX)
FROM nginx:alpine

ENV SUPABASE_HOST=""
ENV SUPABASE_PUBLIC_PREFIX="/storage/v1/object/public"
ENV ORIGIN_CACHE_MAX_AGE="31536000"

COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
