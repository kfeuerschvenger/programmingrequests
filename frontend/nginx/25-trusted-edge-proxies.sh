#!/bin/sh
# Writes /etc/nginx/trusted-edge-proxies.conf from TRUSTED_EDGE_PROXIES, a comma or space separated list of IPv4 or IPv6 addresses or CIDR ranges.
# The list should contain the outer proxy's own address, not a wide range: every address listed may state the client address in X-Forwarded-For.
# An empty value trusts nobody. Any entry that is not an address or a CIDR range stops the container, so a typo never widens or silently drops the trust list. A /0 prefix is rejected because it would trust every peer.
set -eu
# No pathname expansion: an entry such as "*" must be rejected, not expanded to file names.
set -f

target=/etc/nginx/trusted-edge-proxies.conf
number='^(0|[1-9][0-9]{0,2})$'
ipv6_chars='^[0-9A-Fa-f:]+$'
ipv6_digit='[0-9A-Fa-f]'

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

valid_ipv6() {
    address=$1
    printf '%s' "$address" | grep -Eq "$ipv6_chars" || return 1
    printf '%s' "$address" | grep -q "$ipv6_digit" || return 1
    printf '%s' "$address" | grep -q ':' || return 1
    # At most one "::" and no ":::" run.
    case "$address" in *:::*) return 1 ;; esac
    compressions=$(printf '%s' "$address" | grep -o '::' | wc -l)
    [ "$compressions" -le 1 ] || return 1
    # Groups are 1 to 4 hex digits; the empty groups left by a leading, trailing or compressing "::" are allowed.
    old_ifs=$IFS
    IFS=:
    # shellcheck disable=SC2086
    set -- $address
    IFS=$old_ifs
    for group in "$@"; do
        # An empty group has no line for grep to match, so test the length in the shell.
        [ "${#group}" -le 4 ] || return 1
    done
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
        [ -z "$prefix" ] && [ "$entry" = "$address" ] && return 0
        in_range "$prefix" 1 32
    else
        valid_ipv6 "$address" || return 1
        [ "$entry" = "$address" ] && return 0
        in_range "$prefix" 1 128
    fi
}

{
    echo "# Generated at container start from TRUSTED_EDGE_PROXIES."
    for entry in $(printf '%s' "${TRUSTED_EDGE_PROXIES:-}" | tr ',' ' '); do
        if valid_entry "$entry"; then
            echo "set_real_ip_from $entry;"
        else
            echo "25-trusted-edge-proxies.sh: TRUSTED_EDGE_PROXIES contains an entry that is not an IP address or a CIDR range with a prefix from 1: $entry" >&2
            exit 1
        fi
    done
} > "$target.tmp"

if ! grep -q '^set_real_ip_from' "$target.tmp"; then
    echo "25-trusted-edge-proxies.sh: WARN TRUSTED_EDGE_PROXIES is empty, so no outer proxy is trusted: every client appears as the direct TCP peer, and behind an outer reverse proxy all visitors share one identity (the proxy's address). Set TRUSTED_EDGE_PROXIES to the outer proxy's address to restore per-client identity." >&2
fi

mv "$target.tmp" "$target"
