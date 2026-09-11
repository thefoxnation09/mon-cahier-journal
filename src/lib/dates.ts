import { addDays, format, isWeekend, parseISO, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { JourSemaine } from '../types';

const JOURS: JourSemaine[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromDateKey(key: string): Date {
  return parseISO(key);
}

export function jourSemaineDe(date: Date): JourSemaine | null {
  const day = date.getDay(); // 0 = dimanche
  if (day === 0 || day === 6) return null;
  return JOURS[day - 1];
}

export function formatLong(date: Date): string {
  const str = format(date, 'EEEE d MMMM yyyy', { locale: fr });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatCourt(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

export function prochainJourOuvre(date: Date): Date {
  let next = addDays(date, 1);
  while (isWeekend(next)) next = addDays(next, 1);
  return next;
}

export function jourOuvrePrecedent(date: Date): Date {
  let prev = addDays(date, -1);
  while (isWeekend(prev)) prev = addDays(prev, -1);
  return prev;
}

export function debutSemaine(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function joursDeLaSemaine(date: Date): Date[] {
  const start = debutSemaine(date);
  return Array.from({ length: 5 }, (_, i) => addDays(start, i));
}

export function joursOuvresEntre(debut: Date, fin: Date): number {
  if (fin < debut) return 0;
  let count = 0;
  let cur = new Date(debut);
  while (cur <= fin) {
    if (!isWeekend(cur)) count += 1;
    cur = addDays(cur, 1);
  }
  return count;
}
