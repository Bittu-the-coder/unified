FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/gateway ./apps/gateway
RUN npm install
RUN npm run build -w packages/shared && npm run build -w apps/gateway
CMD ["node", "apps/gateway/dist/index.js"]
