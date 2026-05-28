import { site } from "@/config/site";

export type BrandLogoExport = {
  /** data:image/png;base64,... — jsPDF */
  dataUrl: string;
  /** Base64 brut — ExcelJS */
  base64: string;
};

let cached: Promise<BrandLogoExport> | null = null;

/** Charge le logo PNG une fois (exports PDF / Excel côté navigateur). */
export function loadBrandLogoForExport(): Promise<BrandLogoExport> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Logo export : exécution navigateur requise."));
  }
  if (!cached) {
    cached = fetch(site.logoSrc)
      .then((res) => {
        if (!res.ok) throw new Error("Logo introuvable.");
        return res.blob();
      })
      .then(
        (blob) =>
          new Promise<BrandLogoExport>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
              resolve({ dataUrl, base64 });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          })
      );
  }
  return cached;
}
