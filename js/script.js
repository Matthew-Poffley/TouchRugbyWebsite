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
  initWhatsappCaptcha();
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

// "Join the WhatsApp group" captcha: a homemade spot-the-rugby-ball check that
// gates the real invite link behind a correct selection.
function initWhatsappCaptcha() {
  const trigger = document.getElementById('whatsapp-link');
  const modal = document.getElementById('captcha-modal');
  const grid = document.getElementById('captcha-grid');
  const submitButton = document.getElementById('captcha-submit');
  const errorMessage = document.getElementById('captcha-error');
  if (!trigger || !modal || !grid || !submitButton || !errorMessage) return;

  // Row-major index (0-15, top-left to bottom-right) of squares containing a rugby ball.
  const CORRECT_CELLS = [4, 5, 8, 9, 11, 12, 14, 15];
  const selected = new Set();

  for (let i = 0; i < 16; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'captcha-cell';
    cell.setAttribute('aria-label', `Square ${i + 1}`);
    cell.addEventListener('click', () => {
      const isSelected = cell.classList.toggle('selected');
      isSelected ? selected.add(i) : selected.delete(i);
    });
    grid.appendChild(cell);
  }
  const cells = Array.from(grid.children);

  function clearSelection() {
    selected.clear();
    cells.forEach((cell) => cell.classList.remove('selected'));
  }

  function openModal() {
    clearSelection();
    errorMessage.classList.add('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    openModal();
  });

  modal.querySelectorAll('[data-captcha-dismiss]').forEach((element) => {
    element.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  submitButton.addEventListener('click', () => {
    const isCorrect =
      selected.size === CORRECT_CELLS.length && CORRECT_CELLS.every((index) => selected.has(index));

    if (isCorrect) {
      closeModal();
      window.open(trigger.href, '_blank', 'noopener');
    } else {
      clearSelection();
      errorMessage.classList.remove('hidden');
    }
  });
}
