#!/bin/sh
# Writes /etc/nginx/trusted-edge-proxies.conf from TRUSTED_EDGE_PROXIES, a comma or space separated list of IPv4 or IPv6 addresses or CIDR ranges.
# An empty value trusts nobody. Any entry that is not an address or a CIDR range stops the container, so a typo never widens or silently drops the trust list.
set -eu
# No pathname expansion: an entry such as "*" must be rejected, not expanded to file names.
set -f

target=/etc/nginx/trusted-edge-proxies.conf
ipv4='^([0-9]{1,3}\.){3}[0-9]{1,3}(/[0-9]{1,2})?$'
ipv6='^[0-9A-Fa-f:]*:[0-9A-Fa-f:]*(/[0-9]{1,3})?$'

{
    echo "# Generated at container start from TRUSTED_EDGE_PROXIES."
    for entry in $(printf '%s' "${TRUSTED_EDGE_PROXIES:-}" | tr ',' ' '); do
        if printf '%s' "$entry" | grep -Eq "$ipv4" || printf '%s' "$entry" | grep -Eq "$ipv6"; then
            echo "set_real_ip_from $entry;"
        else
            echo "TRUSTED_EDGE_PROXIES contains an entry that is not an IP address or CIDR range: $entry" >&2
            exit 1
        fi
    done
} > "$target.tmp"

mv "$target.tmp" "$target"
