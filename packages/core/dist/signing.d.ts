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
export declare function signFeed(timestamp: string, offeringsJson: string, privateKeyBase64: string): Promise<string>;
/**
 * Verify a pricing feed signature.
 * Used by MCP servers to ensure feed hasn't been tampered with.
 */
export declare function verifyFeed(timestamp: string, offeringsJson: string, signatureBase64: string, publicKeyBase64: string): Promise<boolean>;
/**
 * Generate a new Ed25519 keypair.
 * Run once during initial setup. Store private key in Worker secrets.
 */
export declare function generateKeypair(): Promise<{
    publicKey: string;
    privateKey: string;
}>;
//# sourceMappingURL=signing.d.ts.map