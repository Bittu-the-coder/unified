FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/user-service ./apps/user-service
RUN npm install
RUN npm run build -w packages/shared && npm run build -w apps/user-service
CMD ["node", "apps/user-service/dist/index.js"]
