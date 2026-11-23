FROM node:26-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json tsconfig.base.json ./
COPY frontend/package.json ./frontend/

RUN npm ci --workspace=frontend --include-workspace-root

COPY frontend ./frontend
RUN npm --workspace=frontend run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
