import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2, LogOut } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { githubSync } from '../services/githubSyncService';
import { JOURS_SEMAINE, type Creneau, type JourSemaine, type Matiere } from '../types';

const LABELS_JOUR: Record<JourSemaine, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
};

export function ReglagesPage() {
  const edt = useAppStore((s) => s.emploiDuTemps);
  const setEmploiDuTemps = useAppStore((s) => s.setEmploiDuTemps);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  function updateMatiere(id: string, patch: Partial<Matiere>) {
    setEmploiDuTemps({ ...edt, matieres: edt.matieres.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  }

  function addMatiere() {
    const nouvelle: Matiere = { id: uuid(), nom: 'Nouvelle matière', couleur: '#5a80e8' };
    setEmploiDuTemps({ ...edt, matieres: [...edt.matieres, nouvelle] });
  }

  function removeMatiere(id: string) {
    setEmploiDuTemps({
      ...edt,
      matieres: edt.matieres.filter((m) => m.id !== id),
      creneaux: edt.creneaux.filter((c) => c.matiereId !== id),
    });
  }

  function updateCreneau(id: string, patch: Partial<Creneau>) {
    setEmploiDuTemps({ ...edt, creneaux: edt.creneaux.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  }

  function addCreneau(jour: JourSemaine) {
    const nouveau: Creneau = {
      id: uuid(),
      jour,
      heureDebut: '08:30',
      heureFin: '09:30',
      matiereId: edt.matieres[0]?.id ?? '',
    };
    setEmploiDuTemps({ ...edt, creneaux: [...edt.creneaux, nouveau] });
  }

  function removeCreneau(id: string) {
    setEmploiDuTemps({ ...edt, creneaux: edt.creneaux.filter((c) => c.id !== id) });
  }

  function handleDisconnect() {
    githubSync.clearConfig();
    window.location.reload();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink-900">Réglages</h1>
      <p className="text-sm text-ink-500 mt-1">
        Configurez les matières et l'emploi du temps récurrent qui génèrent automatiquement vos
        journées de classe.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 mb-3">Matières</h2>
        <div className="flex flex-wrap gap-3">
          {edt.matieres.map((m) => (
            <div key={m.id} className="flex items-center gap-2 bg-white border border-ink-500/10 rounded-lg px-2.5 py-1.5">
              <input
                type="color"
                value={m.couleur}
                onChange={(e) => updateMatiere(m.id, { couleur: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={m.nom}
                onChange={(e) => updateMatiere(m.id, { nom: e.target.value })}
                className="text-sm font-medium text-ink-900 w-32 focus:outline-none"
              />
              <button onClick={() => removeMatiere(m.id)} className="text-ink-500 hover:text-coral-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={addMatiere}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 px-3 py-1.5"
          >
            <Plus size={16} /> Ajouter une matière
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 mb-3">
          Emploi du temps hebdomadaire
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {JOURS_SEMAINE.map((jour) => {
            const creneaux = edt.creneaux
              .filter((c) => c.jour === jour)
              .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
            return (
              <div key={jour} className="bg-white border border-ink-500/10 rounded-xl p-3">
                <h3 className="text-sm font-semibold text-ink-900 mb-2">{LABELS_JOUR[jour]}</h3>
                <div className="space-y-2">
                  {creneaux.map((c) => (
                    <div key={c.id} className="rounded-lg border border-ink-500/10 p-2 space-y-1.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={c.heureDebut}
                          onChange={(e) => updateCreneau(c.id, { heureDebut: e.target.value })}
                          className="text-xs w-full border border-ink-500/10 rounded px-1 py-0.5"
                        />
                        <span className="text-ink-500 text-xs">→</span>
                        <input
                          type="time"
                          value={c.heureFin}
                          onChange={(e) => updateCreneau(c.id, { heureFin: e.target.value })}
                          className="text-xs w-full border border-ink-500/10 rounded px-1 py-0.5"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <select
                          value={c.matiereId}
                          onChange={(e) => updateCreneau(c.id, { matiereId: e.target.value })}
                          className="text-xs w-full border border-ink-500/10 rounded px-1 py-0.5"
                        >
                          {edt.matieres.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nom}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => removeCreneau(c.id)} className="text-ink-500 hover:text-coral-500 shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addCreneau(jour)}
                    className="w-full flex items-center justify-center gap-1 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-lg py-1.5"
                  >
                    <Plus size={13} /> Créneau
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10 border-t border-ink-500/10 pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 mb-3">Compte GitHub</h2>
        {confirmingDisconnect ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-700">Se déconnecter et supprimer le token de ce navigateur ?</span>
            <button onClick={handleDisconnect} className="text-coral-600 font-medium hover:underline">
              Confirmer
            </button>
            <button onClick={() => setConfirmingDisconnect(false)} className="text-ink-500 hover:underline">
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDisconnect(true)}
            className="flex items-center gap-2 text-sm font-medium text-coral-600 hover:text-coral-700"
          >
            <LogOut size={15} /> Déconnecter le dépôt GitHub
          </button>
        )}
      </section>
    </div>
  );
}
