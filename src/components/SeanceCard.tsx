import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  Printer,
  SkipForward,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { PdfDropZone } from './PdfDropZone';
import { MODALITES, type ModaliteTravail, type PhaseSeance, type Seance, type StatutSeance, type TypeImpression } from '../types';

const STATUTS: { value: StatutSeance; label: string; cls: string }[] = [
  { value: 'a_faire', label: 'À faire', cls: 'bg-ink-500/10 text-ink-700' },
  { value: 'en_cours', label: 'En cours', cls: 'bg-sun-100 text-sun-500' },
  { value: 'terminee', label: 'Terminée', cls: 'bg-leaf-100 text-leaf-600' },
  { value: 'reportee', label: 'Reportée', cls: 'bg-coral-100 text-coral-600' },
];

const TYPES_IMPRESSION: { value: TypeImpression; label: string }[] = [
  { value: 'individuel', label: 'Individuel' },
  { value: 'binome', label: 'Binôme' },
  { value: 'groupe', label: 'Groupe' },
  { value: 'affichage', label: 'Affichage' },
];

interface Props {
  dateKey: string;
  seance: Seance;
  defaultOpen?: boolean;
}

export function SeanceCard({ dateKey, seance, defaultOpen }: Props) {
  const [open, setOpen] = useState(!!defaultOpen);
  const matieres = useAppStore((s) => s.emploiDuTemps.matieres);
  const updateSeance = useAppStore((s) => s.updateSeance);
  const removeSeance = useAppStore((s) => s.removeSeance);
  const reporterSeance = useAppStore((s) => s.reporterSeance);
  const toggleImpression = useAppStore((s) => s.toggleImpression);
  const addImpression = useAppStore((s) => s.addImpression);
  const removeImpression = useAppStore((s) => s.removeImpression);
  const uploadImpressionFile = useAppStore((s) => s.uploadImpressionFile);
  const removeImpressionFile = useAppStore((s) => s.removeImpressionFile);
  const getImpressionFileUrl = useAppStore((s) => s.getImpressionFileUrl);
  const creerFiche = useAppStore((s) => s.creerFiche);
  const navigate = useNavigate();

  const matiere = matieres.find((m) => m.id === seance.matiereId);
  const statutInfo = STATUTS.find((s) => s.value === seance.statut) ?? STATUTS[0];

  function patch(p: Partial<Seance>) {
    updateSeance(dateKey, seance.id, p);
  }

  function addPhase() {
    const phase: PhaseSeance = {
      id: uuid(),
      titre: '',
      duree: 10,
      consigneEnseignant: '',
      activiteEleve: '',
      modalite: 'collectif',
    };
    patch({ phases: [...seance.phases, phase] });
  }

  function updatePhase(id: string, p: Partial<PhaseSeance>) {
    patch({ phases: seance.phases.map((ph) => (ph.id === id ? { ...ph, ...p } : ph)) });
  }

  function removePhase(id: string) {
    patch({ phases: seance.phases.filter((ph) => ph.id !== id) });
  }

  async function handleOuvrirFiche() {
    if (seance.fichePrepId) {
      navigate(`/fiches/${seance.fichePrepId}`);
      return;
    }
    const fiche = await creerFiche({
      titre: seance.titre || matiere?.nom || 'Nouvelle fiche',
      domaine: matiere?.nom ?? '',
      seanceId: seance.id,
      jourDate: dateKey,
      duree: seance.phases.reduce((sum, p) => sum + p.duree, 0) || 45,
    });
    patch({ fichePrepId: fiche.id });
    navigate(`/fiches/${fiche.id}`);
  }

  const dureeTotale = seance.phases.reduce((sum, p) => sum + p.duree, 0);

  return (
    <div className="bg-white rounded-xl border border-ink-500/10 overflow-hidden" style={{ borderLeftColor: matiere?.couleur, borderLeftWidth: 4 }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen((o) => !o)} className="no-print text-ink-500 shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: `${matiere?.couleur}22`, color: matiere?.couleur }}
        >
          {matiere?.nom ?? 'Matière'}
        </span>

        {seance.heureDebut && (
          <span className="hidden sm:flex items-center gap-1 text-xs text-ink-500 shrink-0">
            <Clock size={12} /> {seance.heureDebut}–{seance.heureFin}
          </span>
        )}

        <input
          value={seance.titre}
          onChange={(e) => patch({ titre: e.target.value })}
          placeholder="Titre de la séance…"
          className="flex-1 min-w-0 font-medium text-ink-900 focus:outline-none bg-transparent"
        />

        <select
          value={seance.statut}
          onChange={(e) => patch({ statut: e.target.value as StatutSeance })}
          className={`no-print text-xs font-medium rounded-full px-2 py-1 border-0 shrink-0 ${statutInfo.cls}`}
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <span className={`print:inline-flex hidden text-xs font-medium rounded-full px-2 py-1 ${statutInfo.cls}`}>
          {statutInfo.label}
        </span>

        <div className="no-print flex items-center gap-1 shrink-0">
          {seance.statut !== 'terminee' && (
            <button
              onClick={() => reporterSeance(dateKey, seance.id)}
              title="Reporter au jour ouvré suivant"
              className="p-1.5 text-ink-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
            >
              <SkipForward size={15} />
            </button>
          )}
          <button
            onClick={handleOuvrirFiche}
            title="Ouvrir / créer la fiche de prep"
            className="p-1.5 text-ink-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
          >
            <FileText size={15} />
          </button>
          <button
            onClick={() => removeSeance(dateKey, seance.id)}
            title="Supprimer la séance"
            className="p-1.5 text-ink-500 hover:text-coral-600 hover:bg-coral-50 rounded-lg"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {seance.reporteeDepuis && (
        <p className="px-4 pb-2 text-xs text-coral-500 -mt-1">Reportée depuis le {seance.reporteeDepuis}</p>
      )}

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-ink-500/10 pt-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink-500">Objectif</label>
              <textarea
                value={seance.objectif ?? ''}
                onChange={(e) => patch({ objectif: e.target.value })}
                rows={2}
                className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
                placeholder="Ce que les élèves doivent apprendre…"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500">Matériel</label>
              <textarea
                value={seance.materiel ?? ''}
                onChange={(e) => patch({ materiel: e.target.value })}
                rows={2}
                className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
                placeholder="Matériel nécessaire…"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-ink-500">
                Déroulement {dureeTotale > 0 && `(${dureeTotale} min)`}
              </label>
              <button
                onClick={addPhase}
                className="no-print flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <Plus size={13} /> Phase
              </button>
            </div>
            <div className="space-y-2">
              {seance.phases.map((phase, i) => (
                <div key={phase.id} className="rounded-lg border border-ink-500/10 p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-ink-500 shrink-0">{i + 1}.</span>
                    <input
                      value={phase.titre}
                      onChange={(e) => updatePhase(phase.id, { titre: e.target.value })}
                      placeholder="Nom de la phase"
                      className="flex-1 min-w-0 text-sm font-medium focus:outline-none bg-transparent"
                    />
                    <input
                      type="number"
                      min={0}
                      value={phase.duree}
                      onChange={(e) => updatePhase(phase.id, { duree: Number(e.target.value) })}
                      className="w-14 text-xs border border-ink-500/10 rounded px-1 py-0.5 text-center"
                    />
                    <span className="text-xs text-ink-500">min</span>
                    <select
                      value={phase.modalite}
                      onChange={(e) => updatePhase(phase.id, { modalite: e.target.value as ModaliteTravail })}
                      className="text-xs border border-ink-500/10 rounded px-1 py-0.5"
                    >
                      {MODALITES.map((mo) => (
                        <option key={mo.value} value={mo.value}>
                          {mo.label}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => removePhase(phase.id)} className="no-print text-ink-500 hover:text-coral-500 shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <textarea
                      value={phase.consigneEnseignant}
                      onChange={(e) => updatePhase(phase.id, { consigneEnseignant: e.target.value })}
                      placeholder="Consigne enseignant"
                      rows={2}
                      className="w-full text-xs border border-ink-500/10 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
                    />
                    <textarea
                      value={phase.activiteEleve}
                      onChange={(e) => updatePhase(phase.id, { activiteEleve: e.target.value })}
                      placeholder="Activité élève"
                      rows={2}
                      className="w-full text-xs border border-ink-500/10 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-ink-500 flex items-center gap-1">
                <Printer size={12} /> Exercices / fichiers à imprimer
              </label>
              <button
                onClick={() => addImpression(dateKey, seance.id, { nom: '', type: 'individuel' })}
                className="no-print flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <Plus size={13} /> Document
              </button>
            </div>
            <div className="space-y-1.5">
              {seance.impressions.map((imp) => (
                <div key={imp.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={imp.coche}
                      onChange={() => toggleImpression(dateKey, seance.id, imp.id)}
                      className="accent-brand-500"
                    />
                    <input
                      value={imp.nom}
                      onChange={(e) =>
                        updateSeance(dateKey, seance.id, {
                          impressions: seance.impressions.map((i) => (i.id === imp.id ? { ...i, nom: e.target.value } : i)),
                        })
                      }
                      placeholder="Nom du document…"
                      className="flex-1 text-sm border border-ink-500/10 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
                    />
                    <select
                      value={imp.type}
                      onChange={(e) =>
                        updateSeance(dateKey, seance.id, {
                          impressions: seance.impressions.map((i) =>
                            i.id === imp.id ? { ...i, type: e.target.value as TypeImpression } : i,
                          ),
                        })
                      }
                      className="text-xs border border-ink-500/10 rounded px-1 py-1"
                    >
                      {TYPES_IMPRESSION.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={imp.nbExemplaires ?? ''}
                      onChange={(e) =>
                        updateSeance(dateKey, seance.id, {
                          impressions: seance.impressions.map((i) =>
                            i.id === imp.id ? { ...i, nbExemplaires: Number(e.target.value) || undefined } : i,
                          ),
                        })
                      }
                      placeholder="Nb"
                      className="w-14 text-xs border border-ink-500/10 rounded px-1 py-1 text-center"
                    />
                    <button
                      onClick={() => removeImpression(dateKey, seance.id, imp.id)}
                      className="no-print text-ink-500 hover:text-coral-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="pl-6">
                    <PdfDropZone
                      nomFichier={imp.nomFichier}
                      onUpload={(file) => uploadImpressionFile(dateKey, seance.id, imp.id, file)}
                      onRemove={() => removeImpressionFile(dateKey, seance.id, imp.id)}
                      onView={() => getImpressionFileUrl(imp.cheminFichier ?? '')}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-500">Bilan de la séance</label>
            <textarea
              value={seance.bilan ?? ''}
              onChange={(e) => patch({ bilan: e.target.value })}
              rows={2}
              className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
              placeholder="Ce qui a fonctionné, ce qui reste à reprendre…"
            />
          </div>
        </div>
      )}
    </div>
  );
}
