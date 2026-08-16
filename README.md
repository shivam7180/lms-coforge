# LMS Space - Full-Stack Learning Management System

LMS Space is a premium, high-performance, full-stack Learning Management System (LMS) built with **Spring Cloud Microservices** in the backend and a **Vite React SPA** in the frontend, backed by **MySQL** databases and secured with **Stateless JWT Security**.

---

## 🚀 Technology Stack

### Backend (Microservices)
- **Java 17** & **Spring Boot 3.2.8**
- **Spring Cloud 2023.0.2** (Eureka Discovery Server & API Gateway)
- **Spring Data JPA** & **Hibernate**
- **MySQL 8.0** (Separate databases per service)
- **Spring Security** & **JJWT 0.12.6** (Stateless JWT auth with shared secret)
- **OpenFeign** (Declarative REST client for inter-service communication)
- **Lombok** & **Jakarta Validation**
- **Maven** (Parent POM aggregate module structure)

### Frontend (Client Portal)
- **Vite** & **React 18**
- **React Router Dom v6** (Protected & role-based routing)
- **Axios** (With automatic request/response JWT interceptors)
- **Vanilla CSS** (Custom theme, radial glow layout, glassmorphic card elements, custom badges, forms, grids)

---

## 📂 Project Architecture

```
coforge_lmsproject/
├── backend/
│   ├── pom.xml                  # Parent Maven POM
│   ├── eureka-server/           # Service discovery (Port 8761)
│   ├── api-gateway/             # Gateway router (Port 8080)
│   ├── user-service/            # Auth & User management (Port 8081)
│   ├── course-service/          # Course management (Port 8082)
│   └── enrollment-service/      # Student enrollments & Feign client (Port 8083)
├── frontend/
│   ├── src/                     # React components, services, and pages
│   ├── Dockerfile               # Node builder & Nginx runner
│   ├── nginx.conf               # SPA routing fallback config
│   └── package.json             # NPM package manager config
├── database/
│   └── init.sql                 # Database creation and setup scripts
├── docker-compose.yml           # Multi-container orchestration
├── .env.example                 # Environment variables blueprint
└── README.md                    # Setup and guide documentation
```

---

## 🛠️ Local Startup Guide

### 1. Database Setup
Ensure MySQL is running on port 3306. Execute the setup script:
```bash
mysql -u root -p -e "source database/init.sql"
```
*(The default MySQL password on this machine is `shivam07`)*.

### 2. Configure Environment
Create a `.env` file in the root folder (or copy `.env.example`):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=shivam07
JWT_SECRET=bXlWZXJ5TG9uZ1NlY3JldEtleUZvckpXVFRva2VuR2VuZXJhdGlvblRoYXRJc0F0TGVhc3QyNTZCaXRzTG9uZzIwMjRMTVM=
JWT_EXPIRATION=86400000
```

### 3. Build & Start the Backend
Compile and package the parent project using Maven:
```bash
cd backend
mvn clean package -DskipTests
```
Start the microservices in order (using multiple terminal tabs):
```bash
# 1. Start Eureka Server (Port 8761)
mvn -pl eureka-server spring-boot:run

# 2. Start User Service (Port 8081)
$env:DB_PASSWORD="shivam07"; mvn -pl user-service spring-boot:run

# 3. Start Course Service (Port 8082)
$env:DB_PASSWORD="shivam07"; mvn -pl course-service spring-boot:run

# 4. Start Enrollment Service (Port 8083)
$env:DB_PASSWORD="shivam07"; mvn -pl enrollment-service spring-boot:run

# 5. Start API Gateway (Port 8080)
mvn -pl api-gateway spring-boot:run
```

### 4. Start the Frontend
Install dependencies and run Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🐳 Docker Compose Deployment
To spin up the entire multi-container architecture in one go:
```bash
# Package the jars first
cd backend && mvn clean package -DskipTests && cd ..

# Build and start all Docker containers
docker-compose up --build
```
- **React Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Gateway Router**: [http://localhost:8080](http://localhost:8080)
- **Eureka Dashboard**: [http://localhost:8761](http://localhost:8761)

---

## 🧪 Automated Testing
Run the E2E verification test checking JWT authorization, Feign Client operations, and Course/Enrollment endpoints:
```bash
python .gemini/antigravity/brain/54a6a5f3-2296-49ee-9b52-9e8beaf5a84a/scratch/verify_backend.py
```
*(Must output `ALL 18 E2E BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY!!!`)*.
