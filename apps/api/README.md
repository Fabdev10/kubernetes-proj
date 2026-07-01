# TaskFlow API

## Local development

1. Install dependencies:
   ```bash
   cd apps/api
   npm install
   ```
2. Start the API:
   ```bash
   DB_HOST=localhost DB_PORT=5432 DB_NAME=taskflow DB_USER=taskflow DB_PASSWORD=taskflowpass PORT=3000 npm start
   ```
3. The API will create the `tasks` table automatically on startup.

## Build with Docker

```bash
docker build -t taskflow-api ./apps/api
```

## Run with Docker

```bash
docker run --rm -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_NAME=taskflow \
  -e DB_USER=taskflow \
  -e DB_PASSWORD=taskflowpass \
  taskflow-api
```
