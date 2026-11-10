package com.feuerschvenger.codequests.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("TRUSTED_PROXIES default of the compose files")
class ComposeTrustedProxyDefaultTest {

    private static final Pattern DEFAULT_LINE = Pattern.compile("TRUSTED_PROXIES: \\$\\{TRUSTED_PROXIES:-(.+)}\\s*$", Pattern.MULTILINE);

    /** Reads the default exactly as compose renders it: the text after {@code :-}, with no further escaping. */
    private static Pattern composeDefault(String file) throws IOException {
        var content = Files.readString(Path.of("..", file));
        var matcher = DEFAULT_LINE.matcher(content);
        assertThat(matcher.find()).as("TRUSTED_PROXIES default in %s", file).isTrue();
        return Pattern.compile(matcher.group(1));
    }

    // Tomcat applies the expression with a full match, so Pattern.matches is the same test.
    @ParameterizedTest
    @CsvSource({
            "docker-compose.yml, 172.29.240",
            "docker-compose.development.yml, 172.29.241"
    })
    @DisplayName("trusts the app_net subnet except its gateway and nothing else")
    void excludesGatewayAndForeignAddresses(String file, String prefix) throws IOException {
        var regex = composeDefault(file);

        assertThat(Pattern.matches(regex.pattern(), prefix + ".1")).isFalse();
        assertThat(Pattern.matches(regex.pattern(), prefix + ".2")).isTrue();
        assertThat(Pattern.matches(regex.pattern(), prefix + ".10")).isTrue();
        assertThat(Pattern.matches(regex.pattern(), prefix + ".254")).isTrue();
        assertThat(Pattern.matches(regex.pattern(), "172.29.250.5")).isFalse();
        assertThat(Pattern.matches(regex.pattern(), "10.0.0.1")).isFalse();
    }

    @ParameterizedTest
    @CsvSource({
            "docker-compose.yml, 172.29.241.5",
            "docker-compose.development.yml, 172.29.240.5"
    })
    @DisplayName("does not trust the subnet of the other stack")
    void rejectsTheOtherStackSubnet(String file, String address) throws IOException {
        assertThat(Pattern.matches(composeDefault(file).pattern(), address)).isFalse();
    }
}
