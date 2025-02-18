FROM node:18-alpine AS builder

# env
ARG VITE_PRIVY_APP_ID
ARG VITE_MOCK_USDC_ADDR
ARG VITE_BLOCKSHEEP_ADDR1
ARG VITE_BLOCKSHEEP_ADDR
ARG VITE_SERVER_BASE
ARG VITE_PIMLICO_BUNDLER_URL
ARG VITE_PIMLICO_PAYMASTER_URL
ARG CUSTOM_RPC_PROVIDER
ARG VITE_ENVIRONMENT

WORKDIR /app

# Copy monorepo package.json and yarn.lock first
COPY package.json ./

# Install all dependencies for the monorepo
RUN yarn install

# Change to frontend workspace
WORKDIR /app/packages/frontend

# Copy frontend code separately
COPY ./ ./

# Install frontend-specific dependencies (optional, but ensures correctness)
RUN yarn install

# Build the frontend
RUN yarn build

# Production image (lighter)
FROM node:18-alpine

WORKDIR /app
RUN yarn global add serve

COPY --from=builder /app/packages/frontend/build ./build

EXPOSE 3000
CMD ["serve", "-s", "build"]
