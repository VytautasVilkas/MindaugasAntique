# Use Node.js for building React app
FROM node:20 AS build
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./
RUN npm install

# Copy all project files AFTER installing dependencies
COPY . . 
RUN npm run build

# Use Nginx to serve the built React app
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default Nginx static files
RUN rm -rf ./*

# Copy React build output to Nginx HTML directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

