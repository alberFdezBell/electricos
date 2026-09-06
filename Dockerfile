FROM node:22-alpine

# Install sqlite runtime dependencies
RUN apk add --no-cache sqlite

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Create directories for persistent volumes
RUN mkdir -p data public/uploads

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV DB_PATH=/app/data/electricos.db

CMD ["npm", "start"]
