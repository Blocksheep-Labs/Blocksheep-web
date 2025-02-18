FROM node:21-alpine3.20 AS builder
WORKDIR /app
COPY package.json ./
RUN yarn install
COPY . .
RUN yarn run build

FROM busybox:1.30 AS runner
WORKDIR /app
COPY --from=builder /app/dist .
CMD ["busybox", "httpd", "-f", "-v", "-p", "8080"]