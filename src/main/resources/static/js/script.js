/* ==========================================================================
   Kokanya State Tourism — shared front-end behavior
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Mobile nav toggle ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  /* ---------- Mark active nav link ---------- */
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  /* ---------- Back to top ---------- */
  const toTop = document.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', () => {
      toTop.classList.toggle('show', window.scrollY > 500);
    });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Toast helper ---------- */
  window.showToast = (msg) => {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  };

  /* ---------- Live status strip (uptime nod) ---------- */
  const statusTime = document.querySelector('[data-status-time]');
  if (statusTime) {
    const fmt = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    statusTime.textContent = fmt();
    setInterval(() => statusTime.textContent = fmt(), 30000);
  }

  /* ---------- Generic card filter/search (attractions & hotels pages) ---------- */
  const filterBar = document.querySelector('.filter-bar');
  if (filterBar) {
    const searchInput = filterBar.querySelector('input[type="search"]');
    const chips = filterBar.querySelectorAll('.chip');
    const cards = document.querySelectorAll('[data-card]');
    const emptyState = document.querySelector('.empty-state');
    let activeCategory = 'all';

    function applyFilter() {
      const q = (searchInput?.value || '').trim().toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const cat = card.dataset.category || '';
        const text = card.dataset.search || card.textContent.toLowerCase();
        const matchesCat = activeCategory === 'all' || cat === activeCategory;
        const matchesText = !q || text.toLowerCase().includes(q);
        const show = matchesCat && matchesText;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (emptyState) emptyState.classList.toggle('show', visible === 0);
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeCategory = chip.dataset.filter || 'all';
        applyFilter();
      });
    });
    searchInput?.addEventListener('input', applyFilter);
    applyFilter();
  }

  /* ---------- Gallery lightbox ---------- */
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.querySelector('.lightbox');
  if (galleryItems.length && lightbox) {
    const lbFrame = lightbox.querySelector('.lb-frame');
    const lbCap = lightbox.querySelector('.lb-cap');
    let index = 0;
    const items = Array.from(galleryItems);

    function render() {
      const item = items[index];
      lbFrame.innerHTML = item.querySelector('.ph').outerHTML;
      lbCap.textContent = `${item.dataset.caption || ''}  ·  ${index + 1} / ${items.length}`;
    }
    function open(i) { index = i; render(); lightbox.classList.add('open'); }
    function close() { lightbox.classList.remove('open'); }

    items.forEach((item, i) => item.addEventListener('click', () => open(i)));
    lightbox.querySelector('.lb-close')?.addEventListener('click', close);
    lightbox.querySelector('.lb-prev')?.addEventListener('click', () => { index = (index - 1 + items.length) % items.length; render(); });
    lightbox.querySelector('.lb-next')?.addEventListener('click', () => { index = (index + 1) % items.length; render(); });
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') { index = (index + 1) % items.length; render(); }
      if (e.key === 'ArrowLeft') { index = (index - 1 + items.length) % items.length; render(); }
    });
  }

  /* ---------- Form validation helper ---------- */
  function validateForm(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      const wrap = field.closest('.field');
      let ok = field.value.trim() !== '';
      if (field.type === 'email' && ok) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
      if (field.type === 'tel' && ok) ok = /^[0-9+\-\s()]{7,}$/.test(field.value);
      if (!ok) valid = false;
      wrap?.classList.toggle('error', !ok);
    });
    return valid;
  }

  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateForm(form)) {
        const msg = form.dataset.successMessage || 'Submitted successfully.';
        showToast(msg);
        form.reset();
        document.querySelectorAll('.field.error').forEach(f => f.classList.remove('error'));
        const summary = document.querySelector('[data-booking-summary]');
        if (summary) updateBookingSummary();
      } else {
        showToast('Please check the highlighted fields.');
      }
    });
    form.querySelectorAll('input, select, textarea').forEach(f => {
      f.addEventListener('input', () => f.closest('.field')?.classList.remove('error'));
    });
  });

  /* ---------- Booking price calculator ---------- */
  const bookingForm = document.querySelector('#booking-form');
  function updateBookingSummary() {
    if (!bookingForm) return;
    const pkgSelect = bookingForm.querySelector('#package');
    const guestsInput = bookingForm.querySelector('#guests');
    const nightsInput = bookingForm.querySelector('#nights');
    const rate = Number(pkgSelect?.selectedOptions[0]?.dataset.rate || 0);
    const guests = Number(guestsInput?.value || 1);
    const nights = Number(nightsInput?.value || 1);
    const subtotal = rate * guests * nights;
    const taxes = Math.round(subtotal * 0.12);
    const total = subtotal + taxes;

    const fmt = (n) => '₹' + n.toLocaleString('en-IN');
    document.querySelector('[data-sum-package]')?.replaceChildren(document.createTextNode(pkgSelect?.selectedOptions[0]?.text || '—'));
    document.querySelector('[data-sum-subtotal]')?.replaceChildren(document.createTextNode(fmt(subtotal)));
    document.querySelector('[data-sum-taxes]')?.replaceChildren(document.createTextNode(fmt(taxes)));
    document.querySelector('[data-sum-total]')?.replaceChildren(document.createTextNode(fmt(total)));
  }
  if (bookingForm) {
    bookingForm.querySelectorAll('#package, #guests, #nights').forEach(el => el.addEventListener('input', updateBookingSummary));
    updateBookingSummary();
  }

  /* ---------- Newsletter (footer) ---------- */
  document.querySelectorAll('form[data-newsletter]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        showToast('Subscribed! Watch your inbox for travel guides.');
        form.reset();
      } else {
        showToast('Enter a valid email address.');
      }
    });
  });

  /* ---------- Leaflet map (maps.html only) ---------- */
  const mapEl = document.getElementById('map');
  if (mapEl && window.L) {
    const map = L.map('map', { scrollWheelZoom: false }).setView([25.3, 85.2], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    const spots = [
      { name: 'Mahabodhi Temple, Bodh Gaya', type: 'Pilgrimage', coords: [24.6961, 84.9911], color: '#0B4F4A' },
      { name: 'Nalanda Mahavihara', type: 'Heritage', coords: [25.1360, 85.4443], color: '#C1622D' },
      { name: 'Vishnupad Temple, Gaya', type: 'Pilgrimage', coords: [24.7955, 84.9994], color: '#0B4F4A' },
      { name: 'Rajgir Hot Springs', type: 'Nature', coords: [25.0280, 85.4210], color: '#3CCB7F' },
      { name: 'Vaishali Ashokan Pillar', type: 'Heritage', coords: [25.9900, 85.1300], color: '#C1622D' },
      { name: 'Barabar Caves', type: 'Heritage', coords: [25.0016, 85.0656], color: '#C1622D' },
      { name: 'Takht Sri Patna Sahib', type: 'Pilgrimage', coords: [25.6150, 85.1660], color: '#0B4F4A' },
      { name: 'Valmiki Tiger Reserve', type: 'Wildlife', coords: [27.5000, 84.1300], color: '#3CCB7F' },
      { name: 'The Nalanda Residency', type: 'Hotel', coords: [25.1400, 85.4500], color: '#C9A227' },
      { name: 'Magadha Grand, Patna', type: 'Hotel', coords: [25.5941, 85.1376], color: '#C9A227' },
      { name: 'Tourist Facilitation Centre, Patna', type: 'Info', coords: [25.6100, 85.1400], color: '#16233D' }
    ];
    spots.forEach(spot => {
      const marker = L.circleMarker(spot.coords, {
        radius: 8, color: spot.color, fillColor: spot.color, fillOpacity: 0.85, weight: 2
      }).addTo(map);
      marker.bindPopup(`<strong>${spot.name}</strong><br>${spot.type}`);
    });
  }

});
