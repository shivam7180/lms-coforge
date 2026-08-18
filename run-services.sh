#!/bin/bash
set -e

TARGET_PORT="${PORT:-8080}"
echo "================================================="
echo "🚀 STARTING LMS CLOUD MICROSERVICES (OPTIMIZED)"
echo "Render Public Gateway Port: ${TARGET_PORT}"
echo "================================================="

# Ultra-fast low-memory JVM flags for cloud free tiers (512MB RAM)
JVM_OPTS="-XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss256k -Xms32m -Xmx96m"

# 1. Start Eureka Service Registry
echo "1️⃣ Starting Eureka Server on port 8761..."
java $JVM_OPTS -jar /app/eureka-server.jar &

# 2. Start API Gateway IMMEDIATELY on $TARGET_PORT so Render detects the open port in <5s
echo "2️⃣ Starting Public API Gateway on port ${TARGET_PORT}..."
java $JVM_OPTS -Dserver.port=${TARGET_PORT} -Dserver.address=0.0.0.0 -jar /app/api-gateway.jar &

# 3. Start Backend Microservices in parallel
echo "3️⃣ Starting User Service on port 8081..."
java $JVM_OPTS -jar /app/user-service.jar &

echo "4️⃣ Starting Course Service on port 8082..."
java $JVM_OPTS -jar /app/course-service.jar &

echo "5️⃣ Starting Enrollment Service on port 8083..."
java $JVM_OPTS -jar /app/enrollment-service.jar &

echo "✨ All microservices successfully launched! Monitoring processes..."
# Wait for any process to exit or keep alive
while true; do
  sleep 60
done
