import { personaFixtures, type ExtractedDocument, type PersonaId } from "@notarity-lens/shared";
import { canonicalizeFilename } from "@notarity-lens/notarity";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export function fixtureDocuments(persona: PersonaId = "joshua") {
  return personaFixtures[persona].documents;
}

function textItemString(item: unknown) {
  return typeof item === "object" && item !== null && "str" in item
    ? String((item as { str: unknown }).str)
    : "";
}

async function extractPdfTextByPage(file: File): Promise<ExtractedDocument["textByPage"]> {
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({
    data,
    useWorkerFetch: false,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const pages: ExtractedDocument["textByPage"] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map(textItemString)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      pages.push({ page: pageNumber, text });
    }
  } finally {
    await loadingTask.destroy();
  }

  return pages;
}

export async function uploadedDocuments(files: File[]): Promise<ExtractedDocument[]> {
  return Promise.all(
    files.map(async (file, index) => {
      let textByPage: ExtractedDocument["textByPage"] = [];

      try {
        textByPage = await extractPdfTextByPage(file);
      } catch {
        textByPage = [];
      }

      return {
        id: `upload-${Date.now()}-${index}`,
        filename: file.name,
        canonicalName: canonicalizeFilename(file.name),
        mimeType: file.type || "application/pdf",
        size: file.size,
        textByPage,
        extractionStatus: textByPage.some((page) => page.text.length > 0)
          ? "extracted"
          : "failed",
      };
    }),
  );
}
