import { Router } from "express";
import { z } from "zod";

const router = Router();

const DecodeSchema = z.object({
  input: z.string(),
  methods: z
    .array(
      z.enum(["base64", "rot13", "hex", "morse", "binary", "url", "reverse"])
    )
    .optional(),
});

const HashSchema = z.object({
  input: z.string(),
});

const MORSE_CODE: Record<string, string> = {
  ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E",
  "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J",
  "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O",
  ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T",
  "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y",
  "--..": "Z", ".----": "1", "..---": "2", "...--": "3", "....-": "4",
  ".....": "5", "-....": "6", "--...": "7", "---..": "8", "----.": "9",
  "-----": "0", ".-.-.-": ".", "--..--": ",", "..--..": "?",
};

function tryBase64(input: string): { output: string; success: boolean } {
  try {
    const decoded = Buffer.from(input.trim(), "base64").toString("utf-8");
    const isPrintable = /^[\x20-\x7E\n\r\t]*$/.test(decoded);
    return { output: decoded, success: isPrintable && decoded.length > 0 };
  } catch {
    return { output: "", success: false };
  }
}

function tryRot13(input: string): { output: string; success: boolean } {
  const output = input.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
  return { output, success: output !== input };
}

function tryHexToAscii(input: string): { output: string; success: boolean } {
  const hex = input.trim().replace(/\s+/g, "").replace(/^0x/, "");
  if (!/^[0-9A-Fa-f]+$/.test(hex) || hex.length % 2 !== 0) {
    return { output: "", success: false };
  }
  try {
    const decoded = Buffer.from(hex, "hex").toString("utf-8");
    const isPrintable = /^[\x20-\x7E\n\r\t]*$/.test(decoded);
    return { output: decoded, success: isPrintable && decoded.length > 0 };
  } catch {
    return { output: "", success: false };
  }
}

