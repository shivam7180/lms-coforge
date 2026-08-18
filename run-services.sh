#!/bin/bash
set -e

echo "================================================="
echo "🚀 STARTING LMS CLOUD MICROSERVICES ON RENDER"
echo "================================================="

# Start Eureka Service Discovery
echo "1️⃣ Starting Eureka Server on port 8761..."
java -jar /app/eureka-server.jar > /tmp/eureka.log 2>&1 &
sleep 12

# Start Core Microservices
echo "2️⃣ Starting User Service on port 8081..."
java -jar /app/user-service.jar > /tmp/user.log 2>&1 &

echo "3️⃣ Starting Course Service on port 8082..."
java -jar /app/course-service.jar > /tmp/course.log 2>&1 &

echo "4️⃣ Starting Enrollment Service on port 8083..."
java -jar /app/enrollment-service.jar > /tmp/enrollment.log 2>&1 &

# Allow services to register with Eureka
sleep 15

echo "5️⃣ Starting API Gateway on public port 8080..."
exec java -jar /app/api-gateway.jar
