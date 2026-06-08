"use client";

import { useCallback } from "react";

interface TransloaditResult {
  url: string;
  name: string;
  mime: string;
}

export function useTransloaditUpload() {
  const upload = useCallback(
    async (
      file: File,
      onProgress?: (pct: number) => void
    ): Promise<TransloaditResult> => {
      const TRANSLOADIT_KEY = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!;
      const TEMPLATE_ID = process.env.NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID!;

      const formData = new FormData();
      formData.append(
        "params",
        JSON.stringify({
          auth: { key: TRANSLOADIT_KEY },
          template_id: TEMPLATE_ID,
        })
      );
      formData.append("file", file);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.error) {
              reject(new Error(data.error));
              return;
            }
            // Get the first result from any step
            const results = Object.values(data.results || {}).flat() as any[];
            if (results.length === 0) {
              reject(new Error("No results from Transloadit"));
              return;
            }
            const first = results[0];
            resolve({
              url: first.ssl_url || first.url,
              name: first.name,
              mime: first.mime,
            });
          } catch (err) {
            reject(err);
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));

        xhr.open("POST", "https://api2.transloadit.com/assemblies");
        xhr.send(formData);
      });
    },
    []
  );

  return { upload };
}
