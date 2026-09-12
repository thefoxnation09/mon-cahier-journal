import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileText, Folder, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { GABARITS_FICHES } from '../data/defaults';
import { groupByDomaine } from '../lib/group';

export function FichesListPage() {
  const fichesIndex = useAppStore((s) => s.fichesIndex);
  const creerFiche = useAppStore((s) => s.creerFiche);
  const deleteFiche = useAppStore((s) => s.deleteFiche);
  const navigate = useNavigate();
  const [showGabarits, setShowGabarits] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  async function handleNouvelle() {
    const fiche = await creerFiche({});
    navigate(`/fiches/${fiche.id}`);
  }

  async function handleDepuisGabarit(gabaritId: string) {
    const gabarit = GABARITS_FICHES.find((g) => g.id === gabaritId);
    if (!gabarit) return;
    const fiche = await creerFiche({
      titre: gabarit.nom,
      domaine: gabarit.domaine,
      competences: gabarit.competences,
      objectifs: gabarit.objectifs,
      materiel: gabarit.materiel,
      duree: gabarit.duree,
      etapes: gabarit.etapes.map((e) => ({ ...e, id: crypto.randomUUID() })),
      prolongements: gabarit.prolongements,
      remediation: gabarit.remediation,
    });
    setShowGabarits(false);
    navigate(`/fiches/${fiche.id}`);
  }

  async function handleDelete(id: string, e: MouseEvent) {
    e.stopPropagation();
    if (window.confirm('Supprimer cette fiche de préparation ?')) {
      await deleteFiche(id);
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

  const groupes = groupByDomaine(fichesIndex.fiches);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Fiches de préparation</h1>
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
                {GABARITS_FICHES.map((g) => (
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
            <Plus size={16} /> Nouvelle fiche
          </button>
        </div>
      </div>

      {fichesIndex.fiches.length === 0 && (
        <p className="text-sm text-ink-500 italic">Aucune fiche pour le moment.</p>
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
                    .map((f) => (
                      <button
                        key={f.id}
                        onClick={() => navigate(`/fiches/${f.id}`)}
                        className="w-full flex items-center gap-3 bg-white border border-ink-500/10 rounded-xl px-4 py-3 hover:border-brand-200 text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                          <FileText size={17} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-ink-900 truncate">{f.titre || 'Sans titre'}</p>
                          <p className="text-xs text-ink-500">
                            {f.niveau} {f.jourDate ? `· liée au ${f.jourDate}` : ''}
                          </p>
                        </div>
                        <button onClick={(e) => handleDelete(f.id, e)} className="p-1.5 text-ink-500 hover:text-coral-500 shrink-0">
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
