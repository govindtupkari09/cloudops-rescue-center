# CloudOps Rescue Center

CloudOps Rescue Center is a cloud-native microservices project designed to demonstrate application containerization, CI/CD automation, AWS deployment, and Kubernetes orchestration.

The application consists of three main services:

- Frontend Dashboard
- Incident API
- Notification Service

The project demonstrates an end-to-end DevOps workflow using Docker, Docker Compose, Amazon ECR, Amazon ECS, GitHub Actions, Kubernetes, and Amazon EKS.
 
## Technology Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Nginx

### Backend
- Python
- Flask
- Flask-CORS

### Containerization
- Docker
- Docker Compose

### AWS Services
- Amazon ECR
- Amazon ECS
- AWS Cloud Map
- Application Load Balancer
- Amazon EKS
- AWS Fargate
- IAM

### CI/CD
- GitHub Actions

### Kubernetes
- Kubernetes
- Deployments
- Services
- ConfigMaps
- Amazon EKS
- Kubernetes LoadBalancer Service

### Version Control
- Git
- GitHub


## Project Architecture

The application follows a microservices architecture with three main components:

~~~text
                    User
                     |
                     v
            +-------------------+
            | Frontend Dashboard |
            |  HTML/CSS/JS/Nginx |
            +-------------------+
                     |
                     | HTTP API
                     v
            +------------------+
            |   Incident API   |
            |    Flask :5000   |
            +------------------+
                     |
                     | HTTP
                     v
            +----------------------+
            | Notification Service |
            |      Flask :5001     |
            +----------------------+

              Kubernetes / Amazon EKS
              ----------------------
              Frontend     -> Service
              Incident API -> Service
              Notification -> Service
~~~

### Application Flow

1. The user accesses the CloudOps Rescue Center dashboard.
2. The frontend communicates with the Incident API.
3. The Incident API manages incident data.
4. When a new incident is created, the Incident API calls the Notification Service.
5. Kubernetes Services provide internal service discovery and communication.
6. The application is deployed on Amazon EKS using Kubernetes Deployments and Services.

## Docker

Each application service is containerized using its own Dockerfile.

### Docker Images

- cloudops-frontend
- cloudops-incident-api
- cloudops-notification-service

### Docker Compose

Docker Compose is used to run the frontend and backend services together during local development and testing.

The services communicate through a Docker bridge network using service names.


## CI/CD Pipeline

GitHub Actions is used to automate the build and deployment process.

### Pipeline Flow

~~~text
Developer
    |
    v
GitHub Repository
    |
    v
GitHub Actions
    |
    +-----------------------------+
    |                             |
    v                             v
Docker Build                 AWS Authentication
    |                             |
    +-------------+---------------+
                  |
                  v
             Amazon ECR
                  |
                  v
             Amazon ECS
                  |
                  v
          Running Application
~~~

### CI/CD Process

1. Code is pushed to the main branch on GitHub.
2. GitHub Actions starts the CI/CD workflow.
3. Docker images are built for all three services.
4. Docker images are tagged and pushed to Amazon ECR.
5. ECS services are updated with a new deployment.
6. GitHub Actions waits for the ECS services to become stable.

## Kubernetes Deployment

The application is deployed on Amazon EKS using Kubernetes Deployments and Services.

### Kubernetes Components

- Amazon EKS cluster
- Kubernetes namespace: cloudops
- Frontend Deployment
- Incident API Deployment
- Notification Service Deployment
- Frontend LoadBalancer Service
- Incident API ClusterIP Service
- Notification Service ClusterIP

### Kubernetes Application Flow

~~~text
                    User
                     |
                     v
             Frontend Service
                     |
                     v
              Frontend Pod
                     |
                     v
             Incident API Service
                     |
                     v
              Incident API Pod
                     |
                     v
          Notification Service
                     |
                     v
          Notification Service Pod
~~~

The Incident API communicates with the Notification Service using the Kubernetes service name:

notification-service:5001

## Local Development

