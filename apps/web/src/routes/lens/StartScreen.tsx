import { useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileText, FileUp, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/features/lens/components/AppShell";
import { useLensStore } from "@/features/lens/store";
import type { PersonaFixture } from "@/features/lens/types";
import { DemoError, DemoSampleRequests, formatDocumentSize } from "./shared";

export function StartScreen() {
  const navigate = useNavigate();
  const loadPersona = useLensStore((state) => state.loadPersona);
  const uploadDocuments = useLensStore((state) => state.uploadDocuments);
  const loading = useLensStore((state) => state.loading);
  const [dragActive, setDragActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAndContinue = async (persona: PersonaFixture["id"]) => {
    const loaded = await loadPersona(persona);
    if (loaded) navigate("/lens/analyze");
  };

  const stageFiles = (files: FileList | File[] | null) => {
    const selectedFiles = Array.from(files ?? []).filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    );
    if (!selectedFiles.length) return;

    setStagedFiles((currentFiles) => {
      const seen = new Set(
        currentFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
      );
      const newFiles = selectedFiles.filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return [...currentFiles, ...newFiles];
    });
  };

  const removeStagedFile = (fileToRemove: File) => {
    const keyToRemove = `${fileToRemove.name}:${fileToRemove.size}:${fileToRemove.lastModified}`;
    setStagedFiles((currentFiles) =>
      currentFiles.filter(
        (file) => `${file.name}:${file.size}:${file.lastModified}` !== keyToRemove,
      ),
    );
  };

  const uploadStagedAndContinue = () => {
    if (!stagedFiles.length) return;
    void uploadDocuments(stagedFiles);
    navigate("/lens/analyze");
  };

  const handleDragEvent = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <AppShell>
      <DemoError />
      <section className="mx-auto flex min-h-[calc(100vh-15rem)] w-full max-w-3xl flex-col justify-center py-8">
        <div className="text-center">
          <div className="lens-status-badge mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
            <ShieldCheck className="h-4 w-4 text-status-confirmed-foreground" aria-hidden="true" />
            AI prepares a draft. Nothing is submitted until you confirm.
          </div>
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
            Upload your document
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            We read the documents, find the likely booking route, and ask you to
            confirm the fields that matter.
          </p>
        </div>

        <div
          className={`lens-drop-zone lens-card-motion mt-8 rounded-2xl border border-dashed p-5 text-center shadow-[var(--shadow-card)] transition-colors sm:p-8 ${
            dragActive
              ? "lens-drop-zone-active border-primary bg-primary/5"
              : "border-primary/35 bg-card"
          }`}
          onDragEnter={(event) => {
            handleDragEvent(event);
            setDragActive(true);
          }}
          onDragOver={(event) => {
            handleDragEvent(event);
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            handleDragEvent(event);
            if (event.currentTarget === event.target) setDragActive(false);
          }}
          onDrop={(event) => {
            handleDragEvent(event);
            setDragActive(false);
            stageFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            hidden
            aria-hidden="true"
            tabIndex={-1}
            onChange={(event) => {
              const input = event.currentTarget;
              stageFiles(input.files);
              input.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="group flex min-h-64 w-full flex-col items-center justify-center rounded-xl border border-border bg-secondary/60 px-6 py-10 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-accent/20 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-60"
          >
            <span className="lens-step-dot-active flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <FileUp className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="mt-5 text-lg font-semibold text-foreground">
              {loading
                ? "Reading documents..."
                : dragActive
                  ? "Drop PDF documents"
                  : stagedFiles.length
                    ? "Add more PDFs"
                    : "Drop PDFs here or choose documents"}
            </span>
            <span className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Stage every document first. The upload starts only when you continue.
            </span>
          </button>

          {stagedFiles.length ? (
            <div className="lens-screen-enter mt-4 overflow-hidden rounded-xl border border-border bg-card text-left">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Staged documents
                </h2>
                <span className="text-xs text-muted-foreground">
                  {stagedFiles.length} file{stagedFiles.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="divide-y divide-border">
                {stagedFiles.map((file, index) => (
                  <div
                    key={`${file.name}:${file.size}:${file.lastModified}`}
                    style={{ animationDelay: `${index * 55}ms` }}
                    className="lens-receipt-line flex items-center gap-3 px-4 py-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {file.type || "application/pdf"} - {formatDocumentSize(file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeStagedFile(file)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              onClick={uploadStagedAndContinue}
              disabled={loading || !stagedFiles.length}
            >
              {stagedFiles.length
                ? `Continue with ${stagedFiles.length} file${stagedFiles.length === 1 ? "" : "s"}`
                : "Add PDFs to continue"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <DemoSampleRequests
            loading={loading}
            onSelect={(persona) => {
              void loadAndContinue(persona);
            }}
          />
        </div>
      </section>
    </AppShell>
  );
}
