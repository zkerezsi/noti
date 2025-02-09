FROM node:22-alpine3.20 AS builder
WORKDIR /workspace

COPY package*.json ./
RUN npm ci
RUN npm install -g @angular/cli@latest

COPY . .
RUN npm run build

FROM node:22-alpine3.20
WORKDIR /workspace

COPY --from=builder /workspace/dist .

CMD ["node", "./noti/server/server.mjs"]
