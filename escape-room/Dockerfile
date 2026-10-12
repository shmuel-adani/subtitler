# Builds the game and runs the bundled server. The image has no runtime dependencies.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json build.mjs template.html ./
COPY src ./src
RUN npm install --no-audit --no-fund

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data
COPY --from=build /app/dist ./dist
COPY server ./server
COPY package.json ./
RUN mkdir -p /data && chown node:node /data
VOLUME /data
EXPOSE 8080
USER node
CMD ["node", "server/server.mjs"]
