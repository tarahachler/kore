// ============================================
// KORE. — Main App JS
// ============================================

// ── CART ────────────────────────────────────────────────────────────────────
function getCart() {
  return JSON.parse(localStorage.getItem('kore_cart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('kore_cart', JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount() {
  const cart  = getCart();
  const total = cart.reduce((acc, i) => acc + i.qty, 0);
  document.querySelectorAll('#cart-count').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? '' : 'none';
  });
}
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const cart     = getCart();
  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    // mainImage is a single string set by csv-loader
    cart.push({
      id:       productId,
      name:     product.name,
      subtitle: product.subtitle,
      price:    product.price,
      qty:      1,
      image:    product.mainImage || '',
    });
  }
  saveCart(cart);
  showToast('Added to cart!');
}
function removeFromCart(productId) {
  saveCart(getCart().filter(i => i.id !== productId));
}
function changeQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
}

// ── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg) {
  let toast = document.getElementById('kore-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id        = 'kore-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── PRODUCT IMAGE ─────────────────────────────────────────────────────────────
function imgError(img) {
  img.style.display = 'none';
  const ph = img.nextElementSibling;
  if (ph) ph.style.display = 'flex';
}

function getProductImgHTML(product) {
  const imgFile = product.mainImage || '';
  const placeholder = `<div class="coming-soon-placeholder" style="display:none">
      <span class="cs-icon">⚙️</span>
      <span class="cs-text">In development<br>Coming soon</span>
    </div>`;
  if (imgFile) {
    return `<img
      src="assets/products/${imgFile}"
      alt="${product.name}"
      loading="lazy"
      style="width:100%;height:100%;object-fit:cover;"
      onerror="imgError(this)"
    >${placeholder}`;
  }
  return `<div class="coming-soon-placeholder">
      <span class="cs-icon">⚙️</span>
      <span class="cs-text">In development<br>Coming soon</span>
    </div>`;
}

// ── RENDER PRODUCT CARDS ──────────────────────────────────────────────────────
function renderProducts(containerId, productList, showFreeShip = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = productList.map(p => `
    <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
      <div class="product-img-wrap">
        ${parseFloat(p.price) >= 149.90 ? '<span class="free-shipping-tag">Free Shipping</span>' : ''}
        ${getProductImgHTML(p)}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-subtitle">${p.subtitle}</div>
        <div class="product-price">CHF ${p.price}.-</div>
      </div>
    </div>
  `).join('');
}

// ── ACTIVE NAV ────────────────────────────────────────────────────────────────
function setActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.dataset.page === page) a.classList.add('active');
  });
}

// ── DESIGN PROJECT MODAL ──────────────────────────────────────────────────────
function openDesignModal() {
  document.getElementById('design-modal').classList.add('open');
}
function closeDesignModal() {
  document.getElementById('design-modal').classList.remove('open');
}

// ── INJECT MODAL + TOAST ──────────────────────────────────────────────────────
function injectGlobals() {
  const modal = document.createElement('div');
  modal.id        = 'design-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" onclick="closeDesignModal()">✕</button>
      <div class="modal-title">404.</div>
      <div class="modal-subtitle">This is a design project.</div>
      <p class="modal-text">
        KORE is a fictional brand created as part of a project in the Master Media Design at HEAD — Genève
        (Haute École d'Art et de Design). Everything here is fiction.<br><br>
        If you believed it, ask yourself why.
      </p>
      <p class="modal-school">HEAD — GENÈVE, 2026</p>
      <a href="project.html" class="btn-orange">Project description</a>
    </div>`;
  document.body.appendChild(modal);

  const toast = document.createElement('div');
  toast.id        = 'kore-toast';
  toast.className = 'toast';
  document.body.appendChild(toast);
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectGlobals();
  setActiveNav();
  updateCartCount();
});
