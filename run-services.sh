#!/bin/bash
set -e

# Default to 8080 or Render injected PORT
TARGET_PORT="${PORT:-8080}"

echo "================================================="
echo "🚀 STARTING LMS CLOUD MICROSERVICES ON RENDER"
echo "Public Gateway Port: ${TARGET_PORT}"
echo "================================================="

# Start Eureka Service Discovery in background
echo "1️⃣ Starting Eureka Server on port 8761..."
java -Xms64m -Xmx128m -jar /app/eureka-server.jar > /tmp/eureka.log 2>&1 &
sleep 5

# Start Microservices concurrently with optimized memory footprints
echo "2️⃣ Starting User Service on port 8081..."
java -Xms64m -Xmx128m -jar /app/user-service.jar > /tmp/user.log 2>&1 &

echo "3️⃣ Starting Course Service on port 8082..."
java -Xms64m -Xmx128m -jar /app/course-service.jar > /tmp/course.log 2>&1 &

echo "4️⃣ Starting Enrollment Service on port 8083..."
java -Xms64m -Xmx128m -jar /app/enrollment-service.jar > /tmp/enrollment.log 2>&1 &

sleep 5

echo "5️⃣ Starting API Gateway on public port ${TARGET_PORT}..."
exec java -Xms64m -Xmx160m -Dserver.port=${TARGET_PORT} -Dserver.address=0.0.0.0 -jar /app/api-gateway.jar
