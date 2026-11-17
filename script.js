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
// SUBMIT ORDER (Generates Pre-Link)
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
    // 1. Upload photo to Supabase Storage (Bucket: uploads)
    const cleanPhotoName = photoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const photoPath = `${crypto.randomUUID()}-${cleanPhotoName}`;
    
    const { error: upErr } = await sb.storage.from('uploads').upload(photoPath, photoFile);
    if (upErr) throw upErr;

    // 2. Upload proof (if provided)
    let proofPath = null;
    if (proofFile) {
      const cleanProofName = proofFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      proofPath = `${crypto.randomUUID()}-${cleanProofName}`;
      
      const { error: pErr } = await sb.storage.from('uploads').upload(proofPath, proofFile);
      if (pErr) throw pErr;
    }

    // 3. Generate Order Code & Secret Token for Pre-Link
    const orderCode = 'PK-' + Math.floor(1000 + Math.random() * 9000);
    const deliveryToken = crypto.randomUUID(); // Secret token

    // 4. Insert directly into Supabase DB
    const { error: dbErr } = await sb.from('orders').insert({
      order_code: orderCode,
      delivery_token: deliveryToken,
      customer_name: name,
      contact_info: ref || 'GCash ref pending',
      package: selectedPlan.code,
      photo_url: photoPath,
      payment_proof_url: proofPath,
      status: 'pending'
    });
    if (dbErr) throw dbErr;

    // 5. Redirect to success page
    window.location.href = `success.html?code=${orderCode}&token=${deliveryToken}`;
    
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
// SUCCESS PAGE — Show Pre-Link & Live Status
// =====================================
(function () {
  const el = document.getElementById('orderSummary');
  if (!el) return; // Only runs on success.html
  
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const token = params.get('token');
  
  if (!code || !token) { el.innerHTML = '<p>Missing order details.</p>'; return; }
  if (!sb) { el.innerHTML = '<p>Config missing.</p>'; return; }

  // Generate the Pre-Link
  const preLink = `${window.location.origin}/delivery.html?code=${code}&token=${token}`;

  // Render the initial UI
  el.innerHTML = `
    <div style="font-size: 50px; margin-bottom: 10px;">🎄</div>
    <h2 style="font-family: var(--serif); color: var(--green); margin-bottom: 5px;">Salamat!</h2>
    <p style="color: var(--muted); margin-bottom: 20px;">Your order <b>#${code}</b> has been received.</p>
    
    <div class="status-badge" id="statusBadge">⏳ Waiting for payment verification</div>

    <div class="pre-link-box active" id="preLinkBox">
      <h3 style="margin-top: 0; color: var(--green); font-size: 18px;">🔗 Your Magic Link</h3>
      <p style="font-size: 13px; margin-bottom: 15px;">Save this link! When Admin approves your order, it will auto-download your photos.</p>
      <input type="text" class="link-input" id="preLinkInput" value="${preLink}" readonly>
      <button class="btn-copy" id="copyBtn" onclick="copyPreLink()">📋 Copy My Link</button>
    </div>

    <div class="steps-list">
      <b>What happens next?</b><br>
      1. We verify your GCash payment.<br>
      2. Admin generates your 5 Christmas photos.<br>
      3. Open your saved link to download!
    </div>

    <p style="margin-top: 20px; font-size: 12px; color: #999;">
      Need help? Send us a message on Facebook.
    </p>
  `;

  // Poll to update the status text
  async function checkStatus() {
    const { data } = await sb.from('orders').select('status').eq('order_code', code).single();
    if (!data) return;

    const badge = document.getElementById('statusBadge');
    if (!badge) return;

    if (data.status === 'pending') {
      badge.className = 'status-badge';
      badge.innerText = '⏳ Waiting for payment verification';
    } else if (data.status === 'approved') {
      badge.className = 'status-badge approved';
      badge.innerText = '✅ Payment approved — Admin is creating your photos';
    } else if (data.status === 'completed') {
      badge.className = 'status-badge completed';
      badge.innerText = '🎁 Ready! Click your Magic Link above to download.';
    } else if (data.status === 'rejected') {
      badge.className = 'status-badge rejected';
      badge.innerText = '❌ Order rejected — Please contact us.';
    }
  }

  // Initial check and set interval
  checkStatus();
  setInterval(checkStatus, 10000);
})();

// Copy to clipboard function (Global so the onclick works)
window.copyPreLink = function() {
  const input = document.getElementById('preLinkInput');
  const btn = document.getElementById('copyBtn');
  
  input.select();
  input.setSelectionRange(0, 99999); // For mobile
  
  navigator.clipboard.writeText(input.value).then(() => {
    btn.innerText = '✅ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerText = '📋 Copy My Link';
      btn.classList.remove('copied');
    }, 3000);
  }).catch(() => {
    alert('Please manually copy the link above.');
  });
};

// =====================================
// DELIVERY PAGE — Auto-Download Polling
// =====================================
(function () {
  const container = document.getElementById('deliveryContainer');
  if (!container) return; // Only runs on delivery.html
  
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const token = params.get('token');
  
  if (!code || !token) { container.innerHTML = 'Missing order details.'; return; }
  if (!sb) { container.innerHTML = 'Config missing.'; return; }

  let hasDownloaded = false;

  async function checkStatus() {
    const { data, error } = await sb
      .from('orders')
      .select('status, final_file_url')
      .eq('order_code', code)
      .eq('delivery_token', token)
      .single();

    if (error || !data) {
      container.innerHTML = '<h2>❌ Invalid or expired link.</h2>';
      return;
    }

    if (data.status === 'pending' || data.status === 'approved') {
      container.innerHTML = `
        <div style="text-align:center; padding: 50px 20px;">
          <h2>Fetching your Christmas Magic...</h2>
          <p>Status: ${data.status === 'pending' ? 'Waiting for Admin Approval' : 'Admin is preparing your photos'}</p>
          <p style="color:#666; font-size:14px;">We are checking automatically every 5 seconds.</p>
        </div>
      `;
      setTimeout(checkStatus, 5000);
      return;
    }

    if (data.status === 'completed' && data.final_file_url) {
      if (hasDownloaded) return;
      hasDownloaded = true;

      container.innerHTML = `
        <div style="text-align:center; padding: 50px 20px;">
          <h2>🎉 Your photos are ready!</h2>
          <p>Your download should have started automatically.</p>
          <a href="${data.final_file_url}" style="display:inline-block; background:#075b3d; color:white; padding:15px 30px; border-radius:30px; text-decoration:none; font-weight:bold; margin-top:20px;">
            ⬇ Click here if it didn't download
          </a>
        </div>
      `;
      
      // Trigger Auto-Download
      const a = document.createElement('a');
      a.href = data.final_file_url;
      a.download = `Pasko-Memories-${code}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  checkStatus();
})();
