# Use Node 20 alpine image
FROM node:20-alpine

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project
COPY . .

# Expose port
EXPOSE 5173

# Command to run the application
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
