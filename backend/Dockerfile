FROM node:18

WORKDIR /app


# Copy package files
COPY package*.json ./

# Install dependencies and rebuild bcrypt
RUN npm install

# Copy the rest of the application
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 8000

CMD ["npm", "start"]