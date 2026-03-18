# Use Node.js latest LTS for building
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Use Nginx to serve the static files
FROM nginx:alpine

# Copy build files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the frontend port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
