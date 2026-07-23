// Bristol Social Touch Rugby — highlights whichever season card is currently active.
// Summer season: May (month 4) through September (month 8), inclusive.
// Winter season: October (month 9) through April (month 3), inclusive.

document.addEventListener('DOMContentLoaded', () => {
  const month = new Date().getMonth(); // 0 = January ... 11 = December
  const isSummerSeason = month >= 4 && month <= 8;

  const currentCard = document.getElementById(isSummerSeason ? 'season-summer' : 'season-winter');
  if (currentCard) {
    currentCard.classList.add('is-current');
    currentCard.querySelector('.now-tag').classList.remove('hidden');
  }

  initAdminCarousel();
  initFaqAccordion();
});

// FAQ accordion: clicking a question opens its answer and closes any other open one.
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach((item) => {
    const button = item.querySelector('.faq-question');
    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach((other) => other.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}

// "Meet the Admins" carousel: one photo at a time, with prev/next buttons,
// dot navigation, and a gentle auto-advance that pauses on hover.
function initAdminCarousel() {
  const track = document.getElementById('admin-track');
  const dotsContainer = document.getElementById('admin-dots');
  const prevButton = document.getElementById('admin-prev');
  const nextButton = document.getElementById('admin-next');
  if (!track || !dotsContainer || !prevButton || !nextButton) return;

  const slides = Array.from(track.querySelectorAll('.admin-slide'));
  if (slides.length === 0) return;

  let currentIndex = 0;
  let autoAdvanceId = null;

  const dots = slides.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'admin-dot';
    dot.setAttribute('aria-label', `Go to admin ${index + 1}`);
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
    return dot;
  });

  function goToSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === currentIndex));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
  }

  function startAutoAdvance() {
    stopAutoAdvance();
    autoAdvanceId = setInterval(() => goToSlide(currentIndex + 1), 4000);
  }

  function stopAutoAdvance() {
    if (autoAdvanceId) clearInterval(autoAdvanceId);
  }

  prevButton.addEventListener('click', () => {
    goToSlide(currentIndex - 1);
    startAutoAdvance();
  });

  nextButton.addEventListener('click', () => {
    goToSlide(currentIndex + 1);
    startAutoAdvance();
  });

  const carousel = document.getElementById('admin-carousel');
  carousel.addEventListener('mouseenter', stopAutoAdvance);
  carousel.addEventListener('mouseleave', startAutoAdvance);

  goToSlide(0);
  startAutoAdvance();
}
