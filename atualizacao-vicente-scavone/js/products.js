/* ============================================================
   products.js — carrega products.json, renderiza cards, filtra/ordena
   ============================================================ */

let PRODUCTS_CACHE = null;

/* compara textos sem se importar com maiúsculas/acentos: "HORMÔNIOS" == "Hormônios" */
function normText(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/* imagem de reserva: se a foto do produto não carregar, mostra isto em vez do texto alternativo gigante */
const PRODUCT_PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#FAF6F5"/>' +
  '<g fill="none" stroke="#DC0105" stroke-width="6" stroke-linecap="round" opacity=".55">' +
  '<rect x="62" y="70" width="76" height="80" rx="12"/><path d="M80 70V52h40v18M100 92v36M82 110h36"/></g></svg>');

async function loadProducts() {
  if (PRODUCTS_CACHE) return PRODUCTS_CACHE;
  try {
    const res = await fetch(window.ASSET_BASE + "products.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    PRODUCTS_CACHE = await res.json();
  } catch (e) {
    console.warn("Não foi possível carregar products.json:", e);
    return [];          // sem cache: tenta de novo na próxima chamada
  }
  return PRODUCTS_CACHE;
}

/* link do WhatsApp para um produto específico */
function productWhatsAppUrl(p, qty = 1) {
  return whatsappLink(`Olá! Vim pelo site da ${STORE_NAME} e tenho interesse em: ${qty}x ${p.name} (${formatBRL(p.price)}). Podem me ajudar?`);
}

/* botão principal do card: com carrinho (loja) ou direto no WhatsApp (home) */
function productActionHtml(p, cls, after = "") {
  if (!p.stock) return `<button type="button" class="btn ${cls}" disabled>Sem estoque</button>`;
  if (window.CART_ENABLED === false) {
    return `<a class="btn ${cls}" href="${productWhatsAppUrl(p)}" target="_blank" rel="noopener">${icon("whatsapp")} Pedir no WhatsApp</a>`;
  }
  return `<button type="button" class="btn ${cls}" onclick="addToCart(${p.id}, 1);${after} return false;">Adicionar ao carrinho</button>`;
}

function getImagePath(product) {
  return window.ASSET_BASE === "" ? product.imageRoot : product.image;
}

function productCardHtml(p) {
  const img = getImagePath(p);
  const link = (window.ASSET_BASE === "" ? "pages/" : "") + "produto.html?id=" + p.id;
  const badges = [];
  if (p.discount) badges.push(`<span class="badge badge--offer">-${p.discount}%</span>`);
  if (!p.stock) badges.push(`<span class="badge badge--out">Sem estoque</span>`);
  if (p.requiresPrescription) badges.push(`<span class="badge badge--rx">Rx</span>`);

  return `
  <article class="product-card" data-id="${p.id}">
    <a href="${link}" class="product-card__media" aria-label="Ver ${escapeHtml(p.name)}">
      <div class="product-card__badges">${badges.join("")}</div>
      <img src="${img}" alt="${escapeHtml(p.name)}" loading="lazy" width="360" height="360" onerror="this.onerror=null;this.src=PRODUCT_PLACEHOLDER">
      <div class="product-card__quickview">
        <button type="button" onclick="openQuickView(${p.id}); return false;">Visualização rápida</button>
      </div>
    </a>
    <div class="product-card__body">
      <span class="product-card__cat">${escapeHtml(p.category)}</span>
      <a href="${link}" class="product-card__name">${escapeHtml(p.name)}</a>
      <span class="rating"><span class="stars">${starString(p.rating)}</span> ${p.rating} (${p.reviews})</span>
      <div class="product-card__prices">
        <span class="price">${formatBRL(p.price)}</span>
        ${p.oldPrice ? `<span class="price--old">${formatBRL(p.oldPrice)}</span>` : ""}
      </div>
      <div class="product-card__footer">
        ${productActionHtml(p, "btn-primary btn-block btn-sm")}
      </div>
    </div>
  </article>`;
}

function renderProductGrid(container, products) {
  if (!products.length) {
    container.innerHTML = `<div class="empty-state"><h3>Não encontramos produtos</h3><p>Tente ajustar os filtros ou buscar outro termo.</p></div>`;
    return;
  }
  container.innerHTML = products.map(productCardHtml).join("");
}

function sortProducts(list, mode) {
  const arr = [...list];
  switch (mode) {
    case "price-asc": return arr.sort((a, b) => a.price - b.price);
    case "price-desc": return arr.sort((a, b) => b.price - a.price);
    case "best": return arr.sort((a, b) => b.reviews - a.reviews);
    case "new": return arr.sort((a, b) => b.id - a.id);
    default: return arr;
  }
}

/* ---------- vista rápida (modal) ---------- */
async function openQuickView(id) {
  const products = await loadProducts();
  const p = products.find(x => x.id === id);
  if (!p) return;
  let backdrop = document.getElementById("quickview-modal");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "quickview-modal";
    backdrop.className = "modal-backdrop";
    document.body.appendChild(backdrop);
    wireModalTriggers();
  }
  const img = getImagePath(p);
  const link = (window.ASSET_BASE === "" ? "pages/" : "") + "produto.html?id=" + p.id;
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="Visualização rápida de ${escapeHtml(p.name)}">
      <button class="modal__close" aria-label="Fechar">${icon("close")}</button>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px;clear:both;padding-top:8px">
        <div style="border-radius:14px;overflow:hidden;background:#fff;border:1px solid var(--color-gray-line);aspect-ratio:1/1">
          <img src="${img}" alt="${escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:contain;padding:12px" onerror="this.onerror=null;this.src=PRODUCT_PLACEHOLDER">
        </div>
        <div>
          <span class="product-card__cat">${escapeHtml(p.category)}</span>
          <h3 style="margin:.2em 0">${escapeHtml(p.name)}</h3>
          <span class="rating"><span class="stars">${starString(p.rating)}</span> ${p.rating} (${p.reviews} avaliações)</span>
          <div class="product-info__price">
            <span class="price">${formatBRL(p.price)}</span>
            ${p.oldPrice ? `<span class="price--old">${formatBRL(p.oldPrice)}</span>` : ""}
          </div>
          <p style="font-size:.88rem;color:var(--color-gray-mute)">${escapeHtml(p.description)}</p>
          <div style="display:flex;gap:10px;margin-top:16px">
            ${productActionHtml(p, "btn-primary", " closeModal();")}
            <a class="btn btn-secondary" href="${link}">Ver detalhes</a>
          </div>
        </div>
      </div>
    </div>`;
  openModal();
}
