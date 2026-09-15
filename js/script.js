// Bristol Social Touch Rugby — highlights whichever season card(s) are currently active.
// Summer season: May (month 4) through September (month 8), inclusive.
// Winter season: September (month 8) through May (month 4), inclusive (wraps year end).
// May and September are hand-off months claimed by both cards' labels, so both
// can be marked active at the same time.

document.addEventListener('DOMContentLoaded', () => {
  activateCurrentSeasons();
  initAdminCarousel();
  initFaqAccordion();
  initWhatsappCaptcha();
  initWeatherWidget();
  initWeatherFlip();
  initMudSplats();
  initHeroPlayers();
  initHeroWeather();
});

// The hero background loops a rugby strike play, run until it scores: the
// scrum-half feeds the fly-half, an inside decoy runner drags a defender in,
// the fly-half throws a cut-out pass over the decoy's head into the space that
// opens up, and the outside centre runs at the last defender before putting the
// winger away in the corner. Attackers in order: 9, 10, 12 (decoy), 13, 14.
// Teams swap attack/defence and run it back the other way after each try.
//
// Every position is a pure function of elapsed time, sampled from a Catmull-Rom
// spline through the waypoints below, so the players run in one continuous flowing
// motion rather than easing to a halt at each waypoint. Purely decorative, so it's
// skipped entirely under prefers-reduced-motion.
function initHeroPlayers() {
  const canvas = document.querySelector('.hero-players');
  const hero = document.querySelector('.hero-bg');
  if (!canvas || !hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  // ResizeObserver also catches the hero growing when webfonts land, which a
  // window resize listener on its own would miss.
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(resize).observe(hero);
  } else {
    window.addEventListener('resize', resize);
  }

  const TEAM_PALE_BLUE = 'rgba(191, 219, 254, 0.9)';
  const TEAM_AMBER = 'rgba(245, 158, 11, 0.95)';
  const BALL_COLOR = 'rgba(232, 184, 125, 0.95)';
  const TRY_LINE = 1100 / 1200; // matches the try line drawn in the pitch background SVG
  const CYCLE = 8; // seconds per try, including the hold and the fade between plays
  const FADE = 0.5;

  // Waypoints are [seconds, how far up the pitch, how far across it], written
  // from the attacking team's point of view. fx()/fy() mirror them, so the same
  // move plays out in either direction and finishes in the opposite corner.
  //
  // The backline sets up as a rearward diagonal — each man out is a little
  // deeper than the one inside him — because a pass may not travel forward.
  // Every receiver is behind the passer at the moment the ball is thrown, so
  // the ball always goes backwards across the line even while everyone runs
  // forward. Keep that depth if you retime the move.
  const ATTACK_KEYS = [
    // 9 — scrum-half, the most advanced of the backs; feeds 10 and follows
    [[0, 0.49, 0.29], [1, 0.545, 0.3], [1.6, 0.562, 0.305], [2.4, 0.585, 0.315], [3.2, 0.605, 0.325],
     [3.9, 0.622, 0.335], [4.6, 0.638, 0.345], [5.4, 0.655, 0.355], [6.1, 0.668, 0.365], [7, 0.682, 0.375]],
    // 10 — fly-half, carries to the line and throws the cut-out
    [[0, 0.455, 0.39], [1, 0.51, 0.4], [1.6, 0.528, 0.405], [2.4, 0.549, 0.412], [3.2, 0.571, 0.42],
     [3.9, 0.59, 0.428], [4.6, 0.608, 0.436], [5.4, 0.628, 0.444], [6.1, 0.645, 0.452], [7, 0.665, 0.46]],
    // 12 — decoy, angles back onto the inside shoulder and runs through the line
    [[0, 0.42, 0.49], [1, 0.475, 0.5], [1.6, 0.505, 0.485], [2.4, 0.56, 0.455], [3.2, 0.625, 0.425],
     [3.9, 0.668, 0.405], [4.6, 0.7, 0.392], [5.4, 0.73, 0.383], [6.1, 0.752, 0.378], [7, 0.775, 0.374]],
    // 13 — outside centre, takes the cut-out and runs at the last defender
    [[0, 0.385, 0.61], [1, 0.44, 0.62], [1.6, 0.457, 0.622], [2.4, 0.48, 0.628], [3.2, 0.522, 0.645],
     [3.9, 0.562, 0.665], [4.6, 0.598, 0.682], [5.4, 0.635, 0.7], [6.1, 0.663, 0.715], [7, 0.695, 0.732]],
    // 14 — winger, deepest of all, and finishes in the corner
    [[0, 0.35, 0.75], [1, 0.405, 0.76], [1.6, 0.425, 0.765], [2.4, 0.452, 0.775], [3.2, 0.478, 0.8],
     [3.9, 0.505, 0.835], [4.6, 0.61, 0.862], [5.4, 0.77, 0.877], [6.1, 0.925, 0.886], [7, 0.98, 0.893]],
  ];

  const DEFENCE_KEYS = [
    [[0, 0.69, 0.28], [1, 0.63, 0.28], [1.6, 0.615, 0.285], [2.4, 0.6, 0.29], [3.2, 0.59, 0.3],
     [3.9, 0.59, 0.31], [4.6, 0.62, 0.32], [5.4, 0.68, 0.335], [6.1, 0.73, 0.35], [7, 0.78, 0.36]],
    // bites in on the decoy
    [[0, 0.69, 0.4], [1, 0.63, 0.4], [1.6, 0.615, 0.41], [2.4, 0.6, 0.44], [3.2, 0.59, 0.455],
     [3.9, 0.59, 0.46], [4.6, 0.62, 0.465], [5.4, 0.68, 0.475], [6.1, 0.73, 0.485], [7, 0.78, 0.49]],
    [[0, 0.69, 0.52], [1, 0.63, 0.52], [1.6, 0.615, 0.525], [2.4, 0.6, 0.535], [3.2, 0.59, 0.53],
     [3.9, 0.59, 0.545], [4.6, 0.62, 0.56], [5.4, 0.68, 0.575], [6.1, 0.73, 0.59], [7, 0.78, 0.6]],
    [[0, 0.69, 0.64], [1, 0.63, 0.64], [1.6, 0.615, 0.645], [2.4, 0.6, 0.655], [3.2, 0.59, 0.645],
     [3.9, 0.59, 0.635], [4.6, 0.62, 0.655], [5.4, 0.68, 0.675], [6.1, 0.73, 0.69], [7, 0.78, 0.7]],
    // last defender: steps in to meet 13, and is left behind by the pass outside him
    [[0, 0.69, 0.78], [1, 0.63, 0.78], [1.6, 0.615, 0.785], [2.4, 0.6, 0.79], [3.2, 0.59, 0.77],
     [3.9, 0.595, 0.735], [4.6, 0.635, 0.765], [5.4, 0.7, 0.8], [6.1, 0.755, 0.825], [7, 0.8, 0.84]],
  ];

  // [passer, receiver, ball leaves, ball arrives]. Kept short so the line barely
  // advances while the ball is in the air.
  const PASSES = [
    { from: 0, to: 1, start: 1, end: 1.24 },
    { from: 1, to: 3, start: 2.4, end: 2.66 }, // the cut-out, skipping the decoy
    { from: 3, to: 4, start: 3.6, end: 3.84 },
  ];

  function buildTrack(keys) {
    const points = keys.map(([t, f, a]) => ({ t, f, a, mf: 0, ma: 0 }));
    for (let i = 0; i < points.length; i++) {
      const prev = points[Math.max(i - 1, 0)];
      const next = points[Math.min(i + 1, points.length - 1)];
      const span = next.t - prev.t || 1;
      points[i].mf = (next.f - prev.f) / span;
      points[i].ma = (next.a - prev.a) / span;
    }
    return points;
  }

  const attackTracks = ATTACK_KEYS.map(buildTrack);
  const defenceTracks = DEFENCE_KEYS.map(buildTrack);

  // Cubic Hermite through the waypoints with Catmull-Rom tangents: position and
  // speed both stay continuous, so nobody stops dead between waypoints.
  function sample(track, time) {
    const first = track[0];
    const last = track[track.length - 1];
    if (time <= first.t) return { f: first.f, a: first.a };
    if (time >= last.t) return { f: last.f, a: last.a };
    let i = 0;
    while (i < track.length - 2 && time > track[i + 1].t) i += 1;
    const p0 = track[i];
    const p1 = track[i + 1];
    const span = p1.t - p0.t;
    const u = (time - p0.t) / span;
    const u2 = u * u;
    const u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1;
    const h10 = u3 - 2 * u2 + u;
    const h01 = -2 * u3 + 3 * u2;
    const h11 = u3 - u2;
    return {
      f: h00 * p0.f + h10 * span * p0.mf + h01 * p1.f + h11 * span * p1.mf,
      a: h00 * p0.a + h10 * span * p0.ma + h01 * p1.a + h11 * span * p1.ma,
    };
  }

  function smoothstep(t) {
    const c = Math.min(Math.max(t, 0), 1);
    return c * c * (3 - 2 * c);
  }

  // The ball sits with its carrier, and hands over on a smoothstep so it leaves
  // and arrives matching each runner's speed instead of snapping between them.
  function ballAt(time) {
    let carrier = PASSES[0].from;
    for (let i = 0; i < PASSES.length; i++) {
      const pass = PASSES[i];
      if (time < pass.start) break;
      if (time <= pass.end) {
        const u = smoothstep((time - pass.start) / (pass.end - pass.start));
        const from = sample(attackTracks[pass.from], time);
        const to = sample(attackTracks[pass.to], time);
        return { f: from.f + (to.f - from.f) * u, a: from.a + (to.a - from.a) * u };
      }
      carrier = pass.to;
    }
    return sample(attackTracks[carrier], time);
  }

  // When the winger actually crosses the line, found once by walking the spline.
  const finisherTrack = attackTracks[attackTracks.length - 1];
  let tryTime = CYCLE;
  for (let t = 0; t <= 7; t += 0.01) {
    if (sample(finisherTrack, t).f >= TRY_LINE) {
      tryTime = t;
      break;
    }
  }

  let direction = 1;
  let flipAcross = false;
  let sceneAlpha = 1; // fade between plays; every draw is scaled by it
  function fx(forward) {
    return (direction === 1 ? forward : 1 - forward) * width;
  }
  function fy(across) {
    return (flipAcross ? 1 - across : across) * height;
  }

  const TRAIL_STEPS = 7;
  const TRAIL_GAP = 0.035;

  function drawRunner(track, time, color, pulse) {
    for (let i = TRAIL_STEPS; i >= 1; i--) {
      const past = sample(track, time - i * TRAIL_GAP);
      const fade = 1 - i / (TRAIL_STEPS + 1);
      ctx.globalAlpha = sceneAlpha * 0.22 * fade;
      ctx.beginPath();
      ctx.arc(fx(past.f), fy(past.a), 4 * (0.3 + 0.5 * fade), 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.globalAlpha = sceneAlpha;
    const now = sample(track, time);
    ctx.beginPath();
    ctx.arc(fx(now.f), fy(now.a), pulse ? 6.8 : 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawBall(time) {
    for (let i = TRAIL_STEPS; i >= 1; i--) {
      const past = ballAt(time - i * TRAIL_GAP);
      const fade = 1 - i / (TRAIL_STEPS + 1);
      ctx.globalAlpha = sceneAlpha * 0.22 * fade;
      ctx.beginPath();
      ctx.arc(fx(past.f), fy(past.a), 2.5 * (0.3 + 0.5 * fade), 0, Math.PI * 2);
      ctx.fillStyle = BALL_COLOR;
      ctx.fill();
    }
    ctx.globalAlpha = sceneAlpha;

    const here = ballAt(time);
    const ahead = ballAt(time + 0.08);
    const dx = fx(ahead.f) - fx(here.f);
    const dy = fy(ahead.a) - fy(here.a);
    ctx.save();
    ctx.translate(fx(here.f), fy(here.a));
    ctx.rotate(Math.hypot(dx, dy) > 1 ? Math.atan2(dy, dx) : 0);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = BALL_COLOR;
    ctx.fill();
    ctx.restore();
  }

  function drawTryFlash(time) {
    const age = time - tryTime;
    if (age < 0 || age > 1.2) return;
    const spread = age / 1.2;
    const spot = sample(finisherTrack, tryTime);
    ctx.beginPath();
    ctx.arc(fx(spot.f), fy(spot.a), 6 + spread * 46, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.55 * (1 - spread) * sceneAlpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const startTime = performance.now();
  function frame(now) {
    // Read the clock rather than accumulating deltas, so a dropped frame never
    // leaves the play a little behind where it should be.
    const elapsed = (now - startTime) / 1000;
    const cycle = Math.floor(elapsed / CYCLE);
    const time = elapsed - cycle * CYCLE;

    direction = cycle % 2 === 0 ? 1 : -1;
    flipAcross = cycle % 2 === 1;
    const attackColor = cycle % 2 === 0 ? TEAM_PALE_BLUE : TEAM_AMBER;
    const defendColor = cycle % 2 === 0 ? TEAM_AMBER : TEAM_PALE_BLUE;

    ctx.clearRect(0, 0, width, height);
    // Fade the play in and out so the loop back to the start isn't a hard cut.
    sceneAlpha = Math.min(smoothstep(time / FADE), smoothstep((CYCLE - time) / FADE));
    ctx.globalAlpha = sceneAlpha;

    defenceTracks.forEach((track) => drawRunner(track, time, defendColor, false));
    attackTracks.forEach((track, i) => {
      const caught = PASSES.some((pass) => pass.to === i && time >= pass.end && time < pass.end + 0.28);
      drawRunner(track, time, attackColor, caught);
    });
    drawBall(time);
    drawTryFlash(time);
    ctx.globalAlpha = 1;

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Rain codes from the Open-Meteo WMO table (see WEATHER_CODES below) — drizzle,
// rain and thunderstorms, but not fog or snow-only codes.
const RAIN_WEATHER_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

// If it's actually raining in Bristol right now, the hero background gets a
// couple of decorative flourishes (see .hero-bg.is-raining in styles.css).
// Checked once on load — this is a bit of weather-reactive fun, not a forecast,
// so it isn't worth polling or refreshing while the page is open.
function initHeroWeather() {
  const hero = document.querySelector('.hero-bg');
  if (!hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const BRISTOL_LAT = 51.4545;
  const BRISTOL_LON = -2.5879;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${BRISTOL_LAT}&longitude=${BRISTOL_LON}` +
    '&current=weather_code&timezone=Europe%2FLondon';

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Weather request failed');
      return response.json();
    })
    .then((data) => {
      if (RAIN_WEATHER_CODES.has(data.current?.weather_code)) {
        hero.classList.add('is-raining');
      }
    })
    .catch(() => {}); // purely decorative — fail silently
}

// Pitch-conditions flip card: starts showing the pitch side, flips to reveal
// the weather widget on click (or Enter/Space, since it's a button).
function initWeatherFlip() {
  const flip = document.getElementById('weather-flip');
  if (!flip) return;

  function toggle() {
    const isFlipped = flip.classList.toggle('is-flipped');
    flip.setAttribute('aria-pressed', String(isFlipped));
  }

  flip.addEventListener('click', toggle);
  flip.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  });
}

// Little mud splats trail the cursor across the pitch-conditions card once
// it's flipped over to the muddy side — purely for fun, so it's skipped
// under reduced motion and throttled by distance so a fast swipe doesn't
// carpet the card in splats.
function initMudSplats() {
  const flip = document.getElementById('weather-flip');
  const card = document.querySelector('.weather-face-front.weather-card');
  if (!flip || !card) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MIN_DISTANCE = 22; // px the pointer must travel before the next splat
  const MAX_SPLATS = 40; // safety cap for a long hover session
  let lastX = null;
  let lastY = null;
  let splats = [];

  function spawnSplat(x, y) {
    const splat = document.createElement('span');
    splat.className = 'mud-splat';
    splat.style.left = `${x}px`;
    splat.style.top = `${y}px`;
    splat.style.setProperty('--splat-rotate', `${Math.random() * 360}deg`);
    splat.style.setProperty('--splat-scale', `${0.75 + Math.random() * 0.5}`);
    splat.addEventListener('animationend', () => splat.remove());
    card.appendChild(splat);
    splats.push(splat);
    if (splats.length > MAX_SPLATS) splats.shift().remove();
  }

  flip.addEventListener('pointermove', (event) => {
    if (!flip.classList.contains('is-flipped')) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    if (lastX !== null && Math.hypot(x - lastX, y - lastY) < MIN_DISTANCE) return;
    lastX = x;
    lastY = y;
    spawnSplat(x, y);
  });

  flip.addEventListener('pointerleave', () => {
    lastX = null;
    lastY = null;
  });
}

function activateCurrentSeasons() {
  const month = new Date().getMonth(); // 0 = January ... 11 = December
  const isSummerActive = month >= 4 && month <= 8; // May - September
  const isWinterActive = month >= 8 || month <= 4; // September - May

  markSeasonActive('season-summer', isSummerActive);
  markSeasonActive('season-winter', isWinterActive);
}

function markSeasonActive(cardId, isActive) {
  if (!isActive) return;
  const card = document.getElementById(cardId);
  if (!card) return;
  card.classList.add('is-current');
  card.querySelector('.now-tag').classList.remove('hidden');
}

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

// Weather-code -> [emoji, description] lookup, per the Open-Meteo WMO code table.
const WEATHER_CODES = {
  0: ['☀️', 'Clear sky'],
  1: ['🌤️', 'Mostly clear'],
  2: ['⛅', 'Partly cloudy'],
  3: ['☁️', 'Overcast'],
  45: ['🌫️', 'Foggy'],
  48: ['🌫️', 'Foggy'],
  51: ['🌦️', 'Light drizzle'],
  53: ['🌦️', 'Drizzle'],
  55: ['🌦️', 'Heavy drizzle'],
  56: ['🌧️', 'Freezing drizzle'],
  57: ['🌧️', 'Freezing drizzle'],
  61: ['🌧️', 'Light rain'],
  63: ['🌧️', 'Rain'],
  65: ['🌧️', 'Heavy rain'],
  66: ['🌧️', 'Freezing rain'],
  67: ['🌧️', 'Freezing rain'],
  71: ['❄️', 'Light snow'],
  73: ['❄️', 'Snow'],
  75: ['❄️', 'Heavy snow'],
  77: ['❄️', 'Snow grains'],
  80: ['🌦️', 'Rain showers'],
  81: ['🌦️', 'Rain showers'],
  82: ['🌧️', 'Heavy showers'],
  85: ['🌨️', 'Snow showers'],
  86: ['🌨️', 'Snow showers'],
  95: ['⛈️', 'Thunderstorm'],
  96: ['⛈️', 'Thunderstorm'],
  99: ['⛈️', 'Thunderstorm'],
};

// "Pitch conditions" weather widget: forecasts conditions for the next game
// day (not just "right now") at whichever venue is in season, plus a
// "mud-o-meter" built from rainfall accumulating up to that day.
function initWeatherWidget() {
  const body = document.getElementById('weather-body');
  const venueLabel = document.getElementById('weather-venue');
  if (!body) return;

  const now = new Date();
  const month = now.getMonth();
  const isSummerSeason = month >= 4 && month <= 8;
  // weekdays: 0 = Sunday ... 6 = Saturday. hour: session start, for picking the forecast hour.
  const venue = isSummerSeason
    ? { name: 'Horfield', lat: 51.4838, lon: -2.5844, weekdays: [3], hour: 18 } // Wednesday
    : { name: 'Clifton Downs', lat: 51.4676, lon: -2.6207, weekdays: [6, 0], hour: 10 }; // Sat or Sun

  const daysAhead = Math.min(...venue.weekdays.map((weekday) => (weekday - now.getDay() + 7) % 7));
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysAhead);
  const targetDateStr = formatLocalDate(targetDate);

  const dayLabel =
    daysAhead === 0
      ? 'Today'
      : targetDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  if (venueLabel) venueLabel.textContent = `${venue.name} · ${dayLabel}`;

  const forecastDays = daysAhead + 1;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${venue.lat}&longitude=${venue.lon}` +
    '&hourly=temperature_2m,weather_code,wind_speed_10m&daily=precipitation_sum' +
    `&past_days=3&forecast_days=${forecastDays}&timezone=Europe%2FLondon&wind_speed_unit=mph`;

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Weather request failed');
      return response.json();
    })
    .then((data) => renderWeather(body, data, targetDateStr, venue.hour))
    .catch(() => {
      body.innerHTML =
        '<p class="weather-status">Couldn&rsquo;t reach the forecast &mdash; check your favourite weather app instead.</p>';
    });
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function renderWeather(body, data, targetDateStr, sessionHour) {
  const targetTime = `${targetDateStr}T${String(sessionHour).padStart(2, '0')}:00`;
  let hourIndex = data.hourly.time.indexOf(targetTime);
  if (hourIndex === -1) hourIndex = data.hourly.time.length - 1; // fallback: last available hour

  const [emoji, description] = WEATHER_CODES[data.hourly.weather_code[hourIndex]] || ['🌈', 'Who knows'];
  const temp = Math.round(data.hourly.temperature_2m[hourIndex]);
  const wind = Math.round(data.hourly.wind_speed_10m[hourIndex]);

  // Mud rating: rainfall over the last 3 days (how wet the ground already is)
  // plus whatever's forecast to fall on game day itself. Requested with
  // past_days=3, so the daily array's first 3 entries are always those days,
  // and its last entry is always game day (forecast_days = daysAhead + 1).
  const past3DaysRain = data.daily.precipitation_sum
    .slice(0, 3)
    .reduce((sum, mm) => sum + (mm || 0), 0);
  const gameDayRain = data.daily.precipitation_sum[data.daily.precipitation_sum.length - 1] || 0;
  const mud = getMudCondition(past3DaysRain + gameDayRain);

  body.innerHTML = `
    <div class="weather-main">
      <span class="weather-emoji">${emoji}</span>
      <span class="weather-temp">${temp}&deg;C</span>
      <span class="weather-desc">${description}</span>
    </div>
    <div class="weather-wind"><span class="icon">💨</span>${wind} mph wind</div>
    <div class="mud-meter">
      <div class="mud-meter-header">
        <span>Mud-o-meter</span>
        <span class="mud-caption">${mud.label}</span>
      </div>
      <div class="mud-bar"><div class="mud-fill" style="width:${mud.percent}%"></div></div>
    </div>
  `;

  const liquid = document.getElementById('mud-liquid');
  if (liquid) liquid.style.height = `${mud.percent}%`;
}

// Rough mud forecast from rainfall (mm) accumulated over the last ~2-3 days.
function getMudCondition(rainMm) {
  if (rainMm < 1) return { percent: 8, label: 'Bone dry — studs optional' };
  if (rainMm < 8) return { percent: 30, label: 'A bit soft underfoot' };
  if (rainMm < 20) return { percent: 65, label: 'Getting squelchy — boots recommended' };
  return { percent: 95, label: 'Full mudbath — bring spare socks' };
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
  const CORRECT_CELLS = [1, 4, 5, 7];
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
      launchConfetti();
      // Delay so the confetti burst is actually seen before focus jumps to the new tab.
      setTimeout(() => window.open(trigger.href, '_blank', 'noopener'), 700);
    } else {
      clearSelection();
      errorMessage.classList.remove('hidden');
    }
  });
}

// Confetti burst played when someone solves the WhatsApp captcha.
function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const COLORS = ['#0f7a44', '#0c5f36', '#7a4a0f', '#f59e0b', '#ecfdf3', '#ffffff'];
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    size: 6 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speedY: 2 + Math.random() * 3,
    speedX: (Math.random() - 0.5) * 2,
    rotation: Math.random() * 360,
    spin: (Math.random() - 0.5) * 10,
  }));

  const duration = 2600;
  const start = performance.now();
  let rafId = null;

  // requestAnimationFrame gets throttled (or paused entirely) once the tab is
  // backgrounded, which happens almost immediately after window.open() below
  // steals focus — so cleanup can't rely on the animation loop reaching its
  // natural end. This timeout guarantees the canvas is removed regardless.
  const cleanupTimer = setTimeout(cleanup, duration + 400);

  function cleanup() {
    clearTimeout(cleanupTimer);
    if (rafId !== null) cancelAnimationFrame(rafId);
    canvas.remove();
  }

  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach((piece) => {
      piece.y += piece.speedY;
      piece.x += piece.speedX;
      piece.rotation += piece.spin;

      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate((piece.rotation * Math.PI) / 180);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
      ctx.restore();
    });

    if (elapsed < duration) {
      rafId = requestAnimationFrame(frame);
    } else {
      cleanup();
    }
  }

  rafId = requestAnimationFrame(frame);
}
