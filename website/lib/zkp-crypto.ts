/**
 * Client-side ZKP Crypto — Schnorr proof over secp256k1
 *
 * This runs IN THE BROWSER. The private key NEVER leaves the user's device.
 * Uses @noble/secp256k1 — the same curve as Bitcoin.
 */

import { getPublicKey, utils } from "@noble/secp256k1";

// secp256k1 curve order
const ORDER = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");

// ── Hex utils ──

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// SHA-256 pure JS implementation (no external deps, works in all browsers)

function sha256Sync(data: Uint8Array): Uint8Array {
  // Fallback: use a simple sync implementation for proof generation
  // We'll use the async version where possible
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const k = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  const rr = (v: number, n: number) => (v >>> n) | (v << (32 - n));
  // Pad
  const bits = data.length * 8;
  const padded = new Uint8Array(Math.ceil((data.length + 9) / 64) * 64);
  padded.set(data);
  padded[data.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 4, bits, false);
  // Process
  for (let off = 0; off < padded.length; off += 64) {
    const w = new Int32Array(64);
    for (let i = 0; i < 16; i++) w[i] = dv.getInt32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rr(w[i-15]>>>0,7) ^ rr(w[i-15]>>>0,18) ^ (w[i-15]>>>3);
      const s1 = rr(w[i-2]>>>0,17) ^ rr(w[i-2]>>>0,19) ^ (w[i-2]>>>10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
    }
    let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rr(e>>>0,6)^rr(e>>>0,11)^rr(e>>>0,25);
      const ch = (e&f)^((~e)&g);
      const t1 = (h+S1+ch+k[i]+w[i])|0;
      const S0 = rr(a>>>0,2)^rr(a>>>0,13)^rr(a>>>0,22);
      const maj = (a&b)^(a&c)^(b&c);
      const t2 = (S0+maj)|0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
    }
    h0=(h0+a)|0; h1=(h1+b)|0; h2=(h2+c)|0; h3=(h3+d)|0;
    h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0;
  }
  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  [h0,h1,h2,h3,h4,h5,h6,h7].forEach((v,i) => ov.setUint32(i*4, v>>>0, false));
  return out;
}

// ── Key Generation ──

export function generateKeyPair() {
  const privateKeyBytes = utils.randomSecretKey();
  const privateKeyHex = bytesToHex(privateKeyBytes);
  const publicKeyBytes = getPublicKey(privateKeyBytes, true); // compressed
  const publicKeyHex = bytesToHex(publicKeyBytes);

  return {
    privateKey: privateKeyHex,
    publicKey: publicKeyHex,
  };
}

// ── Schnorr Proof Creation (Sigma Protocol) ──

export function createProof(privateKeyHex: string, publicKeyHex: string, message: string) {
  const privateKey = BigInt("0x" + privateKeyHex);

  // Step 1: Random nonce k
  const kBytes = utils.randomSecretKey();
  const k = BigInt("0x" + bytesToHex(kBytes));

  // Step 2: Commitment R = k * G (get uncompressed to extract x, y)
  const commitmentUncompressed = getPublicKey(kBytes, false); // 65 bytes: 04 || x || y
  const commitmentX = bytesToHex(commitmentUncompressed.slice(1, 33));
  const commitmentY = bytesToHex(commitmentUncompressed.slice(33, 65));

  // Step 3: Challenge = SHA256(R_compressed || PK || message) mod order
  const msgBytes = new TextEncoder().encode(message);
  const commitmentCompressed = getPublicKey(kBytes, true);
  const pkBytes = hexToBytes(publicKeyHex);

  const challengeInput = new Uint8Array([...commitmentCompressed, ...pkBytes, ...msgBytes]);
  const challengeHash = sha256Sync(challengeInput);
  const challengeScalar = BigInt("0x" + bytesToHex(challengeHash)) % ORDER;

  // Step 4: Response s = k - c * privateKey (mod order)
  let response = (k - challengeScalar * privateKey) % ORDER;
  if (response < BigInt(0)) response += ORDER;

  // Step 5: Message hash
  const messageHash = bytesToHex(sha256Sync(msgBytes));

  return {
    commitment_x: commitmentX,
    commitment_y: commitmentY,
    challenge: challengeScalar.toString(16),
    response: response.toString(16),
    message_hash: messageHash,
  };
}

// ── Key Storage ──

export function storeKeyPair(privateKey: string, publicKey: string) {
  localStorage.setItem("zkp_private_key", privateKey);
  localStorage.setItem("zkp_public_key", publicKey);
}

export function getStoredKeys() {
  return {
    privateKey: localStorage.getItem("zkp_private_key"),
    publicKey: localStorage.getItem("zkp_public_key"),
  };
}

export function clearStoredKeys() {
  localStorage.removeItem("zkp_private_key");
  localStorage.removeItem("zkp_public_key");
  localStorage.removeItem("zkp_token");
}

export function downloadKeyBackup(privateKey: string, email: string) {
  const backup = {
    version: 1,
    app: "ZKProofAPI",
    email,
    private_key: privateKey,
    created_at: new Date().toISOString(),
    warning: "This is your private key. NEVER share it. Store it securely.",
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zkproofapi-key-backup-${email.split("@")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
