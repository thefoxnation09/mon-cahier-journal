import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { ArrowLeft, Plus, Printer, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { RichTextEditor } from '../components/RichTextEditor';
import { MODALITES, type EtapeFiche, type FichePrep, type ModaliteTravail } from '../types';

export function FichePrepPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loadFiche = useAppStore((s) => s.loadFiche);
  const updateFiche = useAppStore((s) => s.updateFiche);
  const cached = useAppStore((s) => (id ? s.fichesCache[id] : undefined));

  useEffect(() => {
    if (!id || cached) return;
    void loadFiche(id);
  }, [id, cached, loadFiche]);

  if (!id) return null;
  if (!cached) {
    return <div className="max-w-3xl mx-auto px-6 py-8 text-sm text-ink-500">Chargement…</div>;
  }
  const current = cached;

  function patch(p: Partial<FichePrep>) {
    void updateFiche(id!, p);
  }

  function addEtape() {
    const etape: EtapeFiche = {
      id: uuid(),
      titre: '',
      duree: 10,
      deroulement: '',
      consigneEnseignant: '',
      activiteEleve: '',
      materiel: '',
      modalite: 'collectif',
    };
    patch({ etapes: [...current.etapes, etape] });
  }

  function updateEtape(etapeId: string, p: Partial<EtapeFiche>) {
    patch({ etapes: current.etapes.map((e) => (e.id === etapeId ? { ...e, ...p } : e)) });
  }

  function removeEtape(etapeId: string) {
    patch({ etapes: current.etapes.filter((e) => e.id !== etapeId) });
  }

  const dureeTotale = current.etapes.reduce((sum, e) => sum + e.duree, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 print-area">
      <div className="no-print flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/fiches')}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-900"
        >
          <ArrowLeft size={16} /> Retour aux fiches
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-1.5"
        >
          <Printer size={15} /> Imprimer
        </button>
      </div>

      <input
        value={current.titre}
        onChange={(e) => patch({ titre: e.target.value })}
        placeholder="Titre de la fiche"
        className="w-full text-2xl font-semibold text-ink-900 focus:outline-none bg-transparent mb-4"
      />

      <div className="grid sm:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium text-ink-500">Domaine</label>
          <input
            value={current.domaine}
            onChange={(e) => patch({ domaine: e.target.value })}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
            placeholder="Français…"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-500">Niveau</label>
          <input
            value={current.niveau}
            onChange={(e) => patch({ niveau: e.target.value })}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-500">Durée totale</label>
          <input
            type="number"
            value={current.duree}
            onChange={(e) => patch({ duree: Number(e.target.value) })}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-500">Durée séances ({dureeTotale} min)</label>
          <p className="text-sm text-ink-500 mt-1.5">calculée automatiquement</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium text-ink-500">Compétences travaillées (une par ligne)</label>
        <textarea
          value={current.competences.join('\n')}
          onChange={(e) => patch({ competences: e.target.value.split('\n') })}
          rows={2}
          className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
          placeholder="Compétence du programme Cycle 2…"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <div>
          <label className="text-xs font-medium text-ink-500">Objectifs</label>
          <textarea
            value={current.objectifs}
            onChange={(e) => patch({ objectifs: e.target.value })}
            rows={3}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-500">Matériel</label>
          <textarea
            value={current.materiel}
            onChange={(e) => patch({ materiel: e.target.value })}
            rows={3}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-ink-900">Déroulement</h2>
          <button
            onClick={addEtape}
            className="no-print flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus size={13} /> Phase
          </button>
        </div>
        <div className="space-y-2">
          {current.etapes.map((etape, i) => (
            <div key={etape.id} className="rounded-lg border border-ink-500/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-ink-500 shrink-0">{i + 1}.</span>
                <input
                  value={etape.titre}
                  onChange={(e) => updateEtape(etape.id, { titre: e.target.value })}
                  placeholder="Nom de la phase (découverte, entraînement…)"
                  className="flex-1 min-w-0 text-sm font-medium focus:outline-none bg-transparent"
                />
                <input
                  type="number"
                  min={0}
                  value={etape.duree}
                  onChange={(e) => updateEtape(etape.id, { duree: Number(e.target.value) })}
                  className="w-14 text-xs border border-ink-500/10 rounded px-1 py-0.5 text-center"
                />
                <span className="text-xs text-ink-500">min</span>
                <select
                  value={etape.modalite}
                  onChange={(e) => updateEtape(etape.id, { modalite: e.target.value as ModaliteTravail })}
                  className="text-xs border border-ink-500/10 rounded px-1 py-0.5"
                >
                  {MODALITES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button onClick={() => removeEtape(etape.id)} className="no-print text-ink-500 hover:text-coral-500 shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="mb-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Déroulement</label>
                <textarea
                  value={etape.deroulement ?? ''}
                  onChange={(e) => updateEtape(etape.id, { deroulement: e.target.value })}
                  placeholder="Contenu de l'activité (calculs, consignes précises, exemples…)"
                  rows={2}
                  className="w-full text-xs border border-ink-500/10 rounded px-2 py-1 mt-0.5"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Rôle du maître</label>
                  <textarea
                    value={etape.consigneEnseignant}
                    onChange={(e) => updateEtape(etape.id, { consigneEnseignant: e.target.value })}
                    placeholder="Consigne, étayage, guidage…"
                    rows={2}
                    className="w-full text-xs border border-ink-500/10 rounded px-2 py-1 mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Rôle de l'élève</label>
                  <textarea
                    value={etape.activiteEleve}
                    onChange={(e) => updateEtape(etape.id, { activiteEleve: e.target.value })}
                    placeholder="Ce que fait l'élève…"
                    rows={2}
                    className="w-full text-xs border border-ink-500/10 rounded px-2 py-1 mt-0.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Matériel</label>
                <input
                  value={etape.materiel ?? ''}
                  onChange={(e) => updateEtape(etape.id, { materiel: e.target.value })}
                  placeholder="Ardoise, craie, cahier…"
                  className="w-full text-xs border border-ink-500/10 rounded px-2 py-1 mt-0.5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="text-xs font-medium text-ink-500">Observations</label>
          <textarea
            value={current.observations ?? ''}
            onChange={(e) => patch({ observations: e.target.value })}
            rows={3}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
            placeholder="Ce qui a été observé pendant la séance…"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-500">Prolongement(s) possible(s)</label>
          <textarea
            value={current.prolongements ?? ''}
            onChange={(e) => patch({ prolongements: e.target.value })}
            rows={3}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
            placeholder="Réinvestissement, jeux, aller plus loin…"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-500">Remédiation(s) éventuelle(s)</label>
          <textarea
            value={current.remediation ?? ''}
            onChange={(e) => patch({ remediation: e.target.value })}
            rows={3}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
            placeholder="Atelier dirigé, reprise en groupe restreint…"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-ink-500 mb-1 block">Notes libres</label>
        <RichTextEditor
          value={current.contenuHtml}
          onChange={(html) => patch({ contenuHtml: html })}
          placeholder="Toute information complémentaire utile…"
        />
      </div>
    </div>
  );
}
