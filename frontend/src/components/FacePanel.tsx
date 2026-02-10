import { useState, useRef, useEffect } from "react";
import { useFaces } from "../hooks/useFaces";
import { enrollFaceFromCamera, uploadFacePhoto, deleteFace, fetchGpuInfo } from "../api";
import type { EnrollResult } from "../api";

interface Props {
  running: boolean;
}

export default function FacePanel({ running }: Props) {
  const { faces, refresh } = useFaces();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [hasGpu, setHasGpu] = useState(false);
  const [gpuPrompt, setGpuPrompt] = useState<{
    remaining: File[];
    enrolled: number;
    errors: number;
    resolve: (cont: boolean) => void;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGpuInfo().then((r) => setHasGpu(r.has_gpu)).catch(() => {});
  }, []);

  const flash = (text: string, ok: boolean) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCapture = async () => {
    if (!name.trim()) return;
    setBusy("Capturing face...");
    try {
      const res = await enrollFaceFromCamera(name.trim());
      if (res.status === "ok") {
        flash(`Enrolled "${res.name}" (${res.sample_count} samples)`, true);
        refresh();
      } else {
        flash(res.message || "Enrollment failed", false);
      }
    } catch {
      flash("Network error", false);
    }
    setBusy(null);
  };

  const handleUpload = async (files: FileList) => {
    if (!name.trim() || files.length === 0) return;
    const fileArr = Array.from(files);
    const total = fileArr.length;
    const usingGpu = hasGpu;

    setBusy(usingGpu ? "Processing photos (GPU)..." : "Processing photos...");
    setProgress({ done: 0, total });

    let enrolled = 0;
    let errors = 0;
    let cpuOnly = !usingGpu;

    for (let i = 0; i < total; i++) {
      let res: EnrollResult;
      try {
        res = await uploadFacePhoto(name.trim(), fileArr[i], cpuOnly);
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

      // GPU failed mid-batch — pause and ask user
      if (res.gpu_failed && !cpuOnly && i < total - 1) {
        const remaining = fileArr.slice(i + 1);
        setBusy(null);
        const shouldContinue = await new Promise<boolean>((resolve) => {
          setGpuPrompt({ remaining, enrolled, errors, resolve });
        });
        setGpuPrompt(null);

        if (!shouldContinue) {
          // User chose to stop
          setProgress(null);
          if (enrolled > 0) {
            flash(`Enrolled ${enrolled} photo${enrolled !== 1 ? "s" : ""} (stopped early)`, true);
            refresh();
          } else {
            flash("Upload cancelled", false);
          }
          return;
        }

        // Continue with CPU only
        cpuOnly = true;
        setBusy("Processing photos (CPU)...");
      }

      setProgress({ done: i + 1, total });
    }

    setProgress(null);
    setBusy(null);
    if (enrolled > 0) {
      flash(`Enrolled ${enrolled} photo${enrolled !== 1 ? "s" : ""}${errors ? ` (${errors} failed)` : ""}`, true);
      refresh();
    } else {
      flash(`No faces detected in ${total} photo${total !== 1 ? "s" : ""}`, false);
    }
  };

  const handleDelete = async (personName: string) => {
    await deleteFace(personName);
    refresh();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Face Recognition
        {hasGpu && <span className="ml-2 text-xs text-green-400 normal-case font-normal">GPU</span>}
      </h3>

      {/* Name input */}
      <input
        type="text"
        placeholder="Person name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={!!busy || !!gpuPrompt}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
      />

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCapture}
          disabled={!!busy || !!gpuPrompt || !name.trim() || !running}
          className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium py-1.5 rounded transition-colors"
        >
          Capture Face
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={!!busy || !!gpuPrompt || !name.trim()}
          className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500 text-gray-300 text-sm font-medium py-1.5 rounded transition-colors"
        >
          Upload Photos
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) handleUpload(files);
            e.target.value = "";
          }}
        />
      </div>

      {/* GPU failure prompt */}
      {gpuPrompt && (
        <div className="space-y-2 px-3 py-2.5 rounded bg-yellow-900/50 border border-yellow-700/50">
          <p className="text-sm text-yellow-300">
            GPU failed mid-processing. {gpuPrompt.remaining.length} photo{gpuPrompt.remaining.length !== 1 ? "s" : ""} remaining.
          </p>
          <p className="text-xs text-yellow-400/80">Continue with CPU? (slower but reliable)</p>
          <div className="flex gap-2">
            <button
              onClick={() => gpuPrompt.resolve(true)}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium py-1 rounded transition-colors"
            >
              Continue (CPU)
            </button>
            <button
              onClick={() => gpuPrompt.resolve(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-1 rounded transition-colors"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {busy && (
        <div className="space-y-1.5 px-3 py-2 rounded bg-cyan-900/40">
          <div className="flex justify-between text-sm text-cyan-300">
            <span>{busy}</span>
            {progress && <span className="font-mono">{progress.done}/{progress.total}</span>}
          </div>
          {progress && (
            <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Feedback message */}
      {!busy && !gpuPrompt && message && (
        <div className={`text-sm px-3 py-1.5 rounded ${message.ok ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
          {message.text}
        </div>
      )}

      {/* Enrolled people list */}
      {faces.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {faces.map((f) => (
            <div key={f.name} className="flex items-center justify-between bg-gray-800 rounded px-3 py-1.5">
              <div>
                <span className="text-sm text-gray-200">{f.name}</span>
                <span className="text-xs text-gray-500 ml-2">{f.sample_count} sample{f.sample_count !== 1 ? "s" : ""}</span>
              </div>
              <button
                onClick={() => handleDelete(f.name)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
