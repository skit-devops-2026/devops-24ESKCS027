FROM node:24-alpine

# Set working directory
WORKDIR /app

# Build arguments and runtime environment
ARG GITHUB_SHA=unknown
ENV GITHUB_SHA=$GITHUB_SHA
ENV NODE_ENV=production
ENV PORT=5000

# Install dependencies first for optimal layer caching
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
COPY . .

# Set permissions and run as non-root user
RUN chown -R node:node /app
USER node

EXPOSE 5000

# Container healthcheck using lightweight busybox wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["npm", "start"]