FROM node:22-alpine AS build

WORKDIR /front

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /front/dist /usr/share/nginx/html

# The official image renders every file in /etc/nginx/templates to /etc/nginx/conf.d at start. The template uses only nginx variables, so envsubst is restricted to variable names that no environment defines and leaves $remote_addr and the rest untouched.
ENV NGINX_ENVSUBST_FILTER=^NGINX_TEMPLATE_VAR_

COPY nginx/templates/ /etc/nginx/templates/

# Runs before the template step. It writes the set_real_ip_from list from TRUSTED_EDGE_PROXIES, which is empty by default.
ENV TRUSTED_EDGE_PROXIES=

COPY nginx/25-trusted-edge-proxies.sh /docker-entrypoint.d/25-trusted-edge-proxies.sh

RUN chmod 0755 /docker-entrypoint.d/25-trusted-edge-proxies.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
