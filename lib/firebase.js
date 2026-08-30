// Firebase Admin, one app per product project.
//
// Credentials come from an env var first (that's what a deploy has) and fall
// back to a serviceAccount.json on disk (that's what a laptop has). Keeping
// both means the same code runs in either place with no branching at the call
// site — and the key file stays gitignored.
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import path from "path";

const PRODUCTS = {
  opaque:     { env: "OPAQUE_SERVICE_ACCOUNT_B64",     file: "serviceAccount.json" },
  oaisislabs: { env: "OAISISLABS_SERVICE_ACCOUNT_B64", file: "serviceAccount.oaisislabs.json" },
  oaisis:     { env: "OAISIS_SERVICE_ACCOUNT_B64",     file: "serviceAccount.oaisis.json" },
  faike:      { env: "FAIKE_SERVICE_ACCOUNT_B64",      file: "serviceAccount.faike.json" },
};

function credentialsFor(product) {
  const cfg = PRODUCTS[product];
  if (!cfg) throw new Error(`Unknown product "${product}".`);

  const b64 = process.env[cfg.env];
  if (b64) return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));

  const file = process.env.SERVICE_ACCOUNT_PATH || path.join(process.cwd(), cfg.file);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error(
      `No credentials for "${product}": set ${cfg.env}, or put ${cfg.file} in the project root.`,
    );
  }
}

export function db(product = "opaque") {
  const name = `product-${product}`;
  const existing = getApps().find((a) => a.name === name);
  const app = existing ?? initializeApp({ credential: cert(credentialsFor(product)) }, name);
  return getFirestore(app);
}
