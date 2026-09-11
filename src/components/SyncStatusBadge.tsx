import type { ReactNode } from 'react';
import { CheckCircle2, CloudOff, Loader2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function SyncStatusBadge() {
  const syncState = useAppStore((s) => s.syncState);
  const isGitHubConfigured = useAppStore((s) => s.isGitHubConfigured);

  if (!isGitHubConfigured) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-500 bg-ink-500/10 rounded-full px-2.5 py-1">
        <CloudOff size={13} /> Local uniquement
      </span>
    );
  }

  const map: Record<string, { icon: ReactNode; label: string; cls: string }> = {
    idle: { icon: <CheckCircle2 size={13} />, label: 'À jour', cls: 'text-ink-500 bg-ink-500/10' },
    syncing: { icon: <Loader2 size={13} className="animate-spin" />, label: 'Synchronisation…', cls: 'text-brand-600 bg-brand-100' },
    synced: { icon: <CheckCircle2 size={13} />, label: 'Synchronisé', cls: 'text-leaf-600 bg-leaf-100' },
    error: { icon: <AlertTriangle size={13} />, label: syncState.error ?? 'Erreur', cls: 'text-coral-600 bg-coral-100' },
    offline: { icon: <CloudOff size={13} />, label: 'Hors ligne', cls: 'text-sun-500 bg-sun-100' },
  };
  const item = map[syncState.status] ?? map.idle;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 ${item.cls}`} title={syncState.error}>
      {item.icon} {item.label}
      {syncState.pending > 0 && syncState.status !== 'syncing' ? ` (${syncState.pending})` : ''}
    </span>
  );
}
