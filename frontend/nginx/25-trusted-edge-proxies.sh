#!/bin/sh
# Writes two files from TRUSTED_EDGE_PROXIES, a comma or space separated list of IPv4 or IPv6 addresses or CIDR ranges:
# /etc/nginx/trusted-edge-proxies.conf holds one set_real_ip_from line per entry, and /etc/nginx/trusted-edge-geo.conf holds the geo block that sets $trusted_edge to 1 for the same peers.
# The list should contain the outer proxy's own address, not a wide range: every address listed may state the client address in X-Forwarded-For and the scheme and port in X-Forwarded-Proto and X-Forwarded-Port.
# An empty value trusts nobody. Any entry that is not an address or a CIDR range stops the container, so a typo never widens or silently drops the trust list. A range must be at least a /8 for IPv4 and a /16 for IPv6: anything wider would trust a large part of the address space. An IPv6 prefix below /16, such as fd00::/8, is rejected by design for the same reason, so list the exact addresses or a narrower range instead.
# An IPv4-mapped IPv6 address (::ffff:10.0.0.1) is accepted when its IPv4 part is valid, and is written as the plain IPv4 address because nginx matches an IPv4 peer only against IPv4 entries. A mapped range ::ffff:a.b.c.d/n must have n between 104 and 128 and is written as a.b.c.d/(n-96).
set -eu
# No pathname expansion: an entry such as "*" must be rejected, not expanded to file names.
set -f

real_ip_target=/etc/nginx/trusted-edge-proxies.conf
geo_target=/etc/nginx/trusted-edge-geo.conf
number='^(0|[1-9][0-9]{0,2})$'
ipv6_chars='^[0-9A-Fa-f:]+$'
ipv6_group='^[0-9A-Fa-f]{1,4}$'

# Succeeds when $1 is a decimal number between $2 and $3, written without leading zeros.
in_range() {
    printf '%s' "$1" | grep -Eq "$number" && [ "$1" -ge "$2" ] && [ "$1" -le "$3" ]
}

valid_ipv4() {
    address=$1
    printf '%s' "$address" | grep -Eq '^[0-9]+(\.[0-9]+){3}$' || return 1
    old_ifs=$IFS
    IFS=.
    # shellcheck disable=SC2086
    set -- $address
    IFS=$old_ifs
    for octet in "$@"; do
        in_range "$octet" 0 255 || return 1
    done
}

# Prints the number of groups in $1, a colon separated list. Fails when a group is empty or is not 1 to 4 hex digits, which is how a lone leading or trailing colon shows up. An empty list has no groups.
count_groups() {
    rest=$1
    count=0
    if [ -z "$rest" ]; then
        echo 0
        return 0
    fi
    while :; do
        group=${rest%%:*}
        printf '%s' "$group" | grep -Eq "$ipv6_group" || return 1
        count=$((count + 1))
        case "$rest" in
            *:*) rest=${rest#*:} ;;
            *) break ;;
        esac
    done
    echo "$count"
}

# A full address has exactly 8 groups. A "::" stands for one or more groups of zeros, so an address with one has at most 7 written groups, split between the part before and the part after it.
valid_ipv6() {
    address=$1
    # An IPv4-mapped address, ::ffff:a.b.c.d, is how a dual-stack listener shows an IPv4 peer. Its IPv4 part is checked like any other IPv4 address.
    case "$address" in
        ::[fF][fF][fF][fF]:*.*)
            # A subshell, because valid_ipv4 assigns the shell-wide variable "address" that the caller still needs.
            (valid_ipv4 "${address#::????:}")
            return
            ;;
    esac
    printf '%s' "$address" | grep -Eq "$ipv6_chars" || return 1
    case "$address" in
        *:::*) return 1 ;;
        *::*)
            head=${address%%::*}
            tail=${address#*::}
            case "$tail" in *::*) return 1 ;; esac
            head_groups=$(count_groups "$head") || return 1
            tail_groups=$(count_groups "$tail") || return 1
            [ $((head_groups + tail_groups)) -le 7 ]
            ;;
        *)
            groups=$(count_groups "$address") || return 1
            [ "$groups" -eq 8 ]
            ;;
    esac
}

valid_entry() {
    entry=$1
    case "$entry" in
        */*)
            address=${entry%%/*}
            prefix=${entry#*/}
            ;;
        *)
            address=$entry
            prefix=
            ;;
    esac
    case "$address" in
        *:*) kind=6 ;;
        *) kind=4 ;;
    esac
    if [ "$kind" = 4 ]; then
        valid_ipv4 "$address" || return 1
        [ "$entry" = "$address" ] && return 0
        in_range "$prefix" 8 32
    else
        valid_ipv6 "$address" || return 1
        [ "$entry" = "$address" ] && return 0
        case "$address" in
            # The 96 bits before the IPv4 part are fixed, so a prefix of 104 to 128 is a /8 to /32 of the IPv4 address.
            ::[fF][fF][fF][fF]:*.*) in_range "$prefix" 104 128 ;;
            *) in_range "$prefix" 16 128 ;;
        esac
    fi
}

# Prints the entry as nginx must match it. nginx matches an IPv4 peer only against IPv4 entries, so an IPv4-mapped entry (::ffff:a.b.c.d or ::ffff:a.b.c.d/n) becomes a.b.c.d or a.b.c.d/(n-96). Any other entry is printed unchanged.
normalise_entry() {
    case "$1" in
        ::[fF][fF][fF][fF]:*.*)
            mapped=${1#::????:}
            case "$mapped" in
                */*) echo "${mapped%%/*}/$((${mapped#*/} - 96))" ;;
                *) echo "$mapped" ;;
            esac
            ;;
        *) echo "$1" ;;
    esac
}

{
    echo "# Generated at container start from TRUSTED_EDGE_PROXIES."
} > "$real_ip_target.tmp"
{
    echo "# Generated at container start from TRUSTED_EDGE_PROXIES."
    echo "geo \$realip_remote_addr \$trusted_edge {"
    echo "    default 0;"
} > "$geo_target.tmp"

entries=0
for entry in $(printf '%s' "${TRUSTED_EDGE_PROXIES:-}" | tr ',' ' '); do
    if valid_entry "$entry"; then
        normalised=$(normalise_entry "$entry")
        echo "set_real_ip_from $normalised;" >> "$real_ip_target.tmp"
        echo "    $normalised 1;" >> "$geo_target.tmp"
        entries=$((entries + 1))
    else
        echo "25-trusted-edge-proxies.sh: TRUSTED_EDGE_PROXIES contains an entry that is not an IP address or a CIDR range of at least /8 (IPv4) or /16 (IPv6): $entry" >&2
        rm -f "$real_ip_target.tmp" "$geo_target.tmp"
        exit 1
    fi
done

echo "}" >> "$geo_target.tmp"

if [ "$entries" -eq 0 ]; then
    echo "25-trusted-edge-proxies.sh: WARN TRUSTED_EDGE_PROXIES is empty, so no outer proxy is trusted: every client appears as the direct TCP peer, and behind an outer reverse proxy all visitors share one identity (the proxy's address). Set TRUSTED_EDGE_PROXIES to the outer proxy's address to restore per-client identity." >&2
fi

mv "$real_ip_target.tmp" "$real_ip_target"
mv "$geo_target.tmp" "$geo_target"
