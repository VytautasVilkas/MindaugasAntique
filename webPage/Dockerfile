# Use Node.js for building React app
FROM node:20 AS build
WORKDIR /app

# # Copy package.json and package-lock.json first (for efficient caching)
# COPY package.json package-lock.json ./
# RUN npm install


WORKDIR /app
COPY . .
RUN npm install && npm run build

# Use Nginx to serve the built React app
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf  

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
