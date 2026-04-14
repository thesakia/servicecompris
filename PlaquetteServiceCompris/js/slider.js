/* =============================================
   SERVICE COMPRIS — Slider + interactions
   ============================================= */

const TOTAL = 13;
let current = 0;

const slidesEl  = document.getElementById('slides');
const dotsEl    = document.getElementById('dots');
const prevBtn   = document.getElementById('prevBtn');
const nextBtn   = document.getElementById('nextBtn');
const counterEl = document.getElementById('counter');
const progFill  = document.getElementById('progFill');

/* Liens de paiement par pack */
const STRIPE = {
  web:    'https://pay.streammate.ai/b/4gM14newLex57ED1Nqc7u01?locale=fr',
  social: 'https://pay.streammate.ai/b/3cI00jbkz60z6Azcs4c7u02?locale=fr',
  combo:  'https://pay.streammate.ai/b/14A9ATgET4Wv8IH8bOc7u00?locale=fr'
};

/* ── Init dots ── */
for (let i = 0; i < TOTAL; i++) {
  const d = document.createElement('button');
  d.className = 'dot' + (i === 0 ? ' active' : '');
  d.setAttribute('aria-label', 'Slide ' + (i + 1));
  d.addEventListener('click', () => goTo(i));
  dotsEl.appendChild(d);
}

/* ── Navigation ── */
function goTo(n) {
  current = Math.max(0, Math.min(TOTAL - 1, n));
  slidesEl.style.transform = `translateX(-${current * 100}vw)`;
  counterEl.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(TOTAL).padStart(2, '0');
  progFill.style.width = ((current + 1) / TOTAL * 100) + '%';
  dotsEl.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === TOTAL - 1;
}

function nextSlide() { goTo(current + 1); }
function prevSlide() { goTo(current - 1); }

/* ── Keyboard ── */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
  if (e.key === 'ArrowLeft')                    { e.preventDefault(); prevSlide(); }
});

/* ── Touch swipe ── */
let tx = 0, ty = 0;
slidesEl.addEventListener('touchstart', e => {
  tx = e.touches[0].clientX;
  ty = e.touches[0].clientY;
}, { passive: true });

slidesEl.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
    dx < 0 ? nextSlide() : prevSlide();
  }
}, { passive: true });

/* ── Slide 02 : charger photo prospect ── */
function loadProspectPhoto() {
  const url = document.getElementById('photoUrl').value.trim();
  if (!url) return;
  const img         = document.getElementById('prospectImg');
  const placeholder = document.getElementById('phEmpty');
  img.src = url;
  img.style.display = 'block';
  placeholder.style.display = 'none';
  img.onerror = () => {
    img.style.display = 'none';
    placeholder.style.display = 'flex';
    const p = placeholder.querySelector('p');
    if (p) p.textContent = 'Image inaccessible. Vérifiez l\'URL.';
  };
}

/* Validation au clavier dans le champ URL */
document.getElementById('photoUrl').addEventListener('keydown', e => {
  if (e.key === 'Enter') loadProspectPhoto();
  e.stopPropagation(); /* empêche la navigation pendant la saisie */
});

/* ── Slide 13 : sélectionner un pack ── */
function selectPack(btn, pack) {
  document.querySelectorAll('.pack-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const link = document.getElementById('stripeLink');
  if (link && STRIPE[pack]) link.href = STRIPE[pack];
}

/* ── Init ── */
goTo(0);
