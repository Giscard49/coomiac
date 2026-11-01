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
import { translateText } from "../lib/translate";
import { AppButton } from "../components/ui";
import { errorMessage } from "./utils";

type CaptionDraft = { en: string; fr: string };
type Note = { kind: "ok" | "error"; text: string };

export default function GalleryAdmin() {
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
    load().catch((error) => setNote({ kind: "error", text: errorMessage(error) }));
  }, [load]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setBusy(`Uploading ${list.length} image${list.length === 1 ? "" : "s"}…`);
    setNote(null);
    try {
      let order = items && items.length > 0 ? Math.max(...items.map((item) => item.order)) + 1 : 0;
      for (const file of list) {
        const imageUrl = await uploadImage("gallery", file);
        await createGalleryItem({ imageUrl, caption_en: "", caption_fr: "", order });
        order += 1;
      }
      await load();
      setNote({ kind: "ok", text: `${list.length} image${list.length === 1 ? "" : "s"} added. Add captions and drag to reorder.` });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error) });
    } finally {
      setBusy("");
    }
  };

  const saveCaption = async (item: GalleryItem) => {
    const draft = captions[item.id];
    if (!draft) return;
    setBusy("Saving caption…");
    setNote(null);
    try {
      await updateGalleryItem(item.id, { caption_en: draft.en.trim(), caption_fr: draft.fr.trim() });
      await load();
      setNote({ kind: "ok", text: "Caption saved." });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error) });
    } finally {
      setBusy("");
    }
  };

  const translateCaption = async (item: GalleryItem) => {
    const draft = captions[item.id];
    if (!draft?.en.trim()) {
      setNote({ kind: "error", text: "Write the English caption first, then translate." });
      return;
    }
    setBusy("Translating…");
    setNote(null);
    try {
      const result = await translateText(draft.en, "fr");
      setCaptions((current) => ({ ...current, [item.id]: { ...current[item.id], fr: result.translated } }));
      setNote({ kind: "ok", text: result.cached ? "French caption loaded from the translation cache. Review it, then save." : "French caption translated. Review it, then save." });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error) });
    } finally {
      setBusy("");
    }
  };

  const remove = async (item: GalleryItem) => {
    if (!window.confirm("Delete this photo from the gallery? This cannot be undone.")) return;
    setBusy("Deleting…");
    setNote(null);
    try {
      await removeGalleryItem(item.id);
      await load();
      setNote({ kind: "ok", text: "Photo deleted." });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error) });
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
      setNote({ kind: "ok", text: "Gallery order saved." });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error) });
      await load();
    }
  };

  return (
    <>
      {note && <p className={note.kind === "ok" ? "notice-ok" : "notice-error"}>{note.text}</p>}

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>Photo gallery</h2>
            <p>Upload multiple photos, edit bilingual captions, and drag the handle to reorder.</p>
          </div>
          <label className={`btn btn-gold btn-sm upload-button${busy ? " is-busy" : ""}`}>
            {busy.startsWith("Uploading") ? busy : "Upload photos"}
            <input type="file" accept="image/*" multiple onChange={(event) => { void uploadFiles(event.target.files); event.target.value = ""; }} disabled={Boolean(busy)} />
          </label>
        </div>

        {items === null ? (
          <p className="muted">Loading gallery…</p>
        ) : items.length === 0 ? (
          <p className="muted">No photos yet. Upload your first images to build the public gallery.</p>
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
                      title="Drag to reorder"
                      role="button"
                      tabIndex={0}
                    >
                      ⠿ <small>{index + 1}</small>
                    </span>
                    <button className="link-danger" onClick={() => void remove(item)} disabled={Boolean(busy)}>Delete</button>
                  </div>
                  <img src={item.imageUrl} alt={draft.en || "Gallery photo"} loading="lazy" />
                  <label>Caption (EN)
                    <input
                      value={draft.en}
                      onChange={(event) => setCaptions((current) => ({ ...current, [item.id]: { ...draft, en: event.target.value } }))}
                      placeholder="Gold doré prepared for export"
                    />
                  </label>
                  <label>Caption (FR)
                    <textarea
                      rows={2}
                      value={draft.fr}
                      onChange={(event) => setCaptions((current) => ({ ...current, [item.id]: { ...draft, fr: event.target.value } }))}
                      placeholder="Légende en français"
                    />
                  </label>
                  <div className="admin-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => void saveCaption(item)} disabled={Boolean(busy)}>Save caption</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => void translateCaption(item)} disabled={Boolean(busy)}>Translate</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {items && items.length > 0 && (
        <div className="admin-actions admin-footer-actions">
          <AppButton kind="outline" onClick={() => void load()} disabled={Boolean(busy)}>Refresh gallery</AppButton>
        </div>
      )}
    </>
  );
}