### Clone the Repository

~~~bash
git clone https://github.com/govindtupkari09/cloudops-rescue-center.git
cd cloudops-rescue-center
~~~

### Run with Docker Compose

~~~bash
docker compose up --build
~~~

The local services are available on:

- Frontend: http://localhost:80
- Incident API: http://localhost:5000
- Notification Service: http://localhost:5001

### Stop the Services

~~~bash
docker compose down
~~~

## AWS Deployment

The project uses multiple AWS services to support containerized application deployment.

### Amazon ECR

Docker images are stored in Amazon Elastic Container Registry (ECR).

ECR repositories:

- cloudops-frontend
- cloudops-incident-api
- cloudops-notification-service

### Amazon ECS

The containerized services are also deployed on Amazon ECS using AWS Fargate.

ECS services:

- cloudops-frontend-service
- cloudops-incident-api
- cloudops-notification-service

### Application Load Balancer

Application Load Balancers are used to expose the frontend and Incident API services.

### AWS Cloud Map

AWS Cloud Map provides service discovery for communication between the Incident API and Notification Service in ECS.

## Kubernetes Deployment Commands

### Configure AWS and Kubernetes

~~~bash
aws eks update-kubeconfig --name cloudops-rescue-eks --region ap-south-1
kubectl config current-context
~~~

### Create the Namespace

~~~bash
kubectl create namespace cloudops
~~~

### Deploy the Application

~~~bash
kubectl apply -f kubernetes/incident-api-deployment.yaml
kubectl apply -f kubernetes/incident-api-service.yaml
kubectl apply -f kubernetes/notification-service-deployment.yaml
kubectl apply -f kubernetes/notification-service.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/frontend-service.yaml
~~~

### Verify the Deployment

~~~bash
kubectl get pods -n cloudops
kubectl get services -n cloudops
kubectl get deployments -n cloudops
~~~

## Verification

The application was tested at multiple stages of the deployment process.

### Docker Verification

- Docker images built successfully.
- Docker Compose services started successfully.
- Container-to-container communication was verified.

### ECS Verification

- ECS services reached a stable running state.
- Incident API health endpoint returned a healthy response.
- Notification Service health endpoint returned a healthy response.
- Frontend was accessible through the ECS Application Load Balancer.

### Kubernetes Verification

- All application Pods reached the Running state.
- Kubernetes Services received active endpoints.
- Incident API successfully communicated with the Notification Service.
- Frontend was successfully exposed through a Kubernetes LoadBalancer Service.
- Application health endpoints returned successful responses.

### End-to-End Flow

A test incident was successfully created through the Kubernetes Incident API.
The Incident API processed the incident and successfully triggered the Notification Service.

## Repository

GitHub Repository:

https://github.com/govindtupkari09/cloudops-rescue-center

## Project Structure

~~~text
cloudops-rescue-center/
|-- .github/workflows/deploy.yml
|-- frontend/
|   |-- Dockerfile
|   |-- index.html
|   |-- script.js
|   -- style.css
|-- incident-api/
|   |-- Dockerfile
|   |-- app.py
|   -- requirements.txt
|-- notification-service/
|   |-- Dockerfile
|   |-- app.py
|   -- requirements.txt
|-- kubernetes/
|   |-- frontend-deployment.yaml
|   |-- frontend-service.yaml
|   |-- incident-api-deployment.yaml
|   |-- incident-api-service.yaml
|   |-- notification-service-deployment.yaml
|   -- notification-service.yaml
|-- docker-compose.yml
|-- buildspec.yml
|-- README.md
-- .gitignore
~~~

## Security and Configuration Notes

- AWS credentials are stored as GitHub repository secrets and are not committed to the repository.
- Environment-specific configuration should be provided through environment variables.
- Kubernetes service-to-service communication uses internal ClusterIP Services.
- The project should use least-privilege IAM permissions in a production environment.
- GitHub Actions can be improved further by using GitHub OIDC instead of long-lived AWS access keys.
