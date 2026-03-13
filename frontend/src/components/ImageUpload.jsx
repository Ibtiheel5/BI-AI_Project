// ImageUpload.jsx — Zone de dépôt et prévisualisation d'image
import { useState, useRef, useCallback } from "react";

export default function ImageUpload({ onUpload, loading }) {
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];
  const MAX_MB = 10;

  const handleFile = useCallback((file) => {
    setError(null);
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Format non supporté — utilisez JPEG ou PNG");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${MAX_MB} Mo)`);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onUpload(file);
  }, [onUpload]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="upload-wrapper">
      {!preview ? (
        <div
          className={`dropzone${dragOver ? " dropzone--active" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          aria-label="Zone de dépôt d'image"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={(e) => handleFile(e.target.files[0])}
            style={{ display: "none" }}
            aria-hidden="true"
          />

          <div className="dropzone-icon" aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect x="3" y="3" width="38" height="38" rx="6"
                stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 3"/>
              <path d="M22 14v16M14 22l8-8 8 8"
                stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 34h20"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </div>

          <p className="dropzone-label">
            {dragOver ? "Relâchez pour importer" : "Glissez une radiographie ou cliquez"}
          </p>
          <p className="dropzone-hint">JPEG · PNG · max 10 Mo</p>

          {error && (
            <div className="alert alert--error" style={{ marginTop: "1rem" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 4v3.5M7 9v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="preview-container">
          <div className="preview-image-wrap">
            {loading && (
              <div className="preview-overlay">
                <div className="spinner" />
                <span>Analyse en cours…</span>
              </div>
            )}
            <img src={preview} alt="Radiographie importée" className="preview-image" />
          </div>
          <button
            className="btn btn--ghost btn--sm"
            onClick={reset}
            disabled={loading}
          >
            ↩ Changer d'image
          </button>
        </div>
      )}
    </div>
  );
}