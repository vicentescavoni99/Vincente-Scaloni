/* ============================================================
   cart.js — carrinho por WhatsApp
   - guarda os itens no navegador (localStorage)
   - gaveta lateral com atendimento 24h
   - "Enviar pedido" abre o WhatsApp da farmácia com a lista pronta
   Na home (window.CART_ENABLED === false) o carrinho não existe.
   ============================================================ */

const CART_KEY = "vitanexa_cart_v1";
const CART_ON = () => window.CART_ENABLED !== false;

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function writeCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  renderCartCount();
  renderDrawer();
  document.dispatchEvent(new CustomEvent("cart:updated"));
}

function addToCart(id, qty = 1) {
  const cart = readCart();
  cart[id] = Math.min(20, (cart[id] || 0) + qty);
  writeCart(cart);
  showToast("Produto adicionado ao carrinho");
  openDrawer();
}
function setQty(id, qty) {
  const cart = readCart();
  if (qty <= 0) { delete cart[id]; }
  else { cart[id] = qty; }
  writeCart(cart);
}
function removeFromCart(id) {
  const cart = readCart();
  delete cart[id];
  writeCart(cart);
  showToast("Produto removido do carrinho");
}
function clearCart() {
  writeCart({});
}
function getCartCount() {
  const cart = readCart();
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

async function getCartDetails() {
  const cart = readCart();
  const products = await loadProducts();
  return Object.entries(cart).map(([id, qty]) => {
    const p = products.find(x => x.id === parseInt(id, 10));
    return p ? { ...p, qty } : null;
  }).filter(Boolean);
}

function renderCartCount() {
  const count = getCartCount();
  document.querySelectorAll(".js-cart-count").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

/* ---------- mensagem do pedido para o WhatsApp ---------- */
function buildOrderMessage(items) {
  const lines = items.map(p => `• ${p.qty}x ${p.name} — ${formatBRL(p.price * p.qty)}`);
  const total = items.reduce((s, p) => s + p.price * p.qty, 0);
  return [
    `Olá! Vim pelo site da ${STORE_NAME} e quero fazer um pedido:`,
    "",
    ...lines,
    "",
    `Total estimado: ${formatBRL(total)}`,
    "",
    "Podem confirmar a disponibilidade, o pagamento e a entrega ou retirada?"
  ].join("\n");
}

/* ---------- pedaços de HTML reutilizados na gaveta e na página ---------- */
function cart247Banner() {
  return `<div class="wa-247">
    <span class="wa-247__dot" aria-hidden="true"></span>
    <div>
      <strong>Atendimento 24 horas no WhatsApp</strong>
      <span>Um atendente confirma estoque, valores e entrega.</span>
    </div>
  </div>`;
}

function cartRowHtml(p) {
  return `
    <div class="cart-row" data-id="${p.id}">
      <div class="cart-row__media"><img src="${getImagePath(p)}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src=PRODUCT_PLACEHOLDER"></div>
      <div>
        <div class="cart-row__name">${escapeHtml(p.name)}</div>
        <div class="cart-row__meta">${formatBRL(p.price)} cada</div>
        <div class="cart-row__bottom">
          <div class="cart-qty">
            <button type="button" class="qty-minus" aria-label="Diminuir quantidade">−</button>
            <input type="number" value="${p.qty}" min="1" max="20" aria-label="Quantidade de ${escapeHtml(p.name)}">
            <button type="button" class="qty-plus" aria-label="Aumentar quantidade">+</button>
          </div>
          <span class="cart-row__subtotal">${formatBRL(p.price * p.qty)}</span>
        </div>
        <button type="button" class="cart-row__remove" data-remove="${p.id}">${icon("trash")} Remover</button>
      </div>
    </div>`;
}

function wireCartRows(container) {
  container.querySelectorAll(".cart-row").forEach(row => {
    const id = parseInt(row.dataset.id, 10);
    const input = row.querySelector("input");
    const clamp = v => Math.max(1, Math.min(20, parseInt(v, 10) || 1));
    row.querySelector(".qty-minus").addEventListener("click", () => setQty(id, clamp(input.value) - 1 || 1));
    row.querySelector(".qty-plus").addEventListener("click", () => setQty(id, clamp(input.value) + 1));
    input.addEventListener("change", () => setQty(id, clamp(input.value)));
    row.querySelector("[data-remove]").addEventListener("click", () => removeFromCart(id));
  });
}

/* ---------- gaveta ---------- */
function initCartDrawer() {
  if (!CART_ON()) return;
  let drawer = document.getElementById("cart-drawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "cart-drawer";
    drawer.className = "cart-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Seu carrinho");
    drawer.innerHTML = `
      <div class="cart-drawer__backdrop"></div>
      <div class="cart-drawer__panel">
        <div class="cart-drawer__head">
          <h3>Seu carrinho</h3>
          <button type="button" class="icon-btn" id="cart-drawer-close" aria-label="Fechar carrinho">${icon("close")}</button>
        </div>
        ${cart247Banner()}
        <div class="cart-drawer__items" id="cart-drawer-items"></div>
        <div class="cart-drawer__foot" id="cart-drawer-foot"></div>
      </div>`;
    document.body.appendChild(drawer);
    drawer.querySelector(".cart-drawer__backdrop").addEventListener("click", closeDrawer);
    drawer.querySelector("#cart-drawer-close").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
  }
  document.querySelectorAll(".js-open-cart").forEach(btn => {
    btn.addEventListener("click", (e) => { e.preventDefault(); openDrawer(); });
  });
  renderDrawer();
}
function openDrawer() {
  const d = document.getElementById("cart-drawer");
  if (!d) return;
  d.classList.add("is-open");
  document.body.style.overflow = "hidden";
  const closeBtn = d.querySelector("#cart-drawer-close");
  if (closeBtn) closeBtn.focus();
}
function closeDrawer() {
  const d = document.getElementById("cart-drawer");
  if (d) d.classList.remove("is-open");
  document.body.style.overflow = "";
}

async function renderDrawer() {
  const itemsEl = document.getElementById("cart-drawer-items");
  const footEl = document.getElementById("cart-drawer-foot");
  if (!itemsEl) return;
  const items = await getCartDetails();
  const shopHref = (window.ASSET_BASE === "" ? "pages/" : "") + "loja.html";
  const cartPageHref = (window.ASSET_BASE === "" ? "pages/" : "") + "carrinho.html";

  if (!items.length) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <h3>Seu carrinho está vazio</h3>
        <p>Adicione produtos e envie o pedido pelo WhatsApp, ou fale direto com a gente.</p>
      </div>`;
    footEl.innerHTML = `
      <a class="btn btn-whatsapp btn-block" href="${whatsappLink(`Olá! Vim pelo site da ${STORE_NAME} e gostaria de ajuda.`)}" target="_blank" rel="noopener">${icon("whatsapp")} Falar no WhatsApp agora</a>
      <a class="btn btn-secondary btn-block" href="${shopHref}">Ver produtos</a>`;
    return;
  }

  itemsEl.innerHTML = items.map(cartRowHtml).join("");
  wireCartRows(itemsEl);

  const total = items.reduce((sum, p) => sum + p.price * p.qty, 0);
  footEl.innerHTML = `
    <div class="cart-total"><span>Total estimado</span><strong>${formatBRL(total)}</strong></div>
    <a class="btn btn-whatsapp btn-block" href="${whatsappLink(buildOrderMessage(items))}" target="_blank" rel="noopener">${icon("whatsapp")} Enviar pedido pelo WhatsApp</a>
    <a class="btn btn-secondary btn-block" href="${cartPageHref}">Ver carrinho completo</a>
    <p class="wa-note">Não há pagamento no site. Você combina pagamento e entrega direto com a farmácia.</p>`;
}
