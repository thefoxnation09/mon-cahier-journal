import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { ArrowLeft, FileText, Plus, Printer, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Sequence, SequenceSeance } from '../types';

export function SequencePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loadSequence = useAppStore((s) => s.loadSequence);
  const updateSequence = useAppStore((s) => s.updateSequence);
  const creerFiche = useAppStore((s) => s.creerFiche);
  const cached = useAppStore((s) => (id ? s.sequencesCache[id] : undefined));

  useEffect(() => {
    if (!id || cached) return;
    void loadSequence(id);
  }, [id, cached, loadSequence]);

  if (!id) return null;
  if (!cached) {
    return <div className="max-w-4xl mx-auto px-6 py-8 text-sm text-ink-500">Chargement…</div>;
  }
  const current = cached;

  function patch(p: Partial<Sequence>) {
    void updateSequence(id!, p);
  }

  function addSeanceRow() {
    const row: SequenceSeance = { id: uuid(), titre: '', objectifs: '', duree: 40 };
    patch({ seances: [...current.seances, row] });
  }

  function updateSeanceRow(rowId: string, p: Partial<SequenceSeance>) {
    patch({ seances: current.seances.map((s) => (s.id === rowId ? { ...s, ...p } : s)) });
  }

  function removeSeanceRow(rowId: string) {
    patch({ seances: current.seances.filter((s) => s.id !== rowId) });
  }

  async function handleOuvrirFiche(row: SequenceSeance) {
    if (row.fichePrepId) {
      navigate(`/fiches/${row.fichePrepId}`);
      return;
    }
    const fiche = await creerFiche({
      titre: row.titre || current.titre,
      domaine: current.domaine,
      niveau: current.niveau,
      sequenceId: current.id,
      duree: row.duree,
    });
    updateSeanceRow(row.id, { fichePrepId: fiche.id });
    navigate(`/fiches/${fiche.id}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 print-area">
      <div className="no-print flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/sequences')}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-900"
        >
          <ArrowLeft size={16} /> Retour aux séquences
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
        placeholder="Titre de la séquence"
        className="w-full text-2xl font-semibold text-ink-900 focus:outline-none bg-transparent mb-4"
      />

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium text-ink-500">Cycle</label>
          <input
            value={current.cycle}
            onChange={(e) => patch({ cycle: e.target.value })}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
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
          <label className="text-xs font-medium text-ink-500">Domaine du socle</label>
          <input
            value={current.domaine}
            onChange={(e) => patch({ domaine: e.target.value })}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
            placeholder="Nombres et Calculs…"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium text-ink-500">Objectif général de la séquence</label>
        <textarea
          value={current.objectifGeneral}
          onChange={(e) => patch({ objectifGeneral: e.target.value })}
          rows={2}
          className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-ink-500">Connaissances réactivées (une par ligne)</label>
          <textarea
            value={current.connaissancesReactivees}
            onChange={(e) => patch({ connaissancesReactivees: e.target.value })}
            rows={4}
            className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-500">Nombre de séances</label>
          <p className="text-3xl font-semibold text-brand-600 mt-1">{current.seances.length}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-ink-900">Séances de la séquence</h2>
          <button
            onClick={addSeanceRow}
            className="no-print flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus size={13} /> Séance
          </button>
        </div>
        <div className="space-y-2">
          {current.seances.map((row, i) => (
            <div key={row.id} className="rounded-lg border border-ink-500/10 p-3">
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-ink-500 pt-2 shrink-0">{i + 1}.</span>
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    value={row.titre}
                    onChange={(e) => updateSeanceRow(row.id, { titre: e.target.value })}
                    placeholder="Titre de la séance"
                    className="w-full text-sm font-medium border border-ink-500/10 rounded px-2 py-1"
                  />
                  <textarea
                    value={row.objectifs}
                    onChange={(e) => updateSeanceRow(row.id, { objectifs: e.target.value })}
                    placeholder="Objectif(s) de la séance"
                    rows={2}
                    className="w-full text-xs border border-ink-500/10 rounded px-2 py-1"
                  />
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={row.duree}
                      onChange={(e) => updateSeanceRow(row.id, { duree: Number(e.target.value) })}
                      className="w-14 text-xs border border-ink-500/10 rounded px-1 py-1 text-center"
                    />
                    <span className="text-xs text-ink-500">min</span>
                  </div>
                  <button
                    onClick={() => handleOuvrirFiche(row)}
                    title="Ouvrir / créer la fiche de séance"
                    className="no-print p-1.5 text-ink-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                  >
                    <FileText size={15} />
                  </button>
                  <button
                    onClick={() => removeSeanceRow(row.id)}
                    className="no-print p-1.5 text-ink-500 hover:text-coral-600 hover:bg-coral-50 rounded-lg"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-ink-500">Évaluation — descriptif et outils utilisés</label>
        <textarea
          value={current.evaluationDescriptif}
          onChange={(e) => patch({ evaluationDescriptif: e.target.value })}
          rows={4}
          className="w-full text-sm border border-ink-500/10 rounded-lg px-2 py-1.5 mt-1"
        />
      </div>
    </div>
  );
}
