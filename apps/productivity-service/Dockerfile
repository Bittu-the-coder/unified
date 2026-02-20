FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/productivity-service ./apps/productivity-service
RUN npm install
RUN npm run build -w packages/shared && npm run build -w apps/productivity-service
CMD ["node", "apps/productivity-service/dist/index.js"]
