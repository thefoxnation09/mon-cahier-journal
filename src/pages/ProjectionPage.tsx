import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Cloud, CloudLightning, CloudRain, CloudSnow, Eye, Sun, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatLong, joursOuvresEntre } from '../lib/dates';
import { devinetteDuJour } from '../data/defaults';
import type { Rituel } from '../types';

const METEO_OPTIONS = [
  { value: 'soleil', icon: Sun, label: 'Soleil', color: '#e6ac5c' },
  { value: 'nuage', icon: Cloud, label: 'Nuageux', color: '#b9b3cc' },
  { value: 'pluie', icon: CloudRain, label: 'Pluie', color: '#7fb2e0' },
  { value: 'neige', icon: CloudSnow, label: 'Neige', color: '#ac8fe4' },
  { value: 'orage', icon: CloudLightning, label: 'Orage', color: '#e592ab' },
];

export function ProjectionPage() {
  const navigate = useNavigate();
  const rituelsConfig = useAppStore((s) => s.rituelsConfig);
  const updateRituel = useAppStore((s) => s.updateRituel);
  const rituelsActifs = useMemo(
    () => rituelsConfig.rituels.filter((r) => r.actif).sort((a, b) => a.ordre - b.ordre),
    [rituelsConfig],
  );
  const [index, setIndex] = useState(0);
  const [reponseVisible, setReponseVisible] = useState(false);
  const [dernierIndex, setDernierIndex] = useState(index);
  const today = new Date();

  if (index !== dernierIndex) {
    setDernierIndex(index);
    setReponseVisible(false);
  }

  if (rituelsActifs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-50 gap-4">
        <p className="text-ink-700">Aucun rituel actif à projeter.</p>
        <button onClick={() => navigate('/rituels')} className="text-brand-600 font-medium underline">
          Retour aux réglages
        </button>
      </div>
    );
  }

  const rituel = rituelsActifs[Math.min(index, rituelsActifs.length - 1)];

  function renderContenu(r: Rituel) {
    switch (r.type) {
      case 'date':
        return <p className="text-4xl sm:text-6xl font-semibold text-ink-900 text-center capitalize">{formatLong(today)}</p>;
      case 'chaque_jour_compte': {
        const n = joursOuvresEntre(new Date(rituelsConfig.dateDebutAnnee + 'T00:00:00'), today);
        return (
          <div className="text-center">
            <p className="text-8xl sm:text-9xl font-bold text-brand-600">{n}</p>
            <p className="text-xl text-ink-700 mt-4">jour{n > 1 ? 's' : ''} d'école depuis la rentrée</p>
          </div>
        );
      }
      case 'meteo':
        return (
          <div className="flex flex-wrap items-center justify-center gap-6">
            {METEO_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = r.contenu === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => updateRituel(r.id, { contenu: opt.value })}
                  className={`flex flex-col items-center gap-2 rounded-2xl p-5 transition-transform ${
                    selected ? 'bg-white shadow-lg scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Icon size={56} color={opt.color} />
                  <span className="text-sm font-medium text-ink-700">{opt.label}</span>
                </button>
              );
            })}
          </div>
        );
      case 'devinette': {
        const devinette = devinetteDuJour(today);
        return (
          <div className="text-center max-w-2xl">
            <p className="text-3xl sm:text-4xl font-medium text-ink-900 leading-relaxed">{devinette.question}</p>
            {reponseVisible ? (
              <p className="text-2xl sm:text-3xl font-semibold text-brand-600 mt-8">{devinette.reponse}</p>
            ) : (
              <button
                onClick={() => setReponseVisible(true)}
                className="no-print mt-8 inline-flex items-center gap-2 bg-white shadow rounded-full px-5 py-2.5 text-sm font-medium text-brand-600 hover:shadow-md"
              >
                <Eye size={16} /> Voir la réponse
              </button>
            )}
          </div>
        );
      }
      case 'calcul_mental':
      case 'mot_du_jour':
      case 'custom':
      default:
        return (
          <textarea
            value={r.contenu ?? ''}
            onChange={(e) => updateRituel(r.id, { contenu: e.target.value })}
            placeholder="Cliquez pour écrire…"
            rows={4}
            className="w-full max-w-2xl text-3xl sm:text-4xl text-center font-medium text-ink-900 bg-transparent border-none focus:outline-none resize-none placeholder:text-ink-500/40"
          />
        );
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-50 via-cream-50 to-leaf-50">
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-sm font-semibold text-ink-500 uppercase tracking-wide">{rituel.titre}</span>
        <button onClick={() => navigate('/rituels')} className="p-2 rounded-full hover:bg-ink-500/10 text-ink-700">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">{renderContenu(rituel)}</div>

      <div className="flex items-center justify-center gap-6 pb-8">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="p-3 rounded-full bg-white shadow disabled:opacity-30 text-ink-700"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-1.5">
          {rituelsActifs.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full ${i === index ? 'bg-brand-500' : 'bg-ink-500/20'}`}
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((i) => Math.min(rituelsActifs.length - 1, i + 1))}
          disabled={index === rituelsActifs.length - 1}
          className="p-3 rounded-full bg-white shadow disabled:opacity-30 text-ink-700"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}
