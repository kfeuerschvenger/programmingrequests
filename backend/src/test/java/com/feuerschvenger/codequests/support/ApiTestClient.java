package com.feuerschvenger.codequests.support;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Minimal HTTP client for tests that run against the real embedded server. It sends {@code X-Forwarded-For} when asked, the way nginx does.
 */
public final class ApiTestClient {

    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final HttpClient client = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build();
    private final String baseUrl;

    /**
     * Creates a client for a server port.
     *
     * @param port the random port of the embedded server
     */
    public ApiTestClient(int port) {
        this.baseUrl = "http://127.0.0.1:" + port;
    }

    /**
     * One response: status, headers and the parsed JSON body, or null when the body is empty.
     */
    public record Reply(int status, HttpResponse<String> raw, JsonNode body) {

        /** Returns the first value of a header, or null. */
        public String header(String name) {
            return raw.headers().firstValue(name).orElse(null);
        }
    }

    /** Sends a GET. */
    public Reply get(String path, String forwardedFor) {
        return send(builder(path, forwardedFor).GET().build());
    }

    /** Sends a POST with a JSON body. */
    public Reply post(String path, String json, String forwardedFor) {
        return send(builder(path, forwardedFor).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(json)).build());
    }

    /** Sends a POST with a plain-text body. */
    public Reply postText(String path, String text, String forwardedFor) {
        return send(builder(path, forwardedFor).header("Content-Type", "text/plain").POST(HttpRequest.BodyPublishers.ofString(text)).build());
    }

    /** Sends a PUT with a JSON body. */
    public Reply put(String path, String json, String forwardedFor) {
        return send(builder(path, forwardedFor).header("Content-Type", "application/json").PUT(HttpRequest.BodyPublishers.ofString(json)).build());
    }

    /** Sends a DELETE. */
    public Reply delete(String path, String forwardedFor) {
        return send(builder(path, forwardedFor).DELETE().build());
    }

    /** Sends a PATCH with an empty body. */
    public Reply patch(String path, String forwardedFor) {
        return send(builder(path, forwardedFor).method("PATCH", HttpRequest.BodyPublishers.noBody()).build());
    }

    private HttpRequest.Builder builder(String path, String forwardedFor) {
        var builder = HttpRequest.newBuilder(URI.create(baseUrl + path));
        if (forwardedFor != null) {
            builder.header("X-Forwarded-For", forwardedFor);
        }
        return builder;
    }

    private Reply send(HttpRequest request) {
        try {
            var response = client.send(request, HttpResponse.BodyHandlers.ofString());
            var text = response.body();
            return new Reply(response.statusCode(), response, text == null || text.isBlank() ? null : MAPPER.readTree(text));
        } catch (IOException e) {
            throw new IllegalStateException("Request failed", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Request interrupted", e);
        }
    }
}
