# Use Node.js to build React
FROM node:20 AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Use Nginx to serve React
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
