import { useCallback, useEffect, useState } from "react";
import {
  createGalleryItem,
  fetchGallery,
  removeGalleryItem,
  saveGalleryOrder,
  updateGalleryItem,
  uploadImage,
} from "../lib/data";
import type { GalleryItem } from "../lib/models";
import { photoCredits } from "../assets/photoCredits";
import { translateText } from "../lib/translate";
import { AppButton } from "../components/ui";
import { errorMessage } from "./utils";
import { useAdminI18n } from "./i18n";

type CaptionDraft = { en: string; fr: string };
type Note = { kind: "ok" | "error"; text: string };

export default function GalleryAdmin() {
  const { lang, t } = useAdminI18n();
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [captions, setCaptions] = useState<Record<string, CaptionDraft>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<Note | null>(null);

  const load = useCallback(async () => {
    const list = await fetchGallery();
    setItems(list);
    setCaptions(
      Object.fromEntries(list.map((item) => [item.id, { en: item.caption_en, fr: item.caption_fr }])),
    );
  }, []);

  useEffect(() => {
    load().catch((error) => setNote({ kind: "error", text: errorMessage(error, lang) }));
  }, [load]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setBusy(t.gallery.busyUploading(list.length));
    setNote(null);
    try {
      let order = items && items.length > 0 ? Math.max(...items.map((item) => item.order)) + 1 : 0;
      for (const file of list) {
        const imageUrl = await uploadImage("gallery", file);
        await createGalleryItem({ imageUrl, caption_en: "", caption_fr: "", order });
        order += 1;
      }
      await load();
      setNote({ kind: "ok", text: t.gallery.uploaded(list.length) });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error, lang) });
    } finally {
      setBusy("");
    }
  };

  const saveCaption = async (item: GalleryItem) => {
    const draft = captions[item.id];
    if (!draft) return;
    setBusy(t.gallery.busySavingCaption);
    setNote(null);
    try {
      await updateGalleryItem(item.id, { caption_en: draft.en.trim(), caption_fr: draft.fr.trim() });
      await load();
      setNote({ kind: "ok", text: t.gallery.savedCaption });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error, lang) });
    } finally {
      setBusy("");
    }
  };

  const translateCaption = async (item: GalleryItem) => {
    const draft = captions[item.id];
    if (!draft?.en.trim()) {
      setNote({ kind: "error", text: t.gallery.errEnglishFirst });
      return;
    }
    setBusy(t.gallery.busyTranslating);
    setNote(null);
    try {
      const result = await translateText(draft.en, "fr");
      setCaptions((current) => ({ ...current, [item.id]: { ...current[item.id], fr: result.translated } }));
      setNote({ kind: "ok", text: result.cached ? t.gallery.cachedFrench : t.gallery.translatedReview });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error, lang) });
    } finally {
      setBusy("");
    }
  };

  const remove = async (item: GalleryItem) => {
    if (!window.confirm(t.gallery.confirmDelete)) return;
    setBusy(t.gallery.busyDeleting);
    setNote(null);
    try {
      await removeGalleryItem(item.id);
      await load();
      setNote({ kind: "ok", text: t.gallery.deleted });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error, lang) });
    } finally {
      setBusy("");
    }
  };

  const dropOn = async (targetId: string) => {
    if (!items || !dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const from = items.findIndex((item) => item.id === dragId);
    const to = items.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const reordered = next.map((item, index) => ({ ...item, order: index }));
    setItems(reordered);
    setDragId(null);

    try {
      await saveGalleryOrder(reordered);
      setNote({ kind: "ok", text: t.gallery.orderSaved });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error, lang) });
      await load();
    }
  };

  return (
    <>
      {note && <p className={note.kind === "ok" ? "notice-ok" : "notice-error"}>{note.text}</p>}

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>{t.gallery.title}</h2>
            <p>{t.gallery.description}</p>
          </div>
          <label className={`btn btn-gold btn-sm upload-button${busy ? " is-busy" : ""}`}>
            {t.gallery.upload}
            <input type="file" accept="image/*" multiple onChange={(event) => { void uploadFiles(event.target.files); event.target.value = ""; }} disabled={Boolean(busy)} />
          </label>
        </div>

        {items === null ? (
          <p className="muted">{t.gallery.loading}</p>
        ) : items.length === 0 ? (
          <p className="muted">{t.gallery.empty}</p>
        ) : (
          <div className="gallery-admin-grid">
            {items.map((item, index) => {
              const draft = captions[item.id] ?? { en: item.caption_en, fr: item.caption_fr };
              return (
                <div
                  className={`form gallery-tile${dragId === item.id ? " is-dragging" : ""}`}
                  key={item.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => void dropOn(item.id)}
                >
                  <div className="gallery-tile-head">
                    <span
                      className="drag-handle"
                      draggable
                      onDragStart={() => setDragId(item.id)}
                      onDragEnd={() => setDragId(null)}
                      title={t.gallery.dragToReorder}
                      role="button"
                      tabIndex={0}
                    >
                      ⠿ <small>{index + 1}</small>
                    </span>
                    <button className="link-danger" onClick={() => void remove(item)} disabled={Boolean(busy)}>{t.common.delete}</button>
                  </div>
                  <img src={item.imageUrl} alt={draft.en || t.gallery.title} loading="lazy" />
                  <label>{t.gallery.captionEn}
                    <input
                      value={draft.en}
                      onChange={(event) => setCaptions((current) => ({ ...current, [item.id]: { ...draft, en: event.target.value } }))}
                      placeholder={t.gallery.captionEnPlaceholder}
                    />
                  </label>
                  <label>{t.gallery.captionFr}
                    <textarea
                      rows={2}
                      value={draft.fr}
                      onChange={(event) => setCaptions((current) => ({ ...current, [item.id]: { ...draft, fr: event.target.value } }))}
                      placeholder={t.gallery.captionFrPlaceholder}
                    />
                  </label>
                  <div className="admin-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => void saveCaption(item)} disabled={Boolean(busy)}>{t.gallery.saveCaption}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => void translateCaption(item)} disabled={Boolean(busy)}>{t.common.translate}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="admin-panel">
        <details className="photo-credits" open>
          <summary>{t.gallery.builtInTitle}</summary>
          <p>{t.gallery.builtInBody}</p>
          <div className="photo-credits-grid">
            {photoCredits.map((credit) => {
              const content = (
                <>
                  <img src={credit.thumb} alt="" loading="lazy" width="240" height="180" />
                  <span>
                    <b>{lang === "fr" ? credit.title_fr : credit.title_en}</b>
                    <small>{credit.author} · {credit.license}</small>
                    <em>{credit.file}</em>
                  </span>
                </>
              );
              return credit.sourceUrl ? (
                <a key={credit.id} href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">{content}</a>
              ) : (
                <div className="photo-credit" key={credit.id}>{content}</div>
              );
            })}
          </div>
        </details>
      </section>

      {items && items.length > 0 && (
        <div className="admin-actions admin-footer-actions">
          <AppButton kind="outline" onClick={() => void load()} disabled={Boolean(busy)}>{t.gallery.refresh}</AppButton>
        </div>
      )}
    </>
  );
}
