FROM gradle:jdk23-alpine

WORKDIR /back

COPY . .

RUN ./gradlew clean build -x test

ARG JAR_FILE=build/libs/*SNAPSHOT.jar

ENV JAR_FILE=${JAR_FILE}

ENTRYPOINT ["sh", "-c", "java -jar /back/${JAR_FILE}"]