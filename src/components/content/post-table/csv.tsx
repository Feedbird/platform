"use client";

import Papa from "papaparse";
import { Post } from "@/lib/store";

export function exportPostsToCSV(posts: Post[], filename = "all-posts.csv") {
  const rows = posts.map((p) => ({ id: p.id, postData: JSON.stringify(p) }));
  const csv = Papa.unparse(rows, { quotes: true, header: true });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importPostsFromCSV(file: File): Promise<Post[]> {
  const text = await file.text();
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        if (results.errors?.length) {
          reject(results.errors[0]);
          return;
        }
        const posts: Post[] = [];
        for (const row of results.data) {
          if (!row.postData) continue;
          const parsed = JSON.parse(row.postData) as Post;
          posts.push(parsed);
        }
        resolve(posts);
      },
      error: reject,
    });
  });
}


