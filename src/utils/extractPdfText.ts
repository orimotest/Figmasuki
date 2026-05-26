export type PdfExtractionResult =
  | { ok: true; fileName: string; text: string }
  | { ok: false; fileName: string; reason: string };

export async function extractPdfText(file: File): Promise<PdfExtractionResult> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, fileName: file.name, reason: "PDFファイルを選択してください。" };
  }

  const bytes = await file.arrayBuffer();
  const text = decodePdfLikeText(bytes);
  if (text.trim().length < 40) {
    return {
      ok: false,
      fileName: file.name,
      reason: "PDFからテキストを取得できませんでした。要件テキスト欄に内容を貼り付けてください。",
    };
  }

  return { ok: true, fileName: file.name, text: text.slice(0, 12000) };
}

function decodePdfLikeText(bytes: ArrayBuffer): string {
  const source = new TextDecoder("latin1").decode(bytes);
  const chunks = Array.from(source.matchAll(/\(([^()]{2,})\)/g)).map((match) => match[1]);
  return chunks
    .join(" ")
    .replace(/\\[rn]/g, " ")
    .replace(/\\([()\\])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
