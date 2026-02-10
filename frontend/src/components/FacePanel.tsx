import { useState, useRef, useEffect, useCallback } from "react";
import { useFaces } from "../hooks/useFaces";
import { uploadFacePhoto, deleteFace, fetchGpuInfo, exportFaceDb, importFaceDb } from "../api";
import type { EnrollResult } from "../api";
import { useToast } from "./ui/useToast";
import Modal from "./ui/Modal";
import ProgressBar from "./ui/ProgressBar";
import Spinner from "./ui/Spinner";

export default function FacePanel() {
  const { faces, refresh } = useFaces();
  const toast = useToast();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [hasGpu, setHasGpu] = useState(false);
  const [gpuInfo, setGpuInfo] = useState<{ pytorch_cuda: boolean; dlib_cuda: boolean } | null>(null);
  const [gpuHintDismissed, setGpuHintDismissed] = useState(() => sessionStorage.getItem("gpu-hint-dismissed") === "1");
  const [gpuPrompt, setGpuPrompt] = useState<{
    remaining: File[];
    enrolled: number;
    errors: number;
    resolve: (cont: boolean) => void;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGpuInfo().then((r) => {
      setHasGpu(r.has_gpu);
      setGpuInfo({ pytorch_cuda: r.pytorch_cuda, dlib_cuda: r.dlib_cuda });
    }).catch(() => {});
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    if (!name.trim() || files.length === 0) return;

    const valid: File[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        toast.warning(`${f.name} is not an image file`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.warning(`${f.name} exceeds 10MB limit`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;

    const total = valid.length;
    const usingGpu = hasGpu;
    setBusy(usingGpu ? "Processing (GPU)..." : "Processing...");
    setProgress({ done: 0, total });

    let enrolled = 0;
    let errors = 0;
    let cpuOnly = !usingGpu;

    for (let i = 0; i < total; i++) {
      let res: EnrollResult;
      try {
        res = await uploadFacePhoto(name.trim(), valid[i], cpuOnly);
      } catch {
        errors++;
        setProgress({ done: i + 1, total });
        continue;
      }

      if (res.status === "ok") {
        enrolled++;
      } else {
        errors++;
      }

      if (res.gpu_failed && !cpuOnly && i < total - 1) {
        const remaining = valid.slice(i + 1);
        setBusy(null);
        const shouldContinue = await new Promise<boolean>((resolve) => {
          setGpuPrompt({ remaining, enrolled, errors, resolve });
        });
        setGpuPrompt(null);

        if (!shouldContinue) {
          setProgress(null);
          if (enrolled > 0) {
            toast.success(`Enrolled ${enrolled} photo${enrolled !== 1 ? "s" : ""} (stopped early)`);
            refresh();
          } else {
            toast.warning("Upload cancelled");
          }
          return;
        }

        cpuOnly = true;
        setBusy("Processing (CPU)...");
      }

      setProgress({ done: i + 1, total });
    }

    setProgress(null);
    setBusy(null);
    if (enrolled > 0) {
      toast.success(`Enrolled ${enrolled} photo${enrolled !== 1 ? "s" : ""}${errors ? ` (${errors} failed)` : ""}`);
      refresh();
    } else {
      toast.error(`No faces detected in ${total} photo${total !== 1 ? "s" : ""}`);
    }
  }, [name, hasGpu, toast, refresh]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [processFiles]);

  const handleDelete = async (personName: string) => {
    try {
      await deleteFace(personName);
      toast.success(`Removed ${personName}`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
    setDeleteTarget(null);
  };

  const handleExport = async () => {
    try {
      await exportFaceDb();
      toast.success("Face database exported");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importFaceDb(file, true);
      if (result.status === "ok") {
        toast.success(`Imported ${result.imported_names?.length ?? 0} person(s)`);
        refresh();
      } else {
        toast.error(result.message ?? "Import failed");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    }
  };

  return (
    <div className="space-y-2.5">
      {/* GPU badge + export/import buttons */}
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full ${hasGpu ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10"}`}
          title={gpuInfo ? `Detection (PyTorch): ${gpuInfo.pytorch_cuda ? "GPU" : "CPU"}\nFace Recognition (dlib): ${gpuInfo.dlib_cuda ? "GPU" : "CPU"}` : ""}
        >
          {hasGpu ? "GPU" : "CPU"}
        </span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={handleExport}
            disabled={faces.length === 0}
            title="Export face database"
            className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-accent hover:border-gray-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
            </svg>
          </button>
          <button
            onClick={() => importRef.current?.click()}
            title="Import face database"
            className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-accent hover:border-gray-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 6l-4-4m0 0L8 6m4-4v13" />
            </svg>
          </button>
        </div>
      </div>

      {/* GPU hint */}
      {gpuInfo && !gpuInfo.pytorch_cuda && !gpuHintDismissed && (
        <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-yellow-900/30 border border-yellow-700/30">
          <svg className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-yellow-300/90 leading-relaxed">
              Running on CPU. Install <a href="https://pytorch.org/get-started/locally/" target="_blank" rel="noopener noreferrer" className="text-accent underline">PyTorch with CUDA</a> for faster detection.
            </p>
          </div>
          <button
            onClick={() => { setGpuHintDismissed(true); sessionStorage.setItem("gpu-hint-dismissed", "1"); }}
            className="text-yellow-400/50 hover:text-yellow-300 transition-colors shrink-0 mt-0.5"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <input
        ref={importRef}
        type="file"
        accept=".pkl"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImport(f);
          e.target.value = "";
        }}
      />

      {/* Name input + drop zone row */}
      <input
        type="text"
        placeholder="Person name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={!!busy || !!gpuPrompt}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-accent/50 transition-colors"
      />

      {/* Compact drag & drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !busy && name.trim() && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg py-3 px-4 text-center cursor-pointer transition-all
          ${busy || !name.trim() ? "opacity-50 pointer-events-none" : ""}
          ${dragOver ? "border-accent bg-accent/5" : "border-gray-700 hover:border-gray-600"}`}
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5" />
          </svg>
          <span className="text-xs text-gray-400">
            Drop photos or <span className="text-accent">browse</span>
          </span>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) processFiles(Array.from(files));
          e.target.value = "";
        }}
      />

      {/* GPU failure prompt */}
      {gpuPrompt && (
        <div className="space-y-2 px-3 py-2 rounded-lg bg-yellow-900/50 border border-yellow-700/50">
          <p className="text-xs text-yellow-300">
            GPU failed. {gpuPrompt.remaining.length} photo{gpuPrompt.remaining.length !== 1 ? "s" : ""} left. Continue with CPU?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => gpuPrompt.resolve(true)}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-400 text-gray-950 text-xs font-medium py-1 rounded-lg"
            >
              Continue (CPU)
            </button>
            <button
              onClick={() => gpuPrompt.resolve(false)}
              className="flex-1 bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium py-1 rounded-lg hover:border-gray-600"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {busy && (
        <div className="space-y-1.5 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-2 text-xs text-accent">
            <Spinner size="sm" />
            <span>{busy}</span>
            {progress && <span className="ml-auto font-mono">{progress.done}/{progress.total}</span>}
          </div>
          {progress && <ProgressBar value={(progress.done / progress.total) * 100} />}
        </div>
      )}

      {/* Enrolled people list */}
      {faces.length > 0 && (
        <div className="space-y-1 max-h-36 overflow-y-auto">
          {faces.map((f) => (
            <div key={f.name} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-2.5 py-1.5">
              <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <span className="text-accent text-xs font-semibold">
                  {f.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-200 block truncate">{f.name}</span>
              </div>
              <span className="text-[10px] text-gray-500 shrink-0">{f.sample_count}</span>
              <button
                onClick={() => setDeleteTarget(f.name)}
                className="text-gray-600 hover:text-red-400 transition-colors p-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Delete "{deleteTarget}"?</h3>
              <p className="text-sm text-gray-400">
                All enrolled samples will be removed.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
