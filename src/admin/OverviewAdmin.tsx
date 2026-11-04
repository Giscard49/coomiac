import { useCallback, useEffect, useState } from "react";
import { fetchGallery, fetchInquiries, fetchProducts, fetchSettings, saveSettings } from "../lib/data";
import { defaultSettings, type Inquiry, type SiteSettings } from "../lib/models";
import { AppButton } from "../components/ui";
import { errorMessage, formatDate } from "./utils";
import { useAdminI18n } from "./i18n";

export default function OverviewAdmin({ navigate }: { navigate: (to: string) => void }) {
  const { lang, t } = useAdminI18n();
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
      setNote({ kind: "error", text: errorMessage(error, lang) });
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setNote(null);
    try {
      await saveSettings(settings);
      setNote({ kind: "ok", text: t.overview.contactUpdated });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error, lang) });
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof SiteSettings, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const cards = [
    { label: t.overview.stats.products, value: counts?.products ?? 0, hint: t.overview.stats.productsHint },
    { label: t.overview.stats.gallery, value: counts?.gallery ?? 0, hint: t.overview.stats.galleryHint },
    { label: t.overview.stats.messages, value: counts?.inquiries ?? 0, hint: t.overview.stats.messagesHint },
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
          <h3>{t.overview.checklistTitle}</h3>
          <ul>
            <li>
              <b>{t.access.firestoreDatabase}</b> {t.overview.checklistDbPrefix}{" "}
              <code>coomiac</code>.
            </li>
            <li>
              {t.overview.checklistRulesPrefix} <code>firestore.rules</code>{" "}
              {t.overview.checklistRulesSuffix}
            </li>
            <li>
              <b>{t.overview.checklistStoragePrefix}</b>{" "}
              {t.overview.checklistStorageSuffix}{" "}
              <code>{t.overview.checklistStorageRules}</code>{" "}
              {t.overview.checklistStorageRulesSuffix}
            </li>
            <li>
              {t.overview.checklistAdminPrefix} <code>admins/&#123;uid&#125;</code>
              {t.overview.checklistAdminSuffix}
            </li>
          </ul>
          <p>{t.overview.checklistAfter}</p>
        </section>
      )}

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>{t.overview.contact.title}</h2>
            <p>{t.overview.contact.description}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
            {loading ? t.common.refreshing : t.common.refresh}
          </button>
        </div>
        <div className="form">
          <div className="form-grid">
            <label>{t.overview.contact.email}
              <input type="email" value={settings.email} onChange={(event) => update("email", event.target.value)} placeholder="coomiaec@gmail.com" />
            </label>
            <label>{t.overview.contact.phone}
              <input value={settings.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+243 813 236 392" />
            </label>
            <label>{t.overview.contact.whatsapp}
              <input value={settings.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} placeholder="243813236392" />
              <small className="field-hint">{t.overview.contact.whatsappHint}</small>
            </label>
            <label>{t.overview.contact.addressEn}
              <input value={settings.address_en} onChange={(event) => update("address_en", event.target.value)} placeholder="Walikale, North Kivu, DR Congo" />
            </label>
            <label>{t.overview.contact.addressFr}
              <input value={settings.address_fr} onChange={(event) => update("address_fr", event.target.value)} placeholder="Walikale, Nord-Kivu, RD Congo" />
            </label>
          </div>
          <AppButton onClick={() => void save()} disabled={saving}>{saving ? t.common.saving : t.overview.contact.save}</AppButton>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>{t.overview.latest.title}</h2>
            <p>{t.overview.latest.description}</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate("/admin/messages")}>
            {t.common.openMessages}
          </button>
        </div>
        {loading && !counts ? (
          <p className="muted">{t.overview.latest.loading}</p>
        ) : inquiries.length === 0 ? (
          <p className="muted">{t.overview.latest.empty}</p>
        ) : (
          <div className="inquiry-list">
            {inquiries.slice(0, 6).map((inquiry) => (
              <article className="inquiry-item" key={inquiry.id}>
                <div className="inquiry-head">
                  <b>{inquiry.fullName}</b>
                  <span className="inquiry-type">
                    {t.overview.inquiryTypes[inquiry.inquiryType] ?? inquiry.inquiryType}
                  </span>
                  <span className={`status-badge ${inquiry.status === "replied" ? "ok" : ""}`}>
                    {inquiry.status === "replied" ? t.common.statusReplied : t.common.statusNew}
                  </span>
                  <small>{formatDate(inquiry.createdAt, lang)}</small>
                </div>
                <small>{inquiry.company} · <a href={`mailto:${inquiry.businessEmail}`}>{inquiry.businessEmail}</a></small>
                <p>{inquiry.message}</p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate(`/admin/messages?inquiry=${inquiry.id}`)}
                >
                  {inquiry.status === "replied" ? t.common.viewConversation : t.common.reply}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
