/**
 * Les navigateurs n'appliquent qu'une seule taille/orientation de page par
 * impression, définie par la dernière règle @page correspondante au moment
 * de l'impression : il n'existe pas de support fiable pour des pages
 * nommées changeant l'orientation au sein d'un même document. On injecte
 * donc une règle @page temporaire juste avant d'imprimer, puis on la
 * retire une fois l'impression lancée.
 */
export function imprimerEnPaysage(): void {
  const style = document.createElement('style');
  style.textContent = '@media print { @page { size: A4 landscape; margin: 12mm; } }';
  document.head.appendChild(style);
  // window.print() ne bloque pas forcément l'exécution du script selon les
  // navigateurs : on retire la règle sur l'évènement standard afterprint
  // plutôt que juste après l'appel, pour ne jamais la retirer trop tôt.
  const nettoyer = () => {
    style.remove();
    window.removeEventListener('afterprint', nettoyer);
  };
  window.addEventListener('afterprint', nettoyer);
  window.print();
}
