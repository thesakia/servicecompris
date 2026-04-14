/* =============================================
   SERVICE COMPRIS — Slider + interactions
   ============================================= */

const TOTAL = 12;
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
function loadProspectPhoto(url) {
  const src = url || document.getElementById('photoUrl').value.trim();
  if (!src) return;
  const img         = document.getElementById('prospectImg');
  const placeholder = document.getElementById('phEmpty');
  img.src = src;
  img.style.display = 'block';
  placeholder.style.display = 'none';
  img.onerror = () => {
    img.style.display = 'none';
    placeholder.style.display = 'flex';
    const p = placeholder.querySelector('p');
    if (p) p.textContent = 'Image inaccessible. Vérifiez l\'URL.';
  };
}

/* Validation au clavier dans le champ URL (si présent) */
const photoUrlEl = document.getElementById('photoUrl');
if (photoUrlEl) {
  photoUrlEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadProspectPhoto();
    e.stopPropagation();
  });
}

/* ── Chargement prospect depuis PocketBase ── */
async function loadProspect() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return;
  try {
    const r = await fetch(`https://pb.servicecompris.pro/api/collections/prospects/records/${id}`);
    if (!r.ok) return;
    const p = await r.json();
    if (p.photo_url) {
      document.getElementById('photoUrl').value = p.photo_url;
      loadProspectPhoto(p.photo_url);
    }
    if (p.nom) {
      const h2 = document.querySelector('.s2-inner h2');
      if (h2) h2.innerHTML = `Voici comment <strong>${p.nom}</strong><br>est perçu en ligne aujourd'hui.`;
    }
    if (p.photo_galerie) {
      const screenshot = document.querySelector('.site-screenshot');
      const placeholder = document.querySelector('.screenshot-placeholder');
      if (screenshot) {
        screenshot.src = p.photo_galerie;
        screenshot.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
      }
    }
    [1,2,3].forEach(i => {
      const url = p[`photo_rs_${i}`];
      const wrap = document.getElementById(`rsImg${i}`);
      if (url && wrap) {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'rs-photo';
        img.alt = '';
        wrap.appendChild(img);
        wrap.classList.add('rs-img-has-photo');
      }
    });
  } catch(e) { /* silencieux */ }
}

/* ── Slide 13 : sélectionner un pack ── */
function selectPack(btn, pack) {
  document.querySelectorAll('.pack-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const link = document.getElementById('stripeLink');
  if (link && STRIPE[pack]) link.href = STRIPE[pack];
}

/* ── Init ── */
goTo(0);
loadProspect();
