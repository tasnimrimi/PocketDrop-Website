// src/limits.mjs
var PRO_MAX_FILE = 10 * 1024 * 1024 * 1024;
var PRO_SESSION_MS = 24 * 60 * 60 * 1e3;

// src/crypto.mjs
var utf8 = (text2) => new TextEncoder().encode(text2);
var text = (bytes) => new TextDecoder("utf-8", { fatal: true }).decode(bytes);
function b64(bytes) {
  if (typeof Uint8Array.prototype.toBase64 === "function") return new Uint8Array(bytes).toBase64({ alphabet: "base64url", omitPadding: true });
  let value = "";
  const a = new Uint8Array(bytes);
  for (let i = 0; i < a.length; i += 8192) value += String.fromCharCode(...a.subarray(i, i + 8192));
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function unb64(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]*$/.test(value)) throw new Error("Invalid encoding");
  if (typeof Uint8Array.fromBase64 === "function") return Uint8Array.fromBase64(value, { alphabet: "base64url" });
  const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
var encode = (value) => utf8(JSON.stringify(value));
var decode = (bytes) => JSON.parse(text(bytes));
function parsePairing(value) {
  if (typeof value !== "string" || value.length > 3e3) throw new Error("Invalid pairing link");
  let fragment2 = value.trim();
  if (fragment2.includes("#")) fragment2 = fragment2.slice(fragment2.indexOf("#") + 1);
  const pairing = decode(unb64(fragment2));
  if (pairing.pro !== void 0 && pairing.pro !== true) throw new Error("Invalid pairing mode.");
  if (pairing.network !== void 0 && (pairing.network !== "direct" || pairing.pro !== true)) throw new Error("Invalid direct pairing.");
  if (pairing.v !== 1 || !/^pd-[A-Za-z0-9_-]{32}$/.test(pairing.id) || !/^[A-Za-z0-9_-]{43}$/.test(pairing.secret) || !Number.isSafeInteger(pairing.expires) || pairing.expires <= Date.now() || pairing.expires > Date.now() + (pairing.pro === true ? PRO_SESSION_MS + 1e5 : 37e5)) throw new Error("Pairing expired or invalid. Scan a new QR code.");
  return pairing;
}

// src/config.mjs
var PHONE_PAGE = "https://tasnimrimi.github.io/PocketDrop-Website/phone/?v=0.10.18";
var PRO_PHONE_PAGE = "https://tasnimrimi.github.io/PocketDrop-Website/phone/?v=0.10.18";

// src/pc-pairing.mjs
function parsePCPairing(value) {
  let pairing;
  try {
    pairing = parsePairing(value);
  } catch {
    throw new Error("PC link is invalid or expired. Ask the other PC to create a new link.");
  }
  if (pairing.device !== "pc") throw new Error("Use a PC-to-PC link, not a phone QR link.");
  if (pairing.network !== void 0 && (pairing.network !== "direct" || pairing.pro !== true)) throw new Error("Invalid direct connection code.");
  return pairing;
}
function pcPairingLink(pairing) {
  return new URL("pc.html", pairing.pro ? PRO_PHONE_PAGE : PHONE_PAGE).href + "#" + b64(encode(pairing));
}

// src/pc-link.mjs
var input = document.getElementById("private-link");
var button = document.getElementById("copy-link");
var status = document.getElementById("link-status");
var fragment = location.hash;
history.replaceState(null, "", location.pathname);
try {
  const pairing = parsePCPairing(fragment);
  input.value = pcPairingLink(pairing);
  status.textContent = "Ready. Paste this link into the PocketDrop extension.";
  setTimeout(() => {
    input.value = "";
    button.disabled = true;
    status.textContent = "Link expired. Create a new link on the other PC.";
  }, pairing.expires - Date.now());
} catch (error) {
  button.disabled = true;
  status.textContent = error.message;
}
button.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(input.value);
    status.textContent = "Copied. Open PocketDrop \u2192 PC to PC \u2192 paste the link.";
  } catch {
    input.focus();
    input.select();
    status.textContent = "Press Ctrl+C to copy this link.";
  }
});
