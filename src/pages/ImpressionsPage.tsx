import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, FileText, Printer, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatLong, prochainJourOuvre, jourOuvrePrecedent, toDateKey } from '../lib/dates';
import type { ImpressionItem, TypeImpression } from '../types';

const LABELS_TYPE: Record<TypeImpression, string> = {
  individuel: 'Individuel',
  binome: 'Binôme',
  groupe: 'Groupe',
  affichage: 'Affichage',
};

export function ImpressionsPage() {
  const params = useParams<{ date: string }>();
  const navigate = useNavigate();
  const dateKey = params.date ?? toDateKey(new Date());
  const date = useMemo(() => new Date(dateKey + 'T00:00:00'), [dateKey]);

  const ensureJourGenere = useAppStore((s) => s.ensureJourGenere);
  const cahierJournal = useAppStore((s) => s.cahierJournal);
  const emploiDuTemps = useAppStore((s) => s.emploiDuTemps);
  const effectif = useAppStore((s) => s.rituelsConfig.effectifClasse);
  const toggleImpression = useAppStore((s) => s.toggleImpression);
  const ready = useAppStore((s) => s.ready);
  const fichesCache = useAppStore((s) => s.fichesCache);
  const loadFiche = useAppStore((s) => s.loadFiche);
  const getImpressionFileUrl = useAppStore((s) => s.getImpressionFileUrl);
  const [fichesVues, setFichesVues] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (ready) ensureJourGenere(dateKey);
  }, [ready, dateKey, ensureJourGenere]);

  const jour = cahierJournal.jours[dateKey] ?? { date: dateKey, seances: [] };

  useEffect(() => {
    jour.seances.forEach((s) => {
      if (s.fichePrepId && !fichesCache[s.fichePrepId]) void loadFiche(s.fichePrepId);
    });
  }, [jour.seances, fichesCache, loadFiche]);

  const documentsDeFiches = jour.seances
    .map((s) => ({
      seance: s,
      fiche: s.fichePrepId ? fichesCache[s.fichePrepId] : undefined,
      matiere: emploiDuTemps.matieres.find((m) => m.id === s.matiereId),
    }))
    .filter((x): x is typeof x & { fiche: NonNullable<typeof x.fiche> } => !!x.fiche?.cheminFichierPdf);

  function copiesRequises(imp: ImpressionItem): number {
    if (imp.nbExemplaires) return imp.nbExemplaires;
    if (imp.type === 'individuel') return effectif;
    if (imp.type === 'binome') return Math.ceil(effectif / 2);
    if (imp.type === 'affichage') return 1;
    return 1;
  }

  const items = jour.seances.flatMap((s) =>
    s.impressions.map((imp) => ({ imp, seance: s, matiere: emploiDuTemps.matieres.find((m) => m.id === s.matiereId) })),
  );
  const totalDocuments = items.length + documentsDeFiches.length;
  const restants = items.filter((i) => !i.imp.coche).length + documentsDeFiches.filter((d) => !fichesVues.has(d.fiche.id)).length;

  function toggleFicheVue(ficheId: string) {
    setFichesVues((prev) => {
      const next = new Set(prev);
      if (next.has(ficheId)) next.delete(ficheId);
      else next.add(ficheId);
      return next;
    });
  }

  async function voirFichePdf(cheminFichierPdf: string) {
    const url = await getImpressionFileUrl(cheminFichierPdf);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 print-area">
      <div className="no-print flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/impressions/${toDateKey(jourOuvrePrecedent(date))}`)}
            className="p-2 rounded-lg hover:bg-ink-500/5 text-ink-700"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => navigate(`/impressions/${e.target.value}`)}
            className="text-sm border border-ink-500/10 rounded-lg px-2 py-1.5"
          />
          <button
            onClick={() => navigate(`/impressions/${toDateKey(prochainJourOuvre(date))}`)}
            className="p-2 rounded-lg hover:bg-ink-500/5 text-ink-700"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-1.5"
        >
          <Printer size={15} /> Imprimer la liste
        </button>
      </div>

      <h1 className="text-xl font-semibold text-ink-900">Impressions du jour</h1>
      <p className="text-sm text-ink-500 mt-1 capitalize">{formatLong(date)}</p>

      <div className="flex items-center gap-4 mt-4 mb-6 text-sm text-ink-700">
        <span className="flex items-center gap-1.5">
          <Users size={15} /> {effectif} élèves · {Math.ceil(effectif / 2)} binômes
        </span>
        <span className="text-ink-500">
          {totalDocuments === 0 ? 'Aucun document' : `${restants} / ${totalDocuments} document(s) restant(s)`}
        </span>
      </div>

      {totalDocuments === 0 && (
        <p className="text-sm text-ink-500 italic">Aucun document à imprimer pour cette journée.</p>
      )}

      <div className="space-y-2">
        {items.map(({ imp, seance, matiere }) => (
          <label
            key={imp.id}
            className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 cursor-pointer ${
              imp.coche ? 'border-leaf-200 bg-leaf-50/40' : 'border-ink-500/10'
            }`}
          >
            <input
              type="checkbox"
              checked={imp.coche}
              onChange={() => toggleImpression(dateKey, seance.id, imp.id)}
              className="accent-leaf-500 w-4 h-4 shrink-0"
            />
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: `${matiere?.couleur}22`, color: matiere?.couleur }}
            >
              {matiere?.nom}
            </span>
            <span className={`flex-1 text-sm font-medium ${imp.coche ? 'line-through text-ink-500' : 'text-ink-900'}`}>
              {imp.nom || 'Document sans nom'}
            </span>
            <span className="text-xs text-ink-500 shrink-0">{LABELS_TYPE[imp.type]}</span>
            <span className="text-xs font-semibold text-ink-700 bg-ink-500/5 rounded-full px-2 py-0.5 shrink-0">
              × {copiesRequises(imp)}
            </span>
          </label>
        ))}

        {documentsDeFiches.map(({ fiche, matiere }) => (
          <label
            key={fiche.id}
            className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 cursor-pointer ${
              fichesVues.has(fiche.id) ? 'border-leaf-200 bg-leaf-50/40' : 'border-ink-500/10'
            }`}
          >
            <input
              type="checkbox"
              checked={fichesVues.has(fiche.id)}
              onChange={() => toggleFicheVue(fiche.id)}
              className="accent-leaf-500 w-4 h-4 shrink-0"
            />
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: `${matiere?.couleur}22`, color: matiere?.couleur }}
            >
              {matiere?.nom}
            </span>
            <FileText size={14} className="text-ink-500 shrink-0" />
            <span className={`flex-1 text-sm font-medium ${fichesVues.has(fiche.id) ? 'line-through text-ink-500' : 'text-ink-900'}`}>
              {fiche.nomFichierPdf} <span className="text-ink-500 font-normal">(fiche de prep)</span>
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                void voirFichePdf(fiche.cheminFichierPdf!);
              }}
              className="no-print p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg shrink-0"
              title="Voir le PDF"
            >
              <Eye size={15} />
            </button>
          </label>
        ))}
      </div>
    </div>
  );
}
