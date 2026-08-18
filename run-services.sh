#!/bin/bash
set -e

TARGET_PORT="${PORT:-8080}"
echo "================================================="
echo "🚀 STARTING LMS CLOUD MICROSERVICES (OPTIMIZED)"
echo "Render Public Gateway Port: ${TARGET_PORT}"
echo "================================================="

# Low-memory fast-boot JVM flags
JVM_OPTS="-XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss256k -Xms32m -Xmx96m"

# 1. Start API Gateway FIRST so Render port check passes immediately in < 2s
echo "1️⃣ Starting Public API Gateway on port ${TARGET_PORT}..."
java $JVM_OPTS -Dserver.port=${TARGET_PORT} -Dserver.address=0.0.0.0 -jar /app/api-gateway.jar &

# 2. Start Backend Microservices in parallel
echo "2️⃣ Starting User Service on port 8081..."
java $JVM_OPTS -jar /app/user-service.jar &

echo "3️⃣ Starting Course Service on port 8082..."
java $JVM_OPTS -jar /app/course-service.jar &

echo "4️⃣ Starting Enrollment Service on port 8083..."
java $JVM_OPTS -jar /app/enrollment-service.jar &

echo "✨ All microservices successfully launched! Monitoring processes..."
while true; do
  sleep 60
done