function tryMorse(input: string): { output: string; success: boolean } {
  const words = input.trim().split(/\s{3,}|\//);
  const decoded = words
    .map((word) => {
      return word
        .split(/\s+/)
        .map((char) => MORSE_CODE[char] ?? "?")
        .join("");
    })
    .join(" ");
  const hasUnknown = decoded.includes("?");
  return { output: decoded, success: !hasUnknown };
}

function tryBinary(input: string): { output: string; success: boolean } {
  const clean = input.trim().replace(/\s+/g, " ");
  const parts = clean.split(" ");
  if (!parts.every((p) => /^[01]{8}$/.test(p))) {
    const joined = clean.replace(/\s/g, "");
    if (!/^[01]+$/.test(joined) || joined.length % 8 !== 0) {
      return { output: "", success: false };
    }
    const chunks: string[] = [];
    for (let i = 0; i < joined.length; i += 8) {
      chunks.push(joined.slice(i, i + 8));
    }
    const decoded = chunks
      .map((b) => String.fromCharCode(parseInt(b, 2)))
      .join("");
    const isPrintable = /^[\x20-\x7E]*$/.test(decoded);
    return { output: decoded, success: isPrintable };
  }
  const decoded = parts
    .map((b) => String.fromCharCode(parseInt(b, 2)))
    .join("");
  const isPrintable = /^[\x20-\x7E]*$/.test(decoded);
  return { output: decoded, success: isPrintable };
}

function tryUrlDecode(input: string): { output: string; success: boolean } {
  try {
    const decoded = decodeURIComponent(input.trim());
    return { output: decoded, success: decoded !== input };
  } catch {
    return { output: "", success: false };
  }
}

function tryReverse(input: string): { output: string; success: boolean } {
  const output = input.split("").reverse().join("");
  return { output, success: true };
}

function identifyHashType(input: string): Array<{ name: string; probability: string }> {
  const clean = input.trim();
  const len = clean.length;
  const isHex = /^[0-9a-fA-F]+$/.test(clean);
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(clean);
  const types: Array<{ name: string; probability: string }> = [];

  if (isHex) {
    if (len === 32) types.push({ name: "MD5", probability: "very high" });
    if (len === 40) types.push({ name: "SHA-1", probability: "very high" });
    if (len === 56) types.push({ name: "SHA-224", probability: "very high" });
    if (len === 64) types.push({ name: "SHA-256", probability: "very high" });
    if (len === 96) types.push({ name: "SHA-384", probability: "very high" });
    if (len === 128) types.push({ name: "SHA-512", probability: "very high" });
    if (len === 32) types.push({ name: "MD4", probability: "medium" });
    if (len === 32) types.push({ name: "NTLM", probability: "medium" });
    if (len === 40) types.push({ name: "RIPEMD-160", probability: "medium" });
    if (len === 64) types.push({ name: "Blake2b-256", probability: "medium" });
  }

  if (clean.startsWith("$2a$") || clean.startsWith("$2b$") || clean.startsWith("$2y$")) {
    types.push({ name: "bcrypt", probability: "very high" });
  }

  if (clean.startsWith("$1$")) types.push({ name: "MD5-crypt", probability: "very high" });
  if (clean.startsWith("$5$")) types.push({ name: "SHA-256-crypt", probability: "very high" });
  if (clean.startsWith("$6$")) types.push({ name: "SHA-512-crypt", probability: "very high" });
  if (clean.startsWith("$apr1$")) types.push({ name: "APR1-MD5", probability: "very high" });

  if (clean.startsWith("sha1:")) types.push({ name: "Django SHA1", probability: "very high" });
  if (clean.startsWith("pbkdf2_sha256$")) types.push({ name: "Django PBKDF2", probability: "very high" });

  if (isBase64 && len >= 24 && len <= 48) {
    types.push({ name: "Base64-encoded hash", probability: "low" });
  }

  if (types.length === 0) {
    types.push({ name: "Unknown/Custom hash", probability: "low" });
  }

  return types;
}

router.post("/crypto/decode", async (req, res) => {
  const result = DecodeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "validation_error", message: result.error.message });
    return;
  }

  const { input, methods } = result.data;
  const methodsToTry = methods && methods.length > 0
    ? methods
    : ["base64", "rot13", "hex", "morse", "binary", "url", "reverse"];

  const results: Array<{ method: string; output: string; success: boolean; confidence: string }> = [];

  for (const method of methodsToTry) {
    let r: { output: string; success: boolean };
    switch (method) {
      case "base64": r = tryBase64(input); break;
      case "rot13": r = tryRot13(input); break;
      case "hex": r = tryHexToAscii(input); break;
      case "morse": r = tryMorse(input); break;
      case "binary": r = tryBinary(input); break;
      case "url": r = tryUrlDecode(input); break;
      case "reverse": r = tryReverse(input); break;
      default: continue;
    }

    if (r.output) {
      results.push({
        method,
        output: r.output,
        success: r.success,
        confidence: r.success ? "high" : "low",
      });
    }
  }

  const suggestions = results.some((r) => r.success)
    ? []
    : [
        "Try Vigenere cipher with common keys",
        "Check for Caesar cipher variants (not just ROT13)",
        "Analyze frequency distribution for substitution ciphers",
        "Try Atbash cipher (reverse alphabet substitution)",
        "Check for Rail Fence / columnar transposition",
        "Try XOR with common single-byte keys",
        "Look for Bacon's cipher in binary-like text",
        "Analyze for Playfair cipher patterns",
      ];

  res.json({ input, results, suggestions });
});

router.post("/crypto/identify-hash", async (req, res) => {
  const result = HashSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "validation_error", message: result.error.message });
    return;
  }

  const { input } = result.data;
  const clean = input.trim();
  const possibleTypes = identifyHashType(clean);
  const isLikelyHash =
    possibleTypes.some((t) => t.probability !== "Unknown/Custom hash") ||
    (/^[0-9a-fA-F]+$/.test(clean) && clean.length >= 32);

  res.json({
    input: clean,
    length: clean.length,
    possibleTypes,
    isLikelyHash,
  });
});

export default router;
