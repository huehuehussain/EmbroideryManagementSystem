FROM node:16-alpine as build

WORKDIR /app/frontend

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:16-alpine

RUN npm install -g serve

WORKDIR /app

COPY --from=build /app/frontend/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
