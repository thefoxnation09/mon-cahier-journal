import { useRef, useState } from 'react';
import { Eye, FileText, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { TAILLE_MAX_PDF, formatFileSize } from '../lib/files';

interface Props {
  nomFichier?: string;
  onUpload: (file: File) => Promise<{ ok: boolean; error?: string }>;
  onRemove: () => Promise<void>;
  onView: () => Promise<string | null>;
}

export function PdfDropZone({ nomFichier, onUpload, onRemove, onView }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (file.size > TAILLE_MAX_PDF) {
      setError(`Fichier trop volumineux (max ${formatFileSize(TAILLE_MAX_PDF)}).`);
      return;
    }
    setError(null);
    setBusy(true);
    const result = await onUpload(file);
    setBusy(false);
    if (!result.ok) setError(result.error ?? "Échec de l'envoi.");
  }

  async function handleView() {
    setBusy(true);
    const url = await onView();
    setBusy(false);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else setError('Impossible de récupérer le fichier.');
  }

  async function handleRemove() {
    setBusy(true);
    await onRemove();
    setBusy(false);
  }

  if (nomFichier) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5">
        <FileText size={15} className="text-brand-600 shrink-0" />
        <span className="flex-1 min-w-0 truncate text-xs font-medium text-ink-900" title={nomFichier}>
          {nomFichier}
        </span>
        <button
          onClick={handleView}
          disabled={busy}
          className="no-print p-1 text-brand-600 hover:text-brand-700 disabled:opacity-50"
          title="Voir le PDF"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
        </button>
        <button
          onClick={handleRemove}
          disabled={busy}
          className="no-print p-1 text-ink-500 hover:text-coral-600 disabled:opacity-50"
          title="Supprimer le fichier"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="no-print">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex items-center gap-2 rounded-lg border-2 border-dashed px-2.5 py-1.5 cursor-pointer text-xs transition-colors ${
          dragOver ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-500/20 text-ink-500 hover:border-brand-300 hover:text-brand-600'
        }`}
      >
        {busy ? <Loader2 size={14} className="animate-spin shrink-0" /> : <UploadCloud size={14} className="shrink-0" />}
        <span>Glissez un PDF ici ou cliquez pour en choisir un</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="text-xs text-coral-600 mt-1">{error}</p>}
    </div>
  );
}
