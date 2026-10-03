const zlib = require('zlib');

const TOKEN_PREFIX = 'KTN1';

const toUrlSafe = b64 => b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromUrlSafe = s => {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return b64;
};

function encodeToken(name, code) {
  const json = JSON.stringify({ n: name, c: code, v: 1 });
  const packed = zlib.gzipSync(Buffer.from(json, 'utf8'));
  return TOKEN_PREFIX + toUrlSafe(packed.toString('base64'));
}

function decodeToken(raw) {
  const match = String(raw).match(/KTN1[A-Za-z0-9_-]+/);
  if (!match) throw new Error("that doesn't look like an import token");

  const bytes = Buffer.from(fromUrlSafe(match[0].slice(TOKEN_PREFIX.length)), 'base64');

  let plain;
  try {
    plain = zlib.gunzipSync(bytes).toString('utf8');
  } catch {
    plain = bytes.toString('utf8'); // fallback
  }

  let data;
  try {
    data = JSON.parse(plain);
  } catch {
    throw new Error("the token decoded but wasn't valid Katton script data");
  }
  if (typeof data.c !== 'string' || typeof data.n !== 'string') {
    throw new Error('the token decoded but is missing a script name or code');
  }
  return data;
}

module.exports = { encodeToken, decodeToken };
