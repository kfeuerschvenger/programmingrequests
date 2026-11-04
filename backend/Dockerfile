# Stage 1: build the executable jar. The dependency layer is cached until the build scripts change.
FROM eclipse-temurin:25-jdk-alpine AS build

WORKDIR /workspace

COPY gradle gradle
COPY gradlew build.gradle settings.gradle ./
RUN ./gradlew --no-daemon dependencies > /dev/null

COPY src src
RUN ./gradlew --no-daemon bootJar -x test

# Stage 2: split the jar into layers so a code change only rewrites the small application layer.
FROM eclipse-temurin:25-jdk-alpine AS extract

WORKDIR /workspace

COPY --from=build /workspace/build/libs/app.jar app.jar
RUN java -Djarmode=tools -jar app.jar extract --layers --launcher --destination extracted

# Stage 3: minimal runtime, non-root.
FROM eclipse-temurin:25-jre-alpine

RUN addgroup -S app && adduser -S -G app app

WORKDIR /app

COPY --from=extract /workspace/extracted/dependencies/ ./
COPY --from=extract /workspace/extracted/spring-boot-loader/ ./
COPY --from=extract /workspace/extracted/snapshot-dependencies/ ./
COPY --from=extract /workspace/extracted/application/ ./

USER app

ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -q -O /dev/null http://localhost:8080/manage/health || exit 1

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
