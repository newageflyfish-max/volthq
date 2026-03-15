FROM node:20-alpine

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy packages needed for mcp-server
COPY packages/core ./packages/core
COPY packages/mcp-server ./packages/mcp-server

# Install dependencies
RUN npm ci --workspace=packages/core --workspace=packages/mcp-server

# Build
RUN npm run build --workspace=packages/core --workspace=packages/mcp-server

WORKDIR /app/packages/mcp-server

ENV NODE_ENV=production

ENTRYPOINT ["node", "dist/index.js"]
