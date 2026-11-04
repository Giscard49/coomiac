import { useCallback, useEffect, useMemo, useState } from "react";
import { createProduct, fetchProducts, removeProduct, updateProduct, uploadImage, type ProductInput } from "../lib/data";
import { productCategories, type Product } from "../lib/models";
import { translateText } from "../lib/translate";
import { AppButton } from "../components/ui";
import { errorMessage } from "./utils";
import { useAdminI18n } from "./i18n";

type Draft = ProductInput & { id: string | null };

const emptyDraft: Draft = {
  id: null,
  title_en: "",
  title_fr: "",
  description_en: "",
  description_fr: "",
  spec_en: "",
  spec_fr: "",
  category: "",
  imageUrl: "",
};

type Note = { kind: "ok" | "error" | "warning"; text: string };

export default function ProductsAdmin() {
  const { lang, t } = useAdminI18n();
  const [items, setItems] = useState<Product[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<Note | null>(null);

  const load = useCallback(async () => {
    const list = await fetchProducts();
    setItems(list);
  }, []);

  useEffect(() => {
    load().catch((error) => setNote({ kind: "error", text: errorMessage(error, lang) }));
  }, [load]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const categories = useMemo(() => {
    const values = new Set((items ?? []).map((item) => item.category).filter(Boolean));
    return Array.from(values);
  }, [items]);

  const startNew = () => {
    setDraft({ ...emptyDraft });
    setFile(null);
    setNote(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (product: Product) => {
    setDraft({
      id: product.id,
      title_en: product.title_en,
      title_fr: product.title_fr,
      description_en: product.description_en,
      description_fr: product.description_fr,
      spec_en: product.spec_en,
      spec_fr: product.spec_fr,
      category: product.category,
      imageUrl: product.imageUrl,
    });
    setFile(null);
    setNote(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const update = (field: keyof ProductInput, value: string) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const translateField = async (field: "title_fr" | "description_fr") => {
    if (!draft) return;
    const source = field === "title_fr" ? draft.title_en : draft.description_en;
    if (!source.trim()) {
      setNote({ kind: "error", text: t.products.errEnglishFirst });
      return;
    }
    setBusy(t.products.busyTranslating);
    setNote(null);
    try {
      const result = await translateText(source, "fr");
      setDraft((current) => (current ? { ...current, [field]: result.translated } : current));
      setNote({ kind: "ok", text: result.cached ? t.products.cachedFrench : t.products.translatedReview });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error, lang) });
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title_en.trim()) {
      setNote({ kind: "error", text: t.products.errEnglishTitle });
      return;
    }

    setBusy(t.products.busySaving);
    setNote(null);
    let warning = "";

    try {
      let imageUrl = draft.imageUrl.trim();
      if (file) {
        setBusy(t.products.busyUploading);
        imageUrl = await uploadImage("products", file);
      }

      const next = { ...draft };
      if (!next.title_fr.trim()) {
        setBusy(t.products.busyTranslatingTitle);
        try {
          next.title_fr = (await translateText(next.title_en, "fr")).translated;
        } catch (error) {
          warning = t.products.savedWithoutTitle(errorMessage(error, lang));
        }
      }
      if (!next.description_fr.trim() && next.description_en.trim()) {
        setBusy(t.products.busyTranslatingDescription);
        try {
          next.description_fr = (await translateText(next.description_en, "fr")).translated;
        } catch (error) {
          warning = t.products.savedWithoutDescription(errorMessage(error, lang));
        }
      }

      setBusy(t.products.busySaving);
      const payload: ProductInput = {
        title_en: next.title_en.trim(),
        title_fr: next.title_fr.trim(),
        description_en: next.description_en.trim(),
        description_fr: next.description_fr.trim(),
        spec_en: next.spec_en.trim(),
        spec_fr: next.spec_fr.trim(),
        category: next.category.trim() || "Critical minerals",
        imageUrl,
      };

      if (draft.id) await updateProduct(draft.id, payload);
      else await createProduct(payload);

      await load();
      setDraft(null);
      setFile(null);
      setNote(
        warning
          ? { kind: "warning", text: warning }
          : { kind: "ok", text: draft.id ? t.products.savedUpdated : t.products.savedPublished },
      );
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error, lang) });
    } finally {
      setBusy("");
    }
  };

  const remove = async (product: Product) => {
    if (!window.confirm(t.products.deleteConfirm(product.title_en))) return;
    setBusy(t.products.busyDeleting);
    setNote(null);
    try {
      await removeProduct(product.id);
      await load();
      if (draft?.id === product.id) setDraft(null);
      setNote({ kind: "ok", text: t.products.deleted });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error, lang) });
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      {note && (
        <p className={note.kind === "ok" ? "notice-ok" : note.kind === "warning" ? "notice-warn" : "notice-error"}>{note.text}</p>
      )}

      {draft && (
        <section className="admin-panel">
          <div className="panel-head">
            <div>
              <h2>{draft.id ? t.products.editTitle : t.products.newTitle}</h2>
              <p>{t.products.autoTranslateHint}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDraft(null); setFile(null); }} disabled={Boolean(busy)}>
              {t.common.close}
            </button>
          </div>

          <div className="form">
            <div className="form-grid">
              <label>{t.products.titleEn}
                <input value={draft.title_en} onChange={(event) => update("title_en", event.target.value)} placeholder="Coltan" />
              </label>
              <label>{t.products.titleFr}
                <div className="field-with-action">
                  <input value={draft.title_fr} onChange={(event) => update("title_fr", event.target.value)} placeholder={t.products.titleFrPlaceholder} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => void translateField("title_fr")} disabled={Boolean(busy)}>
                    {t.common.translate}
                  </button>
                </div>
              </label>
              <label>{t.products.specEn}
                <input value={draft.spec_en} onChange={(event) => update("spec_en", event.target.value)} placeholder="Ta₂O₅ concentrate · assay per lot" />
              </label>
              <label>{t.products.specFr}
                <input value={draft.spec_fr} onChange={(event) => update("spec_fr", event.target.value)} placeholder="Concentré de Ta₂O₅ · analyse par lot" />
              </label>
              <label className="span-2">{t.products.descriptionEn}
                <textarea rows={4} value={draft.description_en} onChange={(event) => update("description_en", event.target.value)} placeholder={t.products.descriptionEnPlaceholder} />
              </label>
              <label className="span-2">{t.products.descriptionFr}
                <div className="field-with-action field-with-action-top">
                  <textarea rows={4} value={draft.description_fr} onChange={(event) => update("description_fr", event.target.value)} placeholder={t.products.descriptionFrPlaceholder} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => void translateField("description_fr")} disabled={Boolean(busy)}>
                    {t.common.translate}
                  </button>
                </div>
              </label>
              <label>{t.products.category}
                <input value={draft.category} onChange={(event) => update("category", event.target.value)} placeholder="Critical minerals, Base metals, Precious metals" list="product-categories" />
                <datalist id="product-categories">
                  {Array.from(new Set([...productCategories, ...categories])).map((category) => <option value={category} key={category} />)}
                </datalist>
                <small className="field-hint">{t.products.categoryHint}</small>
              </label>
              <label>{t.products.image}
                <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                <small className="field-hint">{t.products.imageHint}</small>
              </label>
              <label className="span-2">{t.products.imageUrl}
                <input value={draft.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} placeholder={t.products.imageUrlPlaceholder} />
              </label>
            </div>

            {(preview || draft.imageUrl) && (
              <div className="image-preview">
                <img src={preview || draft.imageUrl} alt={t.products.previewAlt} />
                <small>{preview ? t.products.newImage : t.products.currentImage}</small>
              </div>
            )}

            <div className="admin-actions">
              <AppButton onClick={() => void save()} disabled={Boolean(busy)}>{busy || (draft.id ? t.products.saveChanges : t.products.publish)}</AppButton>
              <button className="btn btn-ghost btn-sm" onClick={() => { setDraft(null); setFile(null); }} disabled={Boolean(busy)}>{t.common.cancel}</button>
            </div>
          </div>
        </section>
      )}

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>{t.products.title}</h2>
            <p>{items ? t.products.count(items.length) : t.products.loading}</p>
          </div>
          <AppButton onClick={startNew} disabled={Boolean(busy)}>{t.products.add}</AppButton>
        </div>

        {items === null ? (
          <p className="muted">{t.products.loading}</p>
        ) : items.length === 0 ? (
          <p className="muted">{t.products.empty}</p>
        ) : (
          <div className="admin-list">
            {items.map((product) => (
              <div className="admin-row admin-product-row" key={product.id}>
                {product.imageUrl ? (
                  <img className="thumb" src={product.imageUrl} alt="" loading="lazy" />
                ) : (
                  <div className="thumb thumb-empty">CP</div>
                )}
                <div className="admin-row-main">
                  <b>{product.title_en || t.products.untitled}</b>
                  <small>{product.category || t.products.noCategory} · {product.title_fr || t.products.noFrenchTitle}</small>
                </div>
                <div className="admin-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(product)} disabled={Boolean(busy)}>{t.common.edit}</button>
                  <button className="link-danger" onClick={() => void remove(product)} disabled={Boolean(busy)}>{t.common.delete}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
