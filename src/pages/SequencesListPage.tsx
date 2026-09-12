import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, ChevronDown, ChevronRight, Folder, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { GABARITS_SEQUENCES } from '../data/defaults';
import { groupByDomaine } from '../lib/group';
import type { MouseEvent } from 'react';

export function SequencesListPage() {
  const sequencesIndex = useAppStore((s) => s.sequencesIndex);
  const creerSequence = useAppStore((s) => s.creerSequence);
  const deleteSequence = useAppStore((s) => s.deleteSequence);
  const navigate = useNavigate();
  const [showGabarits, setShowGabarits] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  async function handleNouvelle() {
    const sequence = await creerSequence({});
    navigate(`/sequences/${sequence.id}`);
  }

  async function handleDepuisGabarit(gabaritId: string) {
    const gabarit = GABARITS_SEQUENCES.find((g) => g.id === gabaritId);
    if (!gabarit) return;
    const sequence = await creerSequence({
      titre: gabarit.nom,
      cycle: gabarit.cycle,
      domaine: gabarit.domaine,
      objectifGeneral: gabarit.objectifGeneral,
      connaissancesReactivees: gabarit.connaissancesReactivees,
      evaluationDescriptif: gabarit.evaluationDescriptif,
      seances: gabarit.seances.map((s) => ({ ...s, id: crypto.randomUUID() })),
    });
    setShowGabarits(false);
    navigate(`/sequences/${sequence.id}`);
  }

  async function handleDelete(id: string, e: MouseEvent) {
    e.stopPropagation();
    if (window.confirm('Supprimer cette séquence ?')) {
      await deleteSequence(id);
    }
  }

  function toggleGroupe(domaine: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(domaine)) next.delete(domaine);
      else next.add(domaine);
      return next;
    });
  }

  const groupes = groupByDomaine(sequencesIndex.sequences);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Fiches de séquence</h1>
          <p className="text-sm text-ink-500 mt-1">Cycle 2 — CE1</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowGabarits((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-700 border border-ink-500/10 rounded-lg px-3 py-1.5 hover:bg-ink-500/5 bg-white"
            >
              <Sparkles size={15} /> Depuis un gabarit
            </button>
            {showGabarits && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-ink-500/10 rounded-lg shadow-lg z-10 py-1">
                {GABARITS_SEQUENCES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleDepuisGabarit(g.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 text-ink-700"
                  >
                    {g.nom}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleNouvelle}
            className="flex items-center gap-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-1.5"
          >
            <Plus size={16} /> Nouvelle séquence
          </button>
        </div>
      </div>

      {sequencesIndex.sequences.length === 0 && (
        <p className="text-sm text-ink-500 italic">Aucune séquence pour le moment.</p>
      )}

      <div className="space-y-5">
        {groupes.map(({ domaine, items }) => {
          const estReduit = collapsed.has(domaine);
          return (
            <div key={domaine}>
              <button
                onClick={() => toggleGroupe(domaine)}
                className="flex items-center gap-2 mb-2 text-sm font-semibold text-ink-700 hover:text-ink-900"
              >
                {estReduit ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                <Folder size={15} className="text-brand-500" />
                {domaine}
                <span className="text-xs font-normal text-ink-500">({items.length})</span>
              </button>
              {!estReduit && (
                <div className="space-y-2">
                  {[...items]
                    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                    .map((seq) => (
                      <button
                        key={seq.id}
                        onClick={() => navigate(`/sequences/${seq.id}`)}
                        className="w-full flex items-center gap-3 bg-white border border-ink-500/10 rounded-xl px-4 py-3 hover:border-brand-200 text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                          <BookMarked size={17} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-ink-900 truncate">{seq.titre || 'Sans titre'}</p>
                          <p className="text-xs text-ink-500">
                            {seq.niveau} · {seq.nombreSeances} séance{seq.nombreSeances > 1 ? 's' : ''}
                          </p>
                        </div>
                        <button onClick={(e) => handleDelete(seq.id, e)} className="p-1.5 text-ink-500 hover:text-coral-500 shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </button>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
