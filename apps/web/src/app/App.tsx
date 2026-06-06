import { FileUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-sm text-violet-800">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Nothing is submitted until you confirm.
        </div>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-normal text-slate-950">
          Notarity Lens
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          We will read your document, suggest the right booking route, and show
          what needs your confirmation.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button>
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Upload your document
          </Button>
          <Button variant="outline">I will upload it later</Button>
        </div>
      </section>
    </main>
  );
}
