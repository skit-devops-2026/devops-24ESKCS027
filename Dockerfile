FROM node:24-alpine

WORKDIR /app

ARG GITHUB_SHA=unknown
ENV GITHUB_SHA=$GITHUB_SHA

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

ENV PORT=5000

CMD ["npm", "start"]