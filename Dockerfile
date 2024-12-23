FROM node:current-alpine

LABEL maintainer="farizink <nizaralfariziakbar10@gmail.com>"

RUN apk add chromium

WORKDIR /app

ADD package.json ./
ADD .env ./
RUN npm i

ADD index.js ./

CMD ["npm", "start"]