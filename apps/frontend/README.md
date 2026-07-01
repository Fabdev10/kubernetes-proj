# TaskFlow Frontend

## Local development

Serve the static files with any simple web server:

```bash
cd apps/frontend
python -m http.server 8080
```

Then open http://localhost:8080 and set the API base URL by editing the generated config in the browser or by serving a custom `config.js` file.

## Build with Docker

```bash
docker build -t taskflow-frontend ./apps/frontend
```

## Run with Docker

```bash
docker run --rm -p 8080:80 \
  -e API_BASE_URL=http://localhost:3000 \
  taskflow-frontend
```
