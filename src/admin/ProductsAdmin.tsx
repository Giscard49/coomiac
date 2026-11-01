import { useCallback, useEffect, useMemo, useState } from "react";
import { createProduct, fetchProducts, removeProduct, updateProduct, uploadImage, type ProductInput } from "../lib/data";
import type { Product } from "../lib/models";
import { translateText } from "../lib/translate";
import { AppButton } from "../components/ui";
import { errorMessage } from "./utils";

type Draft = ProductInput & { id: string | null };

const emptyDraft: Draft = {
  id: null,
  title_en: "",
  title_fr: "",
  description_en: "",
  description_fr: "",
  category: "",
  imageUrl: "",
};

type Note = { kind: "ok" | "error" | "warning"; text: string };

export default function ProductsAdmin() {
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
    load().catch((error) => setNote({ kind: "error", text: errorMessage(error) }));
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
      setNote({ kind: "error", text: "Add the English text first, then translate." });
      return;
    }
    setBusy("Translating…");
    setNote(null);
    try {
      const result = await translateText(source, "fr");
      setDraft((current) => (current ? { ...current, [field]: result.translated } : current));
      setNote({ kind: "ok", text: result.cached ? "Loaded the French text from the translation cache." : "French text translated. Review it before saving." });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error) });
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title_en.trim()) {
      setNote({ kind: "error", text: "An English product title is required." });
      return;
    }

    setBusy("Saving…");
    setNote(null);
    let warning = "";

    try {
      let imageUrl = draft.imageUrl.trim();
      if (file) {
        setBusy("Uploading image…");
        imageUrl = await uploadImage("products", file);
      }

      const next = { ...draft };
      if (!next.title_fr.trim()) {
        setBusy("Translating title…");
        try {
          next.title_fr = (await translateText(next.title_en, "fr")).translated;
        } catch (error) {
          warning = `Saved without the French title (${errorMessage(error)}).`;
        }
      }
      if (!next.description_fr.trim() && next.description_en.trim()) {
        setBusy("Translating description…");
        try {
          next.description_fr = (await translateText(next.description_en, "fr")).translated;
        } catch (error) {
          warning = `Saved without the French description (${errorMessage(error)}).`;
        }
      }

      setBusy("Saving…");
      const payload: ProductInput = {
        title_en: next.title_en.trim(),
        title_fr: next.title_fr.trim(),
        description_en: next.description_en.trim(),
        description_fr: next.description_fr.trim(),
        category: next.category.trim() || "Gold",
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
          : { kind: "ok", text: draft.id ? "Product updated. The public site now shows the new content." : "Product published. It is now live on the public site." },
      );
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error) });
    } finally {
      setBusy("");
    }
  };

  const remove = async (product: Product) => {
    if (!window.confirm(`Delete “${product.title_en}”? This cannot be undone.`)) return;
    setBusy("Deleting…");
    setNote(null);
    try {
      await removeProduct(product.id);
      await load();
      if (draft?.id === product.id) setDraft(null);
      setNote({ kind: "ok", text: "Product deleted." });
    } catch (error) {
      setNote({ kind: "error", text: errorMessage(error) });
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
              <h2>{draft.id ? "Edit product" : "New product"}</h2>
              <p>French fields left empty are translated from English automatically when you save.</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDraft(null); setFile(null); }} disabled={Boolean(busy)}>
              Close
            </button>
          </div>

          <div className="form">
            <div className="form-grid">
              <label>Title (English) *
                <input value={draft.title_en} onChange={(event) => update("title_en", event.target.value)} placeholder="Gold Doré" />
              </label>
              <label>Title (French)
                <div className="field-with-action">
                  <input value={draft.title_fr} onChange={(event) => update("title_fr", event.target.value)} placeholder="Or doré (auto)" />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => void translateField("title_fr")} disabled={Boolean(busy)}>
                    Translate
                  </button>
                </div>
              </label>
              <label className="span-2">Description (English)
                <textarea rows={4} value={draft.description_en} onChange={(event) => update("description_en", event.target.value)} placeholder="Describe the product, its preparation and the lots available." />
              </label>
              <label className="span-2">Description (French)
                <div className="field-with-action field-with-action-top">
                  <textarea rows={4} value={draft.description_fr} onChange={(event) => update("description_fr", event.target.value)} placeholder="Description en français (traduction automatique si vide)" />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => void translateField("description_fr")} disabled={Boolean(busy)}>
                    Translate
                  </button>
                </div>
              </label>
              <label>Category
                <input value={draft.category} onChange={(event) => update("category", event.target.value)} placeholder="Doré, Alluvial, Custom…" list="product-categories" />
                <datalist id="product-categories">
                  {categories.map((category) => <option value={category} key={category} />)}
                </datalist>
              </label>
              <label>Product image
                <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                <small className="field-hint">JPG, PNG or WebP, up to 6 MB. Uploaded to Firebase Storage.</small>
              </label>
              <label className="span-2">Or image URL
                <input value={draft.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} placeholder="https://…" />
              </label>
            </div>

            {(preview || draft.imageUrl) && (
              <div className="image-preview">
                <img src={preview || draft.imageUrl} alt="Product preview" />
                <small>{preview ? "New image selected" : "Current image"}</small>
              </div>
            )}

            <div className="admin-actions">
              <AppButton onClick={() => void save()} disabled={Boolean(busy)}>{busy || (draft.id ? "Save changes" : "Publish product")}</AppButton>
              <button className="btn btn-ghost btn-sm" onClick={() => { setDraft(null); setFile(null); }} disabled={Boolean(busy)}>Cancel</button>
            </div>
          </div>
        </section>
      )}

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>Products</h2>
            <p>{items ? `${items.length} product${items.length === 1 ? "" : "s"} published` : "Loading products…"}</p>
          </div>
          <AppButton onClick={startNew} disabled={Boolean(busy)}>Add product</AppButton>
        </div>

        {items === null ? (
          <p className="muted">Loading products…</p>
        ) : items.length === 0 ? (
          <p className="muted">No products yet. Add your first product or seed the demo catalogue to get started.</p>
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
                  <b>{product.title_en || "Untitled product"}</b>
                  <small>{product.category || "No category"} · {product.title_fr || "No French title"}</small>
                </div>
                <div className="admin-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(product)} disabled={Boolean(busy)}>Edit</button>
                  <button className="link-danger" onClick={() => void remove(product)} disabled={Boolean(busy)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
