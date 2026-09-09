import Icon from "@/components/Icon";

/** Shown instead of a 500 when a product's service account is not in place yet. */
export function NotConnected({ product, env, file, error }) {
  return (
    <>
      <div className="pagehead"><h1>{product}</h1><span className="sub">Not connected yet</span></div>
      <div className="panel">
        <p className="sub" style={{ margin: 0 }}>
          This dashboard is wired up and waiting on credentials. To bring it online, either set{" "}
          <code>{env}</code> in the Vercel project (base64 of the service account JSON), or drop{" "}
          <code>{file}</code> in the repo root for local use.
        </p>
        <p className="sub" style={{ marginTop: 12, marginBottom: 0, opacity: 0.6 }}>
          <Icon name="link" size={12} /> {error}
        </p>
      </div>
    </>
  );
}
