FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/auth-service ./apps/auth-service
RUN npm install
RUN npm run build -w packages/shared && npm run build -w apps/auth-service
CMD ["node", "apps/auth-service/dist/index.js"]
