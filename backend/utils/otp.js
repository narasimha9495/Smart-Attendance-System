const crypto = require("crypto");

// Rotating in-room code (TOTP-style). The teacher's screen shows this code,
// it changes every STEP seconds, and only a phone physically in the room can
// read the current one. Built on HMAC-SHA1 over a time counter, like Google
// Authenticator.
const STEP = 5; // seconds each code is valid
const DIGITS = 6;

function codeForCounter(secret, counter) {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const code = bin % 10 ** DIGITS;
  return String(code).padStart(DIGITS, "0");
}

// Current code the teacher should be displaying.
function currentCode(secret) {
  const counter = Math.floor(Date.now() / 1000 / STEP);
  return codeForCounter(secret, counter);
}

// Verify a code the student submitted. Accept the current and previous window
// to allow for a few seconds of clock/network drift.
function verifyCode(secret, submitted) {
  const counter = Math.floor(Date.now() / 1000 / STEP);
  for (const c of [counter, counter - 1]) {
    if (codeForCounter(secret, c) === String(submitted)) return true;
  }
  return false;
}

function newSecret() {
  return crypto.randomBytes(20).toString("hex");
}

// Short, unambiguous link code (no confusing chars like 0/O, 1/I).
function newShortCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

module.exports = { currentCode, verifyCode, newSecret, newShortCode, STEP };
