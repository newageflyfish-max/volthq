/**
 * Volt HQ — Feed Signing
 *
 * Ed25519 signing for pricing feed integrity.
 * The aggregation service signs feeds with a private key.
 * MCP servers verify with the embedded public key.
 *
 * Uses the Web Crypto API (available in Cloudflare Workers and Node 18+).
 */
/**
 * Sign a pricing feed payload.
 * Used by the Price Aggregation Worker.
 */
export async function signFeed(timestamp, offeringsJson, privateKeyBase64) {
    const message = timestamp + offeringsJson;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const keyBytes = base64ToBytes(privateKeyBase64);
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'Ed25519' }, false, ['sign']);
    const signature = await crypto.subtle.sign('Ed25519', key, data);
    return bytesToBase64(new Uint8Array(signature));
}
/**
 * Verify a pricing feed signature.
 * Used by MCP servers to ensure feed hasn't been tampered with.
 */
export async function verifyFeed(timestamp, offeringsJson, signatureBase64, publicKeyBase64) {
    try {
        const message = timestamp + offeringsJson;
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const keyBytes = base64ToBytes(publicKeyBase64);
        const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'Ed25519' }, false, ['verify']);
        const sigBytes = base64ToBytes(signatureBase64);
        return await crypto.subtle.verify('Ed25519', key, sigBytes, data);
    }
    catch {
        return false;
    }
}
/**
 * Generate a new Ed25519 keypair.
 * Run once during initial setup. Store private key in Worker secrets.
 */
export async function generateKeypair() {
    const keypair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
    const publicKeyBytes = await crypto.subtle.exportKey('raw', keypair.publicKey);
    const privateKeyBytes = await crypto.subtle.exportKey('raw', keypair.privateKey);
    return {
        publicKey: bytesToBase64(new Uint8Array(publicKeyBytes)),
        privateKey: bytesToBase64(new Uint8Array(privateKeyBytes)),
    };
}
// ═══════════════════════════════════════════════════════
// Base64 helpers (no dependency on Node Buffer)
// Works in both Cloudflare Workers and Node.js
// ═══════════════════════════════════════════════════════
function base64ToBytes(base64) {
    const binString = atob(base64);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
}
function bytesToBase64(bytes) {
    let binString = '';
    for (let i = 0; i < bytes.length; i++) {
        binString += String.fromCharCode(bytes[i]);
    }
    return btoa(binString);
}
//# sourceMappingURL=signing.js.map