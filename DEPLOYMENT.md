# Deployment Guide

## 1. Build the images

Build the API and frontend images locally:

```bash
docker build -t <dockerhub-user>/taskflow-api:latest ./apps/api
docker build -t <dockerhub-user>/taskflow-frontend:latest ./apps/frontend
```

## 2. Push images to Docker Hub

Log in and push the images:

```bash
docker login
docker push <dockerhub-user>/taskflow-api:latest
docker push <dockerhub-user>/taskflow-frontend:latest
```

Update the image references in the Kubernetes manifests if you use a different registry or tag.

## 3. Install the application in Kubernetes

Apply the full stack:

```bash
kubectl apply -k k8s/
```

## 4. Verify the pods

```bash
kubectl get pods -n taskflow
kubectl describe pod -n taskflow -l app.kubernetes.io/name=taskflow
```

## 5. Verify the services

```bash
kubectl get svc -n taskflow
kubectl get endpoints -n taskflow
```

## 6. Install the Ingress

If nginx-ingress is installed, the included ingress resource will route traffic to the frontend and API. Add the host mapping locally:

```bash
echo "127.0.0.1 taskflow.local" | sudo tee -a /etc/hosts
```

Then open http://taskflow.local.

## 7. Update the application

After changing the application code or image tags, rebuild the images and re-apply the manifests:

```bash
docker build -t <dockerhub-user>/taskflow-api:latest ./apps/api
docker build -t <dockerhub-user>/taskflow-frontend:latest ./apps/frontend
docker push <dockerhub-user>/taskflow-api:latest
docker push <dockerhub-user>/taskflow-frontend:latest
kubectl rollout restart deployment/taskflow-api -n taskflow
kubectl rollout restart deployment/taskflow-frontend -n taskflow
```

## 8. Rollback

Rollback a deployment to the previous revision:

```bash
kubectl rollout undo deployment/taskflow-api -n taskflow
kubectl rollout undo deployment/taskflow-frontend -n taskflow
```
