package com.feuerschvenger.codequests.security;

/**
 * The opaque identity of the caller for one request. It holds no address.
 *
 * @param voterHash 32-byte HMAC stored and compared as the voter id; callers must not modify the array
 * @param key       the same hash as lower-case hex, used as an in-memory map key
 */
public record ClientIdentity(byte[] voterHash, String key) {
}
