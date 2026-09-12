import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clipboard, ClipboardCheck, Copy } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { addDays } from 'date-fns';
import { debutSemaine, formatCourt, toDateKey } from '../lib/dates';
import type { Seance } from '../types';

type SeanceClipboard = Array<Omit<Seance, 'id' | 'statut' | 'impressions' | 'reporteeDepuis'>>;

const LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

export function JournalSemainePage() {
  const params = useParams<{ date: string }>();
  const navigate = useNavigate();
  const dateKey = params.date ?? toDateKey(new Date());
  const date = useMemo(() => new Date(dateKey + 'T00:00:00'), [dateKey]);
  const jours = useMemo(() => {
    const start = debutSemaine(date);
    return Array.from({ length: 5 }, (_, i) => addDays(start, i));
  }, [date]);

  const cahierJournal = useAppStore((s) => s.cahierJournal);
  const emploiDuTemps = useAppStore((s) => s.emploiDuTemps);
  const ensureJourGenere = useAppStore((s) => s.ensureJourGenere);
  const addSeance = useAppStore((s) => s.addSeance);
  const ready = useAppStore((s) => s.ready);

  const [clipboard, setClipboard] = useState<SeanceClipboard | null>(null);
  const [clipboardSource, setClipboardSource] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    jours.forEach((d) => ensureJourGenere(toDateKey(d)));
  }, [ready, jours, ensureJourGenere]);

  function jourPour(d: Date) {
    const key = toDateKey(d);
    return cahierJournal.jours[key] ?? { date: key, seances: [] };
  }

  function copierJournee(key: string) {
    const jour = cahierJournal.jours[key] ?? { date: key, seances: [] };
    setClipboard(
      jour.seances.map(({ id: _id, statut: _statut, impressions: _impressions, reporteeDepuis: _r, ...rest }) => rest),
    );
    setClipboardSource(key);
  }

  function collerJournee(key: string) {
    if (!clipboard) return;
    clipboard.forEach((s) => addSeance(key, s));
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 mb-1">Cahier journal</p>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/journal/semaine/${toDateKey(addDays(date, -7))}`)}
            className="p-2 rounded-lg hover:bg-ink-500/5 text-ink-700"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-ink-700">
            Semaine du {formatCourt(jours[0])} au {formatCourt(jours[4])}
          </span>
          <button
            onClick={() => navigate(`/journal/semaine/${toDateKey(addDays(date, 7))}`)}
            className="p-2 rounded-lg hover:bg-ink-500/5 text-ink-700"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        {clipboard && (
          <span className="text-xs text-ink-500 flex items-center gap-1.5">
            <ClipboardCheck size={13} /> Journée du {clipboardSource} copiée — collez-la sur un autre jour.
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {jours.map((d, i) => {
          const key = toDateKey(d);
          const jour = jourPour(d);
          return (
            <div key={key} className="bg-white border border-ink-500/10 rounded-xl flex flex-col min-h-[240px]">
              <div className="flex items-center justify-between px-3 py-2 border-b border-ink-500/10">
                <button onClick={() => navigate(`/journal/jour/${key}`)} className="text-left">
                  <p className="text-sm font-semibold text-ink-900">{LABELS[i]}</p>
                  <p className="text-xs text-ink-500">{formatCourt(d)}</p>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copierJournee(key)}
                    title="Copier cette journée"
                    className="p-1 text-ink-500 hover:text-brand-600"
                  >
                    <Copy size={13} />
                  </button>
                  {clipboard && (
                    <button
                      onClick={() => collerJournee(key)}
                      title="Coller la journée copiée ici"
                      className="p-1 text-ink-500 hover:text-leaf-600"
                    >
                      <Clipboard size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 p-2 space-y-1.5">
                {jour.seances.length === 0 && <p className="text-xs text-ink-500 italic px-1">—</p>}
                {jour.seances.map((s) => {
                  const matiere = emploiDuTemps.matieres.find((m) => m.id === s.matiereId);
                  return (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/journal/jour/${key}`)}
                      className="w-full text-left rounded-lg px-2 py-1.5 text-xs hover:bg-ink-500/5"
                      style={{ borderLeft: `3px solid ${matiere?.couleur ?? '#ccc'}` }}
                    >
                      <p className="font-medium text-ink-900 truncate">{s.titre || matiere?.nom || 'Séance'}</p>
                      {s.heureDebut && <p className="text-ink-500">{s.heureDebut}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
