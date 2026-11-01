import { useCallback, useEffect, useState } from "react";
import { fetchGallery, fetchInquiries, fetchProducts, fetchSettings, saveSettings } from "../lib/data";
import { defaultSettings, type Inquiry, type SiteSettings } from "../lib/models";
import { AppButton } from "../components/ui";
import { errorMessage, formatDate } from "./utils";

const inquiryLabels: Record<string, string> = {
  general: "General partnership",
  quote: "Product quote",
  compliance: "Compliance & documents",
};

export default function OverviewAdmin() {
  const [counts, setCounts] = useState<{ products: number; gallery: number; inquiries: number } | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [products, gallery, inbox, siteSettings] = await Promise.all([
        fetchProducts(),
        fetchGallery(),
        fetchInquiries(),
        fetchSettings(),
      ]);
      setCounts({ products: products.length, gallery: gallery.length, inquiries: inbox.length });
      setInquiries(inbox);
      setSettings(siteSettings);
      setNote(null);
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setNote(null);
    try {
      await saveSettings(settings);
      setNote({ kind: "ok", text: "Contact details updated. The public website now uses them." });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof SiteSettings, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const cards = [
    { label: "Products", value: counts?.products ?? 0, hint: "Published on the products page" },
    { label: "Gallery photos", value: counts?.gallery ?? 0, hint: "Visible in the public gallery" },
    { label: "Inquiries", value: counts?.inquiries ?? 0, hint: "Received through the contact form" },
  ];

  return (
    <>
      <div className="admin-stats">
        {cards.map((card) => (
          <article key={card.label}>
            <span>{card.label}</span>
            <strong>{loading && !counts ? "…" : card.value}</strong>
            <small>{card.hint}</small>
          </article>
        ))}
      </div>

      {note && <p className={note.kind === "ok" ? "notice-ok" : "notice-error"}>{note.text}</p>}

      {note?.kind === "error" && (
        <section className="admin-panel admin-help setup-checklist">
          <h3>Firebase setup checklist</h3>
          <ul>
            <li><b>Firestore Database</b> is created for the <code>coomiac</code> project.</li>
            <li>The latest <code>firestore.rules</code> is published.</li>
            <li><b>Storage</b> is started and <code>storage.rules</code> is published.</li>
            <li>Your signed-in account has an <code>admins/&#123;uid&#125;</code> document.</li>
          </ul>
          <p>After changing anything in Firebase Console, refresh this page or sign out and back in.</p>
        </section>
      )}

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>Contact details</h2>
            <p>These values power the contact page, the footer and the WhatsApp button.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <div className="form">
          <div className="form-grid">
            <label>Email
              <input type="email" value={settings.email} onChange={(event) => update("email", event.target.value)} placeholder="contact@coomiac-projet.cd" />
            </label>
            <label>Phone
              <input value={settings.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+250 796 145 610" />
            </label>
            <label>WhatsApp number
              <input value={settings.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} placeholder="250796145610" />
              <small className="field-hint">Digits only, including the country code (no + or spaces).</small>
            </label>
            <label>Address (EN)
              <input value={settings.address_en} onChange={(event) => update("address_en", event.target.value)} placeholder="Walikale, North Kivu, DR Congo" />
            </label>
            <label>Address (FR)
              <input value={settings.address_fr} onChange={(event) => update("address_fr", event.target.value)} placeholder="Walikale, Nord-Kivu, RD Congo" />
            </label>
          </div>
          <AppButton onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save contact details"}</AppButton>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>Recent inquiries</h2>
            <p>The latest messages submitted through the public contact form.</p>
          </div>
        </div>
        {loading && !counts ? (
          <p className="muted">Loading inquiries…</p>
        ) : inquiries.length === 0 ? (
          <p className="muted">No inquiries yet. New messages will appear here.</p>
        ) : (
          <div className="inquiry-list">
            {inquiries.slice(0, 8).map((inquiry) => (
              <article className="inquiry-item" key={inquiry.id}>
                <div className="inquiry-head">
                  <b>{inquiry.fullName}</b>
                  <span className="inquiry-type">{inquiryLabels[inquiry.inquiryType] ?? inquiry.inquiryType}</span>
                  <small>{formatDate(inquiry.createdAt)}</small>
                </div>
                <small>{inquiry.company} · <a href={`mailto:${inquiry.businessEmail}`}>{inquiry.businessEmail}</a></small>
                <p>{inquiry.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
