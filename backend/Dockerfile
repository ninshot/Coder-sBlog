FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 8000

CMD ["npm", "start"] 