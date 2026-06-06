import { personaFixtures, type ExtractedDocument, type PersonaId } from "@notarity-lens/shared";
import { canonicalizeFilename } from "@notarity-lens/notarity";

export function fixtureDocuments(persona: PersonaId = "joshua") {
  return personaFixtures[persona].documents;
}

export function uploadedDocuments(files: File[]): ExtractedDocument[] {
  return files.map((file, index) => ({
    id: `upload-${Date.now()}-${index}`,
    filename: file.name,
    canonicalName: canonicalizeFilename(file.name),
    mimeType: file.type || "application/pdf",
    size: file.size,
    textByPage: [],
    extractionStatus: "pending",
  }));
}
