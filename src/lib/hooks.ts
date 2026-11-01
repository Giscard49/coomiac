import { useEffect, useState } from "react";
import { fetchGallery, fetchProducts, fetchSettings } from "./data";
import { demoGallery, demoProducts, defaultSettings, type GalleryItem, type Product, type SiteSettings } from "./models";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/** Products from Firestore; demo catalogue is used until real products exist. */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetchProducts()
      .then((list) => {
        if (!alive) return;
        if (list.length > 0) setProducts(list);
        setError("");
      })
      .catch((err) => {
        if (alive) setError(errorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { products, loading, error };
}

export function useGallery() {
  const [gallery, setGallery] = useState<GalleryItem[]>(demoGallery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetchGallery()
      .then((list) => {
        if (!alive) return;
        setGallery(list);
        setError("");
      })
      .catch((err) => {
        if (alive) setError(errorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { gallery, loading, error };
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    let alive = true;
    fetchSettings()
      .then((value) => {
        if (alive) setSettings(value);
      })
      .catch(() => {
        /* keep defaults if settings cannot be read */
      });
    return () => {
      alive = false;
    };
  }, []);

  return settings;
}
