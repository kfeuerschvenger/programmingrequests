package com.feuerschvenger.codequests.security;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.regex.Pattern;

/**
 * Reduces a client address to the unit that identifies one subscriber.
 * <p>
 * A single IPv6 subscriber normally holds a whole /64 prefix and can pick any address inside it, so hashing the full address would give one person an unlimited supply of identities. IPv6 addresses are therefore reduced to their /64 prefix. IPv4 addresses are kept as they are, and an IPv4-mapped IPv6 address is converted to its IPv4 form so one client has one identity whichever way the connection arrived.
 * </p>
 */
public final class ClientAddressNormalizer {

    private static final int IPV6_PREFIX_BYTES = 8;
    private static final String IPV6_PREFIX_SUFFIX = "/64";
    // Cheap pre-filter. The strict check is InetAddress.ofLiteral, which accepts address literals only and never asks the resolver for a host name, whereas InetAddress.getByName treats a malformed literal such as dead:beef as a host name and may query DNS.
    private static final Pattern IPV6_LITERAL = Pattern.compile("[0-9A-Fa-f:.]+");

    private ClientAddressNormalizer() {
    }

    /**
     * Normalises an address as reported by the server.
     *
     * @param address textual address, IPv4 or IPv6, possibly with an IPv6 zone suffix
     * @return the IPv4 address, or the IPv6 /64 prefix in expanded form followed by {@code /64}; an empty string for null, and the input unchanged when it is not an IPv6 literal
     */
    public static String normalize(String address) {
        if (address == null) {
            return "";
        }
        if (address.indexOf(':') < 0) {
            return address;
        }
        var zone = address.indexOf('%');
        var literal = zone < 0 ? address : address.substring(0, zone);
        if (!IPV6_LITERAL.matcher(literal).matches()) {
            return address;
        }
        try {
            var parsed = InetAddress.ofLiteral(literal);
            if (parsed instanceof Inet4Address) {
                return parsed.getHostAddress();
            }
            var bytes = parsed.getAddress();
            for (var i = IPV6_PREFIX_BYTES; i < bytes.length; i++) {
                bytes[i] = 0;
            }
            return InetAddress.getByAddress(bytes).getHostAddress() + IPV6_PREFIX_SUFFIX;
        } catch (IllegalArgumentException | UnknownHostException e) {
            return address;
        }
    }
}
