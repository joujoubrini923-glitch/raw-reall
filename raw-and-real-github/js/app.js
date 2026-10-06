/* RAW & REAL — shared front-end logic
   Works in two modes:
   1) With server.js running  -> orders go to the server (data/orders.json)
   2) Opened as plain files   -> orders fall back to the browser's localStorage */

/* ==== ORDER NOTIFICATIONS (GitHub Pages / any static host) ==================
   GitHub Pages cannot receive forms. To get every order by EMAIL for free:
   1) Create a free form at https://formspree.io  (or https://web3forms.com)
   2) Paste the endpoint below, e.g. 'https://formspree.io/f/abcdwxyz'
   Leave empty '' if you deploy on Netlify (Netlify Forms is used automatically). */
const FORM_ENDPOINT = '';

const RR = (() => {
  // ---- Product catalogue (fallback copy; server version in data/products.json wins when available)
  const PRODUCTS = [
    {
      id: 'sfax-tee',
      name: 'SFAX — Heritage Tee',
      tagline: 'The city of grandeur and antiquity',
      price: 59, currency: 'TND', badge: 'Drop 01',
      description: 'Our first drop pays tribute to Sfax. Oversized, heavyweight black tee with “صفاقس” in hand-drawn Arabic calligraphy on the chest, and the legendary Bab Diwan gate of the Medina framed in gold olive branches on the back. For those who embrace the raw and stay real.',
      details: ['100% premium heavyweight cotton (240 gsm)', 'Oversized boxy fit, drop shoulders', 'High-density screen print — front & back', 'Pre-shrunk, ribbed crew neck', 'Designed & printed in Sfax, Tunisia'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      images: ['img/hero-main.jpg', 'img/flat-main.jpg', 'img/model-3-main.jpg', 'img/model-2-main.jpg', 'img/model-4-main.jpg', 'img/look-1-main.jpg']
    }
  ];

  const isServer = location.protocol.startsWith('http');
  const LS = 'rr_orders';

  async function getProducts() {
    if (isServer) { try { const r = await fetch('api/products'); if (r.ok) return await r.json(); } catch (e) {} }
    return PRODUCTS;
  }

  async function submitOrder(data) {
    if (isServer) {
      try {
        const r = await fetch('api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if ((r.headers.get('content-type') || '').includes('application/json')) {
          const j = await r.json();
          if (!r.ok) throw new Error(j.error || 'Error');
          return j;
        }
      } catch (e) { if (e instanceof Error && !/fetch|network/i.test(e.message)) throw e; }
    }
    // Formspree / Web3Forms endpoint (works on GitHub Pages)
    if (FORM_ENDPOINT) {
      try { await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ ...data, _subject: 'New Raw & Real order' }) }); } catch (e) {}
    }
    // Netlify Forms (static hosting, no database): orders also land in the Netlify dashboard + email notifications
    try {
      if (isServer && !/localhost|127\.0\.0\.1/.test(location.hostname)) {
        const body = new URLSearchParams({ 'form-name': 'order', ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? '')])) });
        await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
      }
    } catch (e) {}
    // local fallback (browser storage)
    const products = await getProducts();
    const p = products.find(x => x.id === data.productId) || products[0];
    const qty = Math.max(1, parseInt(data.qty) || 1);
    const order = { id: 'RR-' + Date.now().toString(36).toUpperCase(), createdAt: new Date().toISOString(), productId: p.id, productName: p.name, price: p.price, size: data.size, qty, total: p.price * qty, name: data.name, age: data.age, city: data.city, email: data.email, phone: data.phone || '', note: data.note || '', status: 'new' };
    const all = JSON.parse(localStorage.getItem(LS) || '[]'); all.unshift(order); localStorage.setItem(LS, JSON.stringify(all));
    return { ok: true, id: order.id, local: true };
  }

  // ---- UI helpers
  function nav(active) {
    const links = [['index.html', 'Home'], ['shop.html', 'Shop'], ['product.html', 'The Drop'], ['about.html', 'About'], ['order.html', 'Order']];
    return `<header class="nav"><div class="wrap">
      <a class="brand" href="index.html"><img src="img/logo.png" alt="Raw & Real"><span>Raw <em>&</em> Real</span></a>
      <nav class="nav-links" id="navLinks">${links.map(([h, t]) => `<a href="${h}" class="${active === h ? 'active' : ''}">${t}</a>`).join('')}
        <a href="https://www.instagram.com/raw_and_real2" target="_blank" rel="noopener">Instagram</a>
        <a href="admin.html" class="admin-link ${active === 'admin.html' ? 'active' : ''}">Admin</a></nav>
      <a class="btn btn-gold btn-sm" href="order.html">Order now</a>
      <button class="burger" onclick="document.getElementById('navLinks').classList.toggle('open')" aria-label="Menu">☰</button>
    </div></header>`;
  }
  function footer() {
    return `<footer><div class="wrap">
      <div class="fgrid-foot">
        <div><a class="brand" href="index.html"><img src="img/logo.png" alt=""><span>Raw <em>&</em> Real</span></a>
          <p>For those who embrace the raw and stay real. Premium streetwear designed and printed in Sfax, Tunisia.</p></div>
        <div><h4>Shop</h4><ul><li><a href="shop.html">All articles</a></li><li><a href="product.html">Sfax Heritage Tee</a></li><li><a href="order.html">Place an order</a></li></ul></div>
        <div><h4>Brand</h4><ul><li><a href="about.html">Our story</a></li><li><a href="index.html#lookbook">Lookbook</a></li><li><a href="https://www.instagram.com/raw_and_real2" target="_blank" rel="noopener">@raw_and_real2</a></li></ul></div>
        <div><h4>Contact</h4><ul><li>📍 Sfax, Tunisia</li><li>Cash on delivery</li><li>Delivery all over Tunisia</li></ul></div>
      </div>
      <div class="copy"><span>© ${new Date().getFullYear()} Raw & Real. All rights reserved.</span><span><a href="admin.html" style="opacity:.5">Admin</a></span></div>
    </div></footer>
    <div class="toast" id="toast"></div>`;
  }
  // ---- Page transitions (curtain wipe between pages)
  function transitions() {
    document.body.insertAdjacentHTML('beforeend', '<div class="pt-curtain enter" id="ptCurtain"><i></i><i></i><i></i><i></i></div><div class="pt-logo" id="ptLogo"><img src="img/logo.png" alt=""></div>');
    const c = document.getElementById('ptCurtain'), l = document.getElementById('ptLogo');
    requestAnimationFrame(() => requestAnimationFrame(() => { c.classList.add('go'); setTimeout(() => c.classList.remove('enter', 'go'), 900); }));
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) return;
      const same = href.split('#')[0] === location.pathname.split('/').pop().split('#')[0];
      if (same && href.includes('#')) return;
      e.preventDefault();
      c.classList.add('leave'); l.classList.add('show');
      setTimeout(() => { location.href = href; }, 720);
    });
    window.addEventListener('pageshow', e => { if (e.persisted) { c.className = 'pt-curtain'; l.classList.remove('show'); } });
  }
  function mount(active) {
    document.body.insertAdjacentHTML('afterbegin', nav(active));
    transitions();
    document.body.insertAdjacentHTML('beforeend', footer());
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .1 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }
  function toast(t) { const el = document.getElementById('toast'); el.textContent = t; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2600); }
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  return { PRODUCTS, isServer, LS, getProducts, submitOrder, mount, transitions, toast, esc };
})();
