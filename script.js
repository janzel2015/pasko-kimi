// =====================================
// MOBILE NAVIGATION
// =====================================
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// =====================================
// HELP BUTTON / TOAST
// =====================================
const toast = document.getElementById('toast');
const helpButton = document.getElementById('helpButton');
let toastTimer;

if (toast && helpButton) {
  helpButton.addEventListener('click', () => {
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  });
}

// =====================================
// FAQ ACCORDION
// =====================================
document.querySelectorAll('.faq-list details').forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      document.querySelectorAll('.faq-list details').forEach(other => {
        if (other !== item) other.open = false;
      });
    }
  });
});

// =====================================
// CHRISTMAS TEMPLATE CAROUSEL
// =====================================
const track = document.querySelector('.template-track');
const slides = [...document.querySelectorAll('.template-slide')];
const dotsContainer = document.querySelector('.slide-dots');
const nextButton = document.querySelector('.next');
const prevButton = document.querySelector('.prev');

if (track && slides.length && dotsContainer) {
  slides.forEach((slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to Christmas style ${index + 1}`);
    dot.addEventListener('click', () => {
      const trackRect = track.getBoundingClientRect();
      const slideRect = slide.getBoundingClientRect();
      const target = track.scrollLeft + slideRect.left - trackRect.left - (track.clientWidth - slideRect.width) / 2;
      track.scrollTo({ left: target, behavior: 'smooth' });
    });
    dotsContainer.appendChild(dot);
  });

  const dots = [...dotsContainer.children];

  function updateDots() {
    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + track.clientWidth / 2;
    let activeIndex = 0;
    let shortestDistance = Infinity;
    slides.forEach((slide, index) => {
      const rect = slide.getBoundingClientRect();
      const slideCenter = rect.left + rect.width / 2;
      const distance = Math.abs(center - slideCenter);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        activeIndex = index;
      }
    });
    dots.forEach((dot, index) => {
      const active = index === activeIndex;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      track.scrollBy({ left: slides[0].offsetWidth + gap, behavior: 'smooth' });
    });
  }
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      track.scrollBy({ left: -(slides[0].offsetWidth + gap), behavior: 'smooth' });
    });
  }

  track.addEventListener('scroll', updateDots, { passive: true });
  window.addEventListener('resize', updateDots);
  updateDots();
}

// =====================================
// SUPABASE SETUP
// =====================================
let sb = null;
if (window.APP_CONFIG && window.supabase) {
  sb = supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY);
}

// =====================================
// CHECKOUT STATE
// =====================================
let selectedTpl = { name: 'Binibining Gabi ❤️', prompt: 'elegant Christmas portrait, festive glow, Filipino family' };
let selectedPlan = { code: 'P99', price: 99, label: 'Basic Magic — ₱99 — No Music' };
let selectedPay = 'GCash';
let photoFile = null;
let proofFile = null;

const TPL_PROMPTS = {
  'Binibining Gabi ❤️': 'elegant Christmas portrait, festive glow, Filipino family',
  'Sweater Weather 🎄': 'cozy Christmas sweaters, warm indoor scene, snow outside',
  'Bright Celebration ⭐': 'bright colorful Christmas celebration, confetti, joyful',
  'Traditional / Bahay Kubo 🏡': 'Filipino bahay kubo Christmas, parol lanterns, rustic',
  'Christmas Elegance ✨': 'classic holiday glamour, elegant outfit, Christmas tree lights',
};

// =====================================
// STEP NAVIGATION (called by onclick="goStep(n)")
// =====================================
function goStep(n) {
  document.querySelectorAll('.order-step').forEach(s =>
    s.classList.toggle('active', s.dataset.step === String(n)));
  document.querySelectorAll('#stepper span').forEach(s =>
    s.classList.toggle('active', s.dataset.step === String(n)));
}

// =====================================
// PHOTO UPLOAD PREVIEW
// =====================================
const pi = document.getElementById('photoInput');
if (pi) {
  pi.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    photoFile = f;
    const r = new FileReader();
    r.onload = (ev) => {
      const img = document.getElementById('previewImg');
      img.src = ev.target.result;
      img.style.display = 'block';
      document.getElementById('photoName').textContent = 'Uploaded: ' + f.name;
    };
    r.readAsDataURL(f);
  });
}

// =====================================
// PROOF UPLOAD
// =====================================
const proofInput = document.getElementById('proofInput');
if (proofInput) {
  proofInput.addEventListener('change', (e) => {
    proofFile = e.target.files[0] || null;
    const el = document.getElementById('proofName');
    if (el) el.textContent = proofFile ? 'Proof: ' + proofFile.name : '';
  });
}

// =====================================
// TEMPLATE PICKER
// =====================================
document.querySelectorAll('#tplGrid button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#tplGrid button').forEach(x => x.classList.remove('selected'));
  b.classList.add('selected');
  selectedTpl = { name: b.dataset.tpl, prompt: TPL_PROMPTS[b.dataset.tpl] || b.dataset.tpl };
  document.getElementById('tplPicked').textContent = 'Selected: ' + selectedTpl.name;
}));

// =====================================
// PLAN PICKER
// =====================================
document.querySelectorAll('.pay-opt').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.pay-opt').forEach(x => x.classList.remove('selected'));
  b.classList.add('selected');
  selectedPlan = {
    code: b.dataset.price === '99' ? 'P99' : 'P149',
    price: parseInt(b.dataset.price, 10),
    label: b.dataset.plan,
  };
}));

// =====================================
// PAYMENT METHOD PICKER
// =====================================
document.querySelectorAll('#payMethods button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#payMethods button').forEach(x => x.classList.remove('selected'));
  b.classList.add('selected');
  selectedPay = b.textContent.trim();
}));

// =====================================
// SUBMIT ORDER (called by onclick="submitOrder()")
// =====================================
async function submitOrder() {
  const errEl = document.getElementById('orderError');
  const btn = document.getElementById('submitBtn');
  if (errEl) errEl.textContent = '';

  if (!sb) {
    if (errEl) errEl.textContent = 'Config missing — check config.js.';
    return;
  }
  const name = (document.getElementById('custName')?.value || '').trim();
  const ref = (document.getElementById('custRef')?.value || '').trim();
  if (!name) { if (errEl) errEl.textContent = 'Please enter your name.'; return; }
  if (!photoFile) { if (errEl) errEl.textContent = 'Please upload a photo first.'; return; }

  if (btn) { btn.disabled = true; btn.textContent = 'Uploading…'; }

  try {
    const photoPath = `uploads/${crypto.randomUUID()}-${photoFile.name}`;
    const { error: upErr } = await sb.storage.from('uploads').upload(photoPath, photoFile);
    if (upErr) throw upErr;

    let proofPath = null;
    if (proofFile) {
      proofPath = `uploads/${crypto.randomUUID()}-${proofFile.name}`;
      const { error: pErr } = await sb.storage.from('uploads').upload(proofPath, proofFile);
      if (pErr) throw pErr;
    }

    const { data, error } = await sb.functions.invoke('submit-order', {
      body: {
        customer_name: name,
        contact: ref || 'GCash ref pending',
        package: selectedPlan.code,
        template_name: selectedTpl.name,
        template_prompt: selectedTpl.prompt,
        photo_path: photoPath,
        payment_proof_path: proofPath,
        payment_method: selectedPay,
      },
    });
    if (error) throw error;

    window.location.href = `success.html?code=${data.code}`;
  } catch (e) {
    if (errEl) errEl.textContent = 'Error: ' + (e.message || e);
    if (btn) { btn.disabled = false; btn.textContent = 'Submit for Verification →'; }
  }
}

// =====================================
// PRE-SELECT PLAN FROM URL (?plan=99 / ?plan=149)
// =====================================
(function () {
  const p = new URLSearchParams(location.search).get('plan');
  if (p) {
    document.querySelectorAll('.pay-opt').forEach(b => {
      if (b.dataset.price === p) b.click();
    });
  }
  if (location.pathname.includes('checkout')) goStep(1);
})();

// =====================================
// SUCCESS PAGE — LIVE STATUS POLLING
// =====================================
(function () {
  const el = document.getElementById('orderSummary');
  if (!el) return;
  const code = new URLSearchParams(location.search).get('code');
  if (!code) { el.textContent = 'No order code found.'; return; }
  if (!sb) { el.textContent = 'Config missing.'; return; }

  async function refresh() {
    const { data, error } = await sb.functions.invoke('order-status', { body: { code } });
    if (error || !data) {
      el.innerHTML = `<b>Order code:</b> ${code}<br>Status: <span class="status-badge error">Not found</span>`;
      return;
    }
    const statusLabel = {
      pending: '⏳ Waiting for payment verification',
      approved: '✅ Payment approved — generating your images',
      generating: '🎨 Creating your Christmas portraits',
      completed: `🎁 Ready! <a href="${window.APP_CONFIG.DELIVERY_BASE}/deliver.html?code=${code}">Open delivery page</a>`,
      rejected: '❌ Order rejected — contact us',
    }[data.status] || data.status;

    el.innerHTML = `
      <b>Order code:</b> ${code}<br>
      <b>Package:</b> ${data.package}<br>
      <b>Status:</b> <span class="status-badge">${statusLabel}</span>
    `;
  }
  refresh();
  setInterval(refresh, 15000);
})();

// =====================================
// DELIVERY PAGE — access code unlock
// =====================================
(function () {
  const gate = document.getElementById('accessGate');
  if (!gate) return;
  const code = new URLSearchParams(location.search).get('code');
  if (!code) { gate.innerHTML = 'Missing order code.'; return; }
  if (!sb) { gate.innerHTML = 'Config missing.'; return; }

  const btn = document.getElementById('unlockBtn');
  const input = document.getElementById('accessInput');
  const err = document.getElementById('accessError');

  if (btn) {
    btn.addEventListener('click', async () => {
      err.textContent = '';
      const access = (input.value || '').trim().toUpperCase();
      if (!access) return;

      const { data, error } = await sb.functions.invoke('deliver', { body: { code, access } });
      if (error || !data?.images) { err.textContent = 'Invalid access code.'; return; }

      document.getElementById('accessGate').style.display = 'none';
      const gallery = document.getElementById('deliveryGallery');
      gallery.style.display = 'grid';
      data.images.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        gallery.appendChild(img);
      });
      if (data.package === 'P149' && data.slideshow_url) {
        document.getElementById('mp4Area').style.display = 'block';
        document.getElementById('mp4Link').href = data.slideshow_url;
      }
    });
  }
})();
