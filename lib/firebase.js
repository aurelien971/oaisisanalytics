// Firebase Admin, one app per product project.
//
// Credentials come from an env var first (that's what a deploy has) and fall
// back to a serviceAccount.json on disk (that's what a laptop has). Keeping
// both means the same code runs in either place with no branching at the call
// site — and the key file stays gitignored.
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
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

function appFor(product) {
  const name = `product-${product}`;
  const existing = getApps().find((a) => a.name === name);
  if (existing) return existing;
  const creds = credentialsFor(product);
  return initializeApp(
    { credential: cert(creds), storageBucket: `${creds.project_id}.firebasestorage.app` },
    name,
  );
}

export function db(product = "opaque") {
  return getFirestore(appFor(product));
}

/**
 * A short-lived read URL for a file in that product's Storage bucket.
 * Scanned images are write-only to clients, so the dashboard signs its own.
 */
export async function signedUrl(product, path, minutes = 60) {
  if (!path) return null;
  try {
    const [url] = await getStorage(appFor(product))
      .bucket()
      .file(path)
      .getSignedUrl({ action: "read", expires: Date.now() + minutes * 60_000 });
    return url;
  } catch {
    return null; // missing file, or the bucket is not reachable yet
  }
}
