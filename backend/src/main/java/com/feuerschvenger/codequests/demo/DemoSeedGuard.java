package com.feuerschvenger.codequests.demo;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.Set;

/**
 * Decides whether the configured database is one the demo seeder may wipe.
 * <p>
 * The seeder deletes every idea and every vote before it inserts the demo data, so it must never run against a shared or remote database. The guard reads the host out of the JDBC URL and accepts only the hosts a local stack uses: the loopback names and the {@code db} service of the compose files. Anything it cannot parse with certainty is refused, including URLs that name several hosts or hide the host in a connection property.
 * </p>
 */
public final class DemoSeedGuard {

    /** Hosts that identify a local database. */
    static final Set<String> LOCAL_HOSTS = Set.of("localhost", "127.0.0.1", "::1", "[::1]", "db");

    private static final String JDBC_PREFIX = "jdbc:";

    private DemoSeedGuard() {
    }

    /**
     * Throws unless the datasource host is local.
     *
     * @param jdbcUrl value of {@code spring.datasource.url}
     * @throws IllegalStateException when the host is not local or cannot be determined
     */
    public static void requireLocalDatabase(String jdbcUrl) {
        var host = hostOf(jdbcUrl);
        if (host == null || !LOCAL_HOSTS.contains(host)) {
            throw new IllegalStateException("The demo profile seeds only a local database (localhost, 127.0.0.1, ::1 or db) and refuses to touch "
                    + (host == null ? "a datasource whose host cannot be determined" : "the host '" + host + "'")
                    + ". Unset SPRING_PROFILES_ACTIVE=demo or point DB_URL at a local database.");
        }
    }

    /**
     * Extracts the lower-case host of a JDBC URL.
     *
     * @param jdbcUrl value of {@code spring.datasource.url}
     * @return the host, or null when the URL is blank, malformed, names more than one host or carries the host in a property
     */
    static String hostOf(String jdbcUrl) {
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            return null;
        }
        var url = jdbcUrl.trim();
        if (!url.regionMatches(true, 0, JDBC_PREFIX, 0, JDBC_PREFIX.length())) {
            return null;
        }
        var remainder = url.substring(JDBC_PREFIX.length());
        // Connector/J accepts a host list and host properties that the URI parser would not see.
        var query = remainder.indexOf('?');
        if (query >= 0 && remainder.substring(query).toLowerCase(Locale.ROOT).contains("host=")) {
            return null;
        }
        try {
            var parsed = new URI(remainder);
            var host = parsed.getHost();
            if (host == null || parsed.getAuthority() == null || parsed.getAuthority().contains(",")) {
                return null;
            }
            return host.toLowerCase(Locale.ROOT);
        } catch (URISyntaxException e) {
            return null;
        }
    }
}
