import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT = 52;
const TOP = 790;
const LINE_HEIGHT = 15;
const MAX_CHARS = 88;

function usage() {
  console.error("Usage: node scripts/write-fixture-pdf.mjs <spec.json> [output-root]");
  process.exit(1);
}

function escapePdfText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, "")
    .replace(/\n/g, " ");
}

function wrapLine(line) {
  const words = String(line).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length <= MAX_CHARS) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function normalizePages(spec) {
  if (!Array.isArray(spec.pages) || spec.pages.length === 0) {
    throw new Error("Spec must include a non-empty pages array");
  }

  return spec.pages.map((page) => {
    const sourceLines = Array.isArray(page) ? page : page.lines;
    if (!Array.isArray(sourceLines)) {
      throw new Error("Each page must be an array of lines or an object with lines");
    }

    return sourceLines.flatMap((line) => {
      if (line === "") return [""];
      return wrapLine(line);
    });
  });
}

function pageStream(lines) {
  const text = lines
    .slice(0, 48)
    .map((line) => `(${escapePdfText(line)}) Tj T*`)
    .join("\n");

  return [
    "BT",
    "/F1 11 Tf",
    `${LEFT} ${TOP} Td`,
    `${LINE_HEIGHT} TL`,
    text,
    "ET",
  ].join("\n");
}

function buildPdf(spec) {
  const pages = normalizePages(spec);
  const objects = new Map();
  const catalogId = 1;
  const pagesId = 2;
  const fontId = 3;
  const pageRefs = pages.map((_, index) => ({
    pageId: 4 + index * 2,
    contentId: 5 + index * 2,
  }));

  objects.set(
    catalogId,
    `<< /Type /Catalog /Pages ${pagesId} 0 R >>`,
  );
  objects.set(
    pagesId,
    `<< /Type /Pages /Kids [${pageRefs
      .map((ref) => `${ref.pageId} 0 R`)
      .join(" ")}] /Count ${pages.length} >>`,
  );
  objects.set(fontId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((lines, index) => {
    const { pageId, contentId } = pageRefs[index];
    const stream = pageStream(lines);
    objects.set(
      pageId,
      [
        "<<",
        "/Type /Page",
        `/Parent ${pagesId} 0 R`,
        `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
        `/Resources << /Font << /F1 ${fontId} 0 R >> >>`,
        `/Contents ${contentId} 0 R`,
        ">>",
      ].join(" "),
    );
    objects.set(
      contentId,
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
    );
  });

  const maxObjectId = Math.max(...objects.keys());
  let output = "%PDF-1.4\n";
  const offsets = [0];

  for (let id = 1; id <= maxObjectId; id += 1) {
    const body = objects.get(id);
    if (!body) throw new Error(`Missing PDF object ${id}`);
    offsets[id] = Buffer.byteLength(output, "utf8");
    output += `${id} 0 obj\n${body}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(output, "utf8");
  output += `xref\n0 ${maxObjectId + 1}\n`;
  output += "0000000000 65535 f \n";
  for (let id = 1; id <= maxObjectId; id += 1) {
    output += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }

  output += [
    "trailer",
    `<< /Size ${maxObjectId + 1} /Root ${catalogId} 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
    "",
  ].join("\n");

  return output;
}

const [specArg, outputRootArg] = process.argv.slice(2);
if (!specArg) usage();

const specPath = path.resolve(specArg);
const spec = JSON.parse(await readFile(specPath, "utf8"));
if (!spec.output) throw new Error("Spec must include an output path");

const outputRoot = outputRootArg
  ? path.resolve(outputRootArg)
  : path.dirname(specPath);
const outputPath = path.resolve(outputRoot, spec.output);
const pdf = buildPdf(spec);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, pdf, "utf8");
console.log(outputPath);
