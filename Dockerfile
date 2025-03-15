FROM gradle:jdk23-alpine

WORKDIR /back

COPY . .

RUN ./gradlew clean build

ARG JAR_FILE=build/libs/*SNAPSHOT.jar

ENTRYPOINT [ "java", "-jar", "/build/libs/programmingrequests-0.0.1-SNAPSHOT.jar" ]


