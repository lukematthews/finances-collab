# Dockerfile.backend
FROM node:22

WORKDIR /
COPY ./package*.json ./
RUN npm install
COPY ./ ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
