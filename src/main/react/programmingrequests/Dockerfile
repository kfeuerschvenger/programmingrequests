FROM node:20-alpine AS build

WORKDIR /front

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /front/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]