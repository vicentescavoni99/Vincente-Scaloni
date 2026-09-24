/* ============================================================
   search.js — autocomplete da busca no header
   ============================================================ */

function wireSearch(inputSelector, suggestSelector, formSelector) {
  const input = document.querySelector(inputSelector);
  const suggestBox = document.querySelector(suggestSelector);
  const form = document.querySelector(formSelector);
  if (!input || !suggestBox) return;

  let debounceTimer;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const term = input.value.trim().toLowerCase();
    if (term.length < 2) { suggestBox.classList.remove("is-open"); return; }
    debounceTimer = setTimeout(async () => {
      const products = await loadProducts();
      const matches = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      ).slice(0, 6);
      renderSuggestions(suggestBox, matches, term);
    }, 180);
  });

  document.addEventListener("click", (e) => {
    if (!suggestBox.contains(e.target) && e.target !== input) {
      suggestBox.classList.remove("is-open");
    }
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const term = input.value.trim();
      const shopHref = (window.ASSET_BASE === "" ? "pages/" : "") + "loja.html";
      window.location.href = shopHref + (term ? "?q=" + encodeURIComponent(term) : "");
    });
  }
}

function renderSuggestions(box, matches, term) {
  const shopHref = (window.ASSET_BASE === "" ? "pages/" : "") + "loja.html";
  const productHref = (window.ASSET_BASE === "" ? "pages/" : "") + "produto.html?id=";
  if (!matches.length) {
    box.innerHTML = `<div class="search-suggest__empty">Não encontramos resultados para "${escapeHtml(term)}"</div>`;
    box.classList.add("is-open");
    return;
  }
  box.innerHTML = matches.map(p => `
    <a class="search-suggest__item" href="${productHref}${p.id}">
      <img src="${getImagePath(p)}" alt="">
      <span>
        <span class="name">${escapeHtml(p.name)}</span><br>
        <span class="cat">${escapeHtml(p.category)} · ${formatBRL(p.price)}</span>
      </span>
    </a>`).join("") +
    `<a class="search-suggest__footer" href="${shopHref}?q=${encodeURIComponent(term)}">Ver todos os resultados</a>`;
  box.classList.add("is-open");
}
