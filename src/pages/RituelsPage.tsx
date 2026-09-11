import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, Maximize2, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { TypeRituel } from '../types';

const LABELS_TYPE: Record<TypeRituel, string> = {
  date: 'Date du jour',
  calcul_mental: 'Calcul mental',
  mot_du_jour: 'Mot du jour',
  chaque_jour_compte: 'Chaque jour compte',
  meteo: 'Météo',
  custom: 'Rituel personnalisé',
};

export function RituelsPage() {
  const rituelsConfig = useAppStore((s) => s.rituelsConfig);
  const updateRituelsConfig = useAppStore((s) => s.updateRituelsConfig);
  const addRituel = useAppStore((s) => s.addRituel);
  const updateRituel = useAppStore((s) => s.updateRituel);
  const removeRituel = useAppStore((s) => s.removeRituel);
  const reordonnerRituels = useAppStore((s) => s.reordonnerRituels);
  const navigate = useNavigate();

  const rituelsTries = [...rituelsConfig.rituels].sort((a, b) => a.ordre - b.ordre);

  function move(id: string, dir: -1 | 1) {
    const idx = rituelsTries.findIndex((r) => r.id === id);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= rituelsTries.length) return;
    const copy = [...rituelsTries];
    [copy[idx], copy[swapWith]] = [copy[swapWith], copy[idx]];
    reordonnerRituels(copy);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Rituels quotidiens</h1>
          <p className="text-sm text-ink-500 mt-1">Date, calcul mental, mot du jour, chaque jour compte…</p>
        </div>
        <button
          onClick={() => navigate('/rituels/projection')}
          className="flex items-center gap-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-1.5"
        >
          <Maximize2 size={15} /> Mode projection
        </button>
      </div>

      <div className="bg-white border border-ink-500/10 rounded-xl p-4 mb-6 grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-ink-500">Effectif de la classe</label>
          <input
            type="number"
            value={rituelsConfig.effectifClasse}
            onChange={(e) => updateRituelsConfig({ effectifClasse: Number(e.target.value) })}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-500">Date de début d'année (pour « chaque jour compte »)</label>
          <input
            type="date"
            value={rituelsConfig.dateDebutAnnee}
            onChange={(e) => updateRituelsConfig({ dateDebutAnnee: e.target.value })}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        {rituelsTries.map((r, i) => (
          <div key={r.id} className="bg-white border border-ink-500/10 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="no-print flex flex-col shrink-0">
                <button onClick={() => move(r.id, -1)} disabled={i === 0} className="text-ink-500 disabled:opacity-30 hover:text-brand-600">
                  <ArrowUp size={13} />
                </button>
                <button
                  onClick={() => move(r.id, 1)}
                  disabled={i === rituelsTries.length - 1}
                  className="text-ink-500 disabled:opacity-30 hover:text-brand-600"
                >
                  <ArrowDown size={13} />
                </button>
              </div>
              <input
                type="checkbox"
                checked={r.actif}
                onChange={(e) => updateRituel(r.id, { actif: e.target.checked })}
                className="accent-brand-500 shrink-0"
              />
              <span className="text-xs font-medium text-ink-500 bg-ink-500/5 rounded-full px-2 py-0.5 shrink-0">
                {LABELS_TYPE[r.type]}
              </span>
              <input
                value={r.titre}
                onChange={(e) => updateRituel(r.id, { titre: e.target.value })}
                className="flex-1 min-w-0 text-sm font-medium focus:outline-none bg-transparent"
              />
              <button onClick={() => removeRituel(r.id)} className="text-ink-500 hover:text-coral-500 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
            {r.type !== 'date' && r.type !== 'chaque_jour_compte' && r.type !== 'meteo' && (
              <input
                value={r.contenu ?? ''}
                onChange={(e) => updateRituel(r.id, { contenu: e.target.value })}
                placeholder="Contenu affiché en projection…"
                className="w-full mt-2 text-sm border border-ink-500/10 rounded-lg px-2 py-1.5"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => addRituel({ type: 'custom', titre: 'Nouveau rituel', contenu: '', actif: true })}
        className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <Plus size={16} /> Ajouter un rituel
      </button>
    </div>
  );
}
