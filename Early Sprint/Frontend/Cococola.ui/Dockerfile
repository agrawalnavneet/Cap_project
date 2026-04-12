FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN echo "cache bypass 5"
COPY . .
RUN chmod +x node_modules/.bin/ng
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/hul-supply-portal/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# Cache bypass 1
