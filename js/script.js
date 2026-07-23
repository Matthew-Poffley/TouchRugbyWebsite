// Bristol Social Touch Rugby — highlights whichever season card is currently active.
// Summer season: May (month 4) through September (month 8), inclusive.
// Winter season: October (month 9) through April (month 3), inclusive.

document.addEventListener('DOMContentLoaded', () => {
  const month = new Date().getMonth(); // 0 = January ... 11 = December
  const isSummerSeason = month >= 4 && month <= 8;

  const currentCard = document.getElementById(isSummerSeason ? 'season-summer' : 'season-winter');
  if (!currentCard) return;

  currentCard.classList.add('is-current');
  currentCard.querySelector('.now-tag').classList.remove('hidden');
});
