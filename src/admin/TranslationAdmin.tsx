import { useEffect, useState } from "react";
import { countTranslationCache } from "../lib/data";
import { testTranslationService } from "../lib/translate";
import { AppButton } from "../components/ui";
import { errorMessage } from "./utils";

type Status = "idle" | "testing" | "connected" | "error";

export default function TranslationAdmin() {
  const [status, setStatus] = useState<Status>("idle");
  const [detail, setDetail] = useState("");
  const [latency, setLatency] = useState<number | null>(null);
  const [cacheCount, setCacheCount] = useState<number | null>(null);

  const refreshCache = async () => {
    try {
      setCacheCount(await countTranslationCache());
    } catch {
      setCacheCount(null);
    }
  };

  useEffect(() => {
    void refreshCache();
  }, []);

  const test = async () => {
    setStatus("testing");
    setDetail("");
    setLatency(null);
    try {
      const result = await testTranslationService();
      setStatus("connected");
      setLatency(result.latency);
      setDetail(result.sample);
      await refreshCache();
    } catch (error) {
      setStatus("error");
      setDetail(errorMessage(error));
    }
  };

  const badge =
    status === "connected" ? "Connected" : status === "testing" ? "Testing…" : status === "error" ? "Not connected" : "Not tested";

  return (
    <>
      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>English → French translation</h2>
            <p>The translation service is called through the secure server endpoint. The OpenAI key never reaches the browser.</p>
          </div>
          <span className={`status-badge ${status === "connected" ? "ok" : status === "error" ? "bad" : ""}`}>{badge}</span>
        </div>

        <div className="translation-status">
          <div>
            <h3>Connection</h3>
            <p>
              {status === "connected"
                ? `Connected to /api/translate in ${latency ?? "…"} ms.`
                : status === "error"
                  ? detail
                  : "Test the endpoint to confirm the server key and network path are working."}
            </p>
            {status === "connected" && detail && <p className="translation-sample">“{detail}”</p>}
            {status === "error" && (
              <div className="admin-help">
                <p>Check the following:</p>
                <ul>
                  <li><code>OPENAI_API_KEY</code> is set in the server environment (not prefixed with <code>VITE_</code>).</li>
                  <li><code>FIREBASE_PROJECT_ID</code> is set on the server so admin sessions can be verified.</li>
                  <li>Your account has an <code>/admins/&#123;uid&#125;</code> document and the Firestore rules are published.</li>
                  <li><code>/api/translate</code> is reachable — on Vercel, deploy the <code>api</code> folder.</li>
                </ul>
              </div>
            )}
          </div>
          <AppButton onClick={() => void test()} disabled={status === "testing"}>
            {status === "testing" ? "Testing…" : "Retry connection"}
          </AppButton>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h3>How automatic translation works</h3>
            <p>Manual French edits are always preserved.</p>
          </div>
          <span className="status-badge">{cacheCount === null ? "—" : `${cacheCount} cached`}</span>
        </div>
        <ol className="translation-policy">
          <li>
            <b>On save, only empty French fields are translated.</b> If you wrote a French title or description, it is saved exactly as written.
          </li>
          <li>
            <b>Explicit requests overwrite the French field.</b> Use the Translate button next to a French field to translate the current English text again.
          </li>
          <li>
            <b>Results are cached in Firestore.</b> Repeated title, description and caption translations are served from the <code>translations</code> collection instead of calling the API again.
          </li>
          <li>
            <b>Review before publishing.</b> Automatic translation is a first draft — gold trade terminology should be checked by a French speaker.
          </li>
        </ol>
      </section>

      <section className="admin-panel admin-help">
        <h3>Server configuration</h3>
        <p>Set these variables in your hosting provider (Vercel → Project → Settings → Environment Variables) and in <code>.env</code> (or <code>.env.local</code>) for local development:</p>
        <ul>
          <li><code>OPENAI_API_KEY</code> — server only. Never prefix it with <code>VITE_</code>.</li>
          <li><code>OPENAI_TRANSLATION_MODEL</code> — optional, defaults to <code>gpt-4o-mini</code>.</li>
          <li><code>FIREBASE_PROJECT_ID</code> — used to verify the signed-in admin before translating.</li>
        </ul>
        <p>The client sends a Firebase ID token. The endpoint rejects requests without a valid admin token, so the key cannot be used by anonymous visitors.</p>
      </section>
    </>
  );
}
