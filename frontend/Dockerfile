FROM node:22.23.4-alpine3.24 AS build

WORKDIR /front

COPY package*.json ./

RUN npm ci

COPY . .

# Build-time only: Vite inlines the public origin into the Open Graph and Twitter image URLs. It is not set in the final nginx stage. Blank leaves those tags out.
ARG VITE_SITE_URL=
ENV VITE_SITE_URL=${VITE_SITE_URL}

RUN npm run build

FROM nginx:1.31.8-alpine3.24

COPY --from=build /front/dist /usr/share/nginx/html

# The official image renders every file in /etc/nginx/templates to /etc/nginx/conf.d at start. The template uses only nginx variables, so envsubst is restricted to variable names that no environment defines and leaves $remote_addr and the rest untouched.
ENV NGINX_ENVSUBST_FILTER=^NGINX_TEMPLATE_VAR_

COPY nginx/templates/ /etc/nginx/templates/

# Runs after the template step (20-envsubst-on-templates). That order is safe because the template only includes the generated files, and nginx reads them when it starts. The script writes the set_real_ip_from list from TRUSTED_EDGE_PROXIES, which is empty by default.
ENV TRUSTED_EDGE_PROXIES=

COPY nginx/security-headers.conf /etc/nginx/security-headers.conf

COPY nginx/25-trusted-edge-proxies.sh /docker-entrypoint.d/25-trusted-edge-proxies.sh

RUN chmod 0755 /docker-entrypoint.d/25-trusted-edge-proxies.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
