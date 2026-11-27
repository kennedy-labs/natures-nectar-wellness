export const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024; // 10 MB raw upload guard

export const ACCEPTED_IMAGE_TYPES =
  ".jpg,.jpeg,.jfif,.png,.webp,.gif,.avif,.svg,.bmp,.ico,image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,image/bmp,image/x-icon";

export function estimateDataUrlKb(dataUrl: string): number {
  const base64Index = dataUrl.indexOf(",");
  if (base64Index === -1) return 0;
  const base64Length = dataUrl.length - base64Index - 1;
  return Math.max(1, Math.round((base64Length * 3) / 4 / 1024));
}

export function optimizeAdminImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      reject(
        new Error(
          `${file.name} is larger than 10 MB. Please choose a smaller image.`
        )
      );
      return;
    }

    const mime = file.type.toLowerCase();
    const isHeic =
      mime === "image/heic" ||
      mime === "image/heif" ||
      /\.(heic|heif)$/i.test(file.name);

    if (isHeic) {
      reject(
        new Error(
          `${file.name}: iPhone HEIC/HEIF photos cannot be decoded directly in most browsers. Export as JPG or PNG first.`
        )
      );
      return;
    }

    const looksLikeImage =
      mime.startsWith("image/") ||
      /\.(jpe?g|jfif|png|webp|gif|avif|svg|bmp|ico)$/i.test(file.name);

    if (!looksLikeImage) {
      reject(
        new Error(
          `${file.name}: Unsupported file type. Choose JPG, PNG, WebP, GIF, AVIF, or SVG.`
        )
      );
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error(`Could not read ${file.name}.`));
    };

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        reject(new Error(`${file.name} was empty.`));
        return;
      }

      // Preserve compact vector SVGs and animated GIFs directly without rasterizing
      if (
        (mime === "image/svg+xml" || mime === "image/gif") &&
        result.startsWith("data:image/") &&
        result.length <= 500_000
      ) {
        resolve(result);
        return;
      }

      const img = new window.Image();
      img.onerror = () => {
        reject(
          new Error(
            `${file.name}: Browser could not decode this image. Export as JPG, PNG, or WebP.`
          )
        );
      };

      img.onload = () => {
        const maxSide = 720;
        const largestDim = Math.max(img.width, img.height);
        const scale = largestDim > maxSide ? maxSide / largestDim : 1;
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(
            new Error("Image processing is unavailable in this browser.")
          );
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const preserveTransparency =
          mime === "image/png" ||
          mime === "image/webp" ||
          mime === "image/avif" ||
          mime === "image/svg+xml";

        let encoded = canvas.toDataURL(
          preserveTransparency ? "image/webp" : "image/jpeg",
          0.78
        );

        // Keep payloads lean (~<= 120 KB) so saving to PostgreSQL stays fast
        if (encoded.length > 160_000) {
          encoded = canvas.toDataURL("image/jpeg", 0.68);
        }

        if (encoded.length > 220_000) {
          const compactScale = 540 / Math.max(width, height);
          if (compactScale < 1) {
            const compactCanvas = document.createElement("canvas");
            compactCanvas.width = Math.max(1, Math.round(width * compactScale));
            compactCanvas.height = Math.max(
              1,
              Math.round(height * compactScale)
            );
            const compactCtx = compactCanvas.getContext("2d");
            if (compactCtx) {
              compactCtx.imageSmoothingEnabled = true;
              compactCtx.imageSmoothingQuality = "high";
              compactCtx.drawImage(
                canvas,
                0,
                0,
                compactCanvas.width,
                compactCanvas.height
              );
              encoded = compactCanvas.toDataURL("image/jpeg", 0.68);
            }
          }
        }

        resolve(encoded);
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}
