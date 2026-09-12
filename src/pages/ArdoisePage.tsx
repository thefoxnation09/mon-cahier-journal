import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Moon, Plus, Sun, Trash2, X } from 'lucide-react';

const STORAGE_KEY = 'cahier-journal:ardoise';

type Couleur = 'blanc' | 'jaune' | 'rose';
type Fond = 'sombre' | 'clair';

interface ArdoiseState {
  texte: string;
  taille: number;
  couleur: Couleur;
  fond: Fond;
}

const COULEURS: { value: Couleur; label: string; hexSombre: string; hexClair: string }[] = [
  { value: 'blanc', label: 'Craie blanche', hexSombre: '#f7f5f0', hexClair: '#2e2a3d' },
  { value: 'jaune', label: 'Craie jaune', hexSombre: '#f0d98c', hexClair: '#a8862a' },
  { value: 'rose', label: 'Craie rose', hexSombre: '#f3b8c9', hexClair: '#c14f74' },
];

function chargerEtat(): ArdoiseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { texte: '', taille: 56, couleur: 'blanc', fond: 'sombre', ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { texte: '', taille: 56, couleur: 'blanc', fond: 'sombre' };
}

export function ArdoisePage() {
  const navigate = useNavigate();
  const [etat, setEtat] = useState<ArdoiseState>(chargerEtat);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(etat));
  }, [etat]);

  const coul = COULEURS.find((c) => c.value === etat.couleur) ?? COULEURS[0];
  const estSombre = etat.fond === 'sombre';
  const bgClass = estSombre ? 'bg-[#2f4538]' : 'bg-cream-50';
  const textColor = estSombre ? coul.hexSombre : coul.hexClair;

  return (
    <div className={`min-h-screen flex flex-col ${bgClass} transition-colors`}>
      <div className="no-print flex items-center justify-between px-6 py-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
            {COULEURS.map((c) => (
              <button
                key={c.value}
                onClick={() => setEtat((e) => ({ ...e, couleur: c.value }))}
                title={c.label}
                className={`w-6 h-6 rounded-full border-2 ${etat.couleur === c.value ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: estSombre ? c.hexSombre : c.hexClair }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 bg-white/10 rounded-full px-1 py-1">
            <button
              onClick={() => setEtat((e) => ({ ...e, taille: Math.max(28, e.taille - 8) }))}
              className="p-1.5 rounded-full text-white hover:bg-white/20"
            >
              <Minus size={15} />
            </button>
            <span className="text-xs text-white w-6 text-center">{etat.taille}</span>
            <button
              onClick={() => setEtat((e) => ({ ...e, taille: Math.min(120, e.taille + 8) }))}
              className="p-1.5 rounded-full text-white hover:bg-white/20"
            >
              <Plus size={15} />
            </button>
          </div>
          <button
            onClick={() => setEtat((e) => ({ ...e, fond: e.fond === 'sombre' ? 'clair' : 'sombre' }))}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            title="Changer de fond"
          >
            {estSombre ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => {
              if (window.confirm('Effacer le tableau ?')) setEtat((e) => ({ ...e, texte: '' }));
            }}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            title="Effacer"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <button
          onClick={() => navigate('/journal/jour')}
          className={`p-2 rounded-full hover:bg-white/20 ${estSombre ? 'text-white' : 'text-ink-700'}`}
        >
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 px-8 pb-8">
        <textarea
          value={etat.texte}
          onChange={(e) => setEtat((prev) => ({ ...prev, texte: e.target.value }))}
          placeholder="Écrivez ici…"
          autoFocus
          className="ardoise-textarea w-full h-full bg-transparent border-none focus:outline-none resize-none font-cursive leading-tight"
          style={{ fontSize: etat.taille, color: textColor }}
        />
      </div>
    </div>
  );
}
