# =================================================================
# Multi-Stage Production Docker Build for LMS Java 17 Microservices
# =================================================================

# Stage 1: Build all Maven microservices
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY backend /app/backend
RUN cd /app/backend && mvn clean package -DskipTests

# Stage 2: Minimal Java 17 Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN apk add --no-cache bash curl

# Copy compiled JARs from build stage
COPY --from=build /app/backend/eureka-server/target/*.jar /app/eureka-server.jar
COPY --from=build /app/backend/user-service/target/*.jar /app/user-service.jar
COPY --from=build /app/backend/course-service/target/*.jar /app/course-service.jar
COPY --from=build /app/backend/enrollment-service/target/*.jar /app/enrollment-service.jar
COPY --from=build /app/backend/api-gateway/target/*.jar /app/api-gateway.jar

# Copy startup orchestrator script
COPY run-services.sh /app/run-services.sh
RUN chmod +x /app/run-services.sh

# Render routes web traffic to PORT (default 8080 or $PORT)
ENV PORT=8080
EXPOSE 8080 8761 8081 8082 8083

ENTRYPOINT ["/app/run-services.sh"]
