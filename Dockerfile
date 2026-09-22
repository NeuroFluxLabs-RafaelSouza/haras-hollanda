FROM node:22.23.2-alpine3.24 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_KEY

RUN VITE_SUPABASE_URL="$PUBLIC_SUPABASE_URL" \
    VITE_SUPABASE_PUBLISHABLE_KEY="$PUBLIC_SUPABASE_KEY" \
    npm run build


FROM nginx:stable-alpine3.24-slim

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]