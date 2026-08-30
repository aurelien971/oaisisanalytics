// One number per product for the hub. Cheap reads only — counts, not scans —
// because this page loads before you've decided which product you care about.
import { db } from "./firebase";

const count = async (product, collection) => {
  try {
    const snap = await db(product).collection(collection).count().get();
    return snap.data().count;
  } catch {
    return null;
  }
};

const fmt = (v) => (v === null ? "—" : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v));

export async function headline() {
  const [opaque, labs, oaisis, faike] = await Promise.all([
    count("opaque", "users"),
    count("oaisislabs", "posts"),
    count("oaisis", "transcriptions"),
    count("faike", "users"),
  ]);
  return {
    opaque: { value: fmt(opaque), label: "users" },
    oaisislabs: { value: fmt(labs), label: "posts" },
    oaisis: { value: fmt(oaisis), label: "transcriptions" },
    faike: { value: fmt(faike), label: "users" },
  };
}
