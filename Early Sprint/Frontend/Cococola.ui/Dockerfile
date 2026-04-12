FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN chmod +x node_modules/.bin/ng
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/cocacola-b2b-portal/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
