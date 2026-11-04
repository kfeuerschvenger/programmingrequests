package com.feuerschvenger.codequests.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI metadata. The documentation endpoints themselves are enabled only by the {@code dev} profile.
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI codeQuestsOpenApi(@Value("${info.app.version:0.0.1}") String version) {
        return new OpenAPI().info(new Info()
                .title("Code Quests API")
                .description("API for submitting programming ideas and voting on them.")
                .version(version)
                .license(new License().name("MIT").url("https://opensource.org/licenses/MIT")));
    }
}
