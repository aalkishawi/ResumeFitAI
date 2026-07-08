"use client";

import React, { useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, UploadCloud, X } from "lucide-react";
import { ProgressBar, cx } from "./ui";

// ---------------------------------------------------------------------------
// Reusable input card for a resume or job description. Supports pasting text
// AND uploading a file (PDF/DOCX/TXT/MD). Uploaded files are extracted server
// side; the extracted text lands in the editable textarea so the user can
// preview and edit it before generating the tailored resume.
// ---------------------------------------------------------------------------

const ACCEPT = ".pdf,.docx,.txt,.md,.markdown";

interface Props {
  kind: "resume" | "jd";
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export function DocumentInput({ kind, label, placeholder, value, onChange, icon }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const uploadFile = useCallback(
    (file: File) => {
      setError(null);
      setWarnings([]);
      setUploading(true);
      setProgress(0);

      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/extract");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        setUploading(false);
        setProgress(100);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            onChange(data.text ?? "");
            setFilename(data.filename ?? file.name);
            setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
          } else {
            setError(data.error || "Upload failed.");
          }
        } catch {
          setError("Unexpected response from server.");
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setError("Network error while uploading the file.");
      };

      xhr.send(form);
    },
    [kind, onChange]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = ""; // allow re-uploading the same file
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const clearFileMeta = () => {
    setFilename(null);
    setWarnings([]);
    setError(null);
  };

  return (
    <div
      className={cx(
        "flex h-full flex-col rounded-2xl border bg-white p-4 shadow-card transition dark:bg-white/[0.04] dark:shadow-none",
        dragging
          ? "border-brand-400 ring-2 ring-brand-100 dark:ring-brand-500/30"
          : "border-slate-200 dark:border-white/10"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-brand-600 dark:text-brand-400">{icon ?? <FileText size={18} />}</span>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</h2>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
        >
          <UploadCloud size={14} /> Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {filename ? (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-1.5 text-xs text-brand-700">
          <span className="flex items-center gap-1.5 truncate">
            <CheckCircle2 size={14} /> Extracted from <strong className="truncate">{filename}</strong>
          </span>
          <button
            type="button"
            onClick={clearFileMeta}
            className="text-brand-500 hover:text-brand-700"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {uploading ? (
        <div className="mb-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Uploading & extracting…</span>
            <span>{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      ) : null}

      {error ? (
        <div className="mb-2 flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {warnings.map((w, i) => (
        <div
          key={i}
          className="mb-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700"
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{w}</span>
        </div>
      ))}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="scroll-tidy min-h-[220px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-brand-400 dark:focus:ring-brand-500/30"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>
          {filename ? "Editable — review before generating" : "Paste text or drag a file here"}
        </span>
        <span>{value.length.toLocaleString()} chars</span>
      </div>
    </div>
  );
}
