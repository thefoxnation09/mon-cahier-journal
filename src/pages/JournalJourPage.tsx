import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Copy, Layers, Plus, Printer } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SeanceCard } from '../components/SeanceCard';
import { formatLong, prochainJourOuvre, jourOuvrePrecedent, toDateKey } from '../lib/dates';

export function JournalJourPage() {
  const params = useParams<{ date: string }>();
  const navigate = useNavigate();
  const dateKey = params.date ?? toDateKey(new Date());
  const date = useMemo(() => new Date(dateKey + 'T00:00:00'), [dateKey]);

  const ensureJourGenere = useAppStore((s) => s.ensureJourGenere);
  const cahierJournal = useAppStore((s) => s.cahierJournal);
  const addSeance = useAppStore((s) => s.addSeance);
  const setBilanJour = useAppStore((s) => s.setBilanJour);
  const enregistrerJourneeCommeTemplate = useAppStore((s) => s.enregistrerJourneeCommeTemplate);
  const appliquerTemplate = useAppStore((s) => s.appliquerTemplate);
  const templates = useAppStore((s) => s.templates);
  const ready = useAppStore((s) => s.ready);

  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  useEffect(() => {
    if (ready) ensureJourGenere(dateKey);
  }, [ready, dateKey, ensureJourGenere]);

  const jour = cahierJournal.jours[dateKey] ?? { date: dateKey, seances: [] };

  function handlePrint() {
    window.print();
  }

  function handleSaveTemplate() {
    const nom = window.prompt('Nom du modèle de journée ?', formatLong(date));
    if (nom) enregistrerJourneeCommeTemplate(dateKey, nom);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 print-area">
      <div className="no-print flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/journal/jour/${toDateKey(jourOuvrePrecedent(date))}`)}
            className="p-2 rounded-lg hover:bg-ink-500/5 text-ink-700"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => navigate(`/journal/jour/${e.target.value}`)}
            className="text-sm border border-ink-500/10 rounded-lg px-2 py-1.5"
          />
          <button
            onClick={() => navigate(`/journal/jour/${toDateKey(prochainJourOuvre(date))}`)}
            className="p-2 rounded-lg hover:bg-ink-500/5 text-ink-700"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowTemplateMenu((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-700 border border-ink-500/10 rounded-lg px-3 py-1.5 hover:bg-ink-500/5"
            >
              <Layers size={15} /> Modèles
            </button>
            {showTemplateMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-ink-500/10 rounded-lg shadow-lg z-10 py-1">
                {templates.templates.length === 0 && (
                  <p className="px-3 py-2 text-xs text-ink-500">Aucun modèle enregistré.</p>
                )}
                {templates.templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      appliquerTemplate(dateKey, t.id);
                      setShowTemplateMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-brand-50 text-ink-700"
                  >
                    {t.nom}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleSaveTemplate}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-700 border border-ink-500/10 rounded-lg px-3 py-1.5 hover:bg-ink-500/5"
          >
            <Copy size={15} /> Dupliquer en modèle
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-1.5"
          >
            <Printer size={15} /> Imprimer la journée
          </button>
        </div>
      </div>

      <h1 className="text-xl font-semibold text-ink-900 mb-6">{formatLong(date)}</h1>

      <div className="space-y-3">
        {jour.seances.length === 0 && (
          <p className="text-sm text-ink-500 italic">
            Aucune séance ce jour (jour non travaillé ou emploi du temps vide).
          </p>
        )}
        {jour.seances.map((seance) => (
          <SeanceCard key={seance.id} dateKey={dateKey} seance={seance} />
        ))}
      </div>

      <button
        onClick={() => addSeance(dateKey)}
        className="no-print mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <Plus size={16} /> Ajouter une séance
      </button>

      <div className="mt-8">
        <label className="text-sm font-semibold text-ink-900">Bilan du jour</label>
        <textarea
          value={jour.bilanJour ?? ''}
          onChange={(e) => setBilanJour(dateKey, e.target.value)}
          rows={3}
          placeholder="Ce qu'il faut retenir de cette journée, ajustements pour la suite…"
          className="w-full mt-1.5 text-sm border border-ink-500/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      </div>
    </div>
  );
}
