FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=4150
EXPOSE 4150
CMD ["node", "server.js"]
