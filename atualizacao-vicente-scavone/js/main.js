/* ============================================================
   main.js — shared behavior across all pages
   Expects `window.ASSET_BASE` to be set ("" on root, "../" in /pages)
   ============================================================ */

window.ASSET_BASE = window.ASSET_BASE || "";

/* ---------- WhatsApp (único canal de venda: não há pagamento no site) ---------- */
const WHATSAPP_NUMBER = "554591379623";          // +55 45 9137-9623
const STORE_NAME = "Farmácia Vicente Scavone";
function whatsappLink(text) {
  return "https://wa.me/" + WHATSAPP_NUMBER + (text ? "?text=" + encodeURIComponent(text) : "");
}

/* ---------- formatting helpers ---------- */
function formatBRL(value) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function starString(rating) {
  const full = Math.round(rating);
  return "★★★★★☆☆☆☆☆".slice(5 - full, 10 - full);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/* ---------- toasts ---------- */
function showToast(message, type = "success") {
  let region = document.getElementById("toast-region");
  if (!region) {
    region = document.createElement("div");
    region.id = "toast-region";
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }
  const toast = document.createElement("div");
  toast.className = "toast" + (type === "error" ? " toast--error" : "");
  toast.innerHTML = (type === "error" ? "✕ " : "✓ ") + escapeHtml(message);
  region.appendChild(toast);
  setTimeout(() => toast.remove(), 2700);
}

/* ---------- header: scroll shadow + mobile nav ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }, { passive: true });
  }

  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  if (menuToggle && mobileNav) {
    const closeBtn = mobileNav.querySelector(".mobile-nav__close");
    const backdrop = mobileNav.querySelector(".mobile-nav__backdrop");
    const open = () => { mobileNav.classList.add("is-open"); document.body.style.overflow = "hidden"; };
    const close = () => { mobileNav.classList.remove("is-open"); document.body.style.overflow = ""; };
    menuToggle.addEventListener("click", open);
    closeBtn && closeBtn.addEventListener("click", close);
    backdrop && backdrop.addEventListener("click", close);
  }

  if (typeof initCartDrawer === "function") initCartDrawer();
  if (typeof renderCartCount === "function") renderCartCount();
  wireQuantitySteppers();
  wireModalTriggers();
  highlightActiveNav();
});

/* ---------- nav active state ---------- */
function highlightActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a, .mobile-nav a").forEach(a => {
    const href = a.getAttribute("href").split("/").pop();
    if (href === path) a.classList.add("is-active");
  });
}

/* ---------- generic quantity stepper wiring ---------- */
function wireQuantitySteppers() {
  document.querySelectorAll(".qty-stepper").forEach(stepper => {
    if (stepper.dataset.wired) return;
    stepper.dataset.wired = "true";
    const input = stepper.querySelector("input");
    const min = parseInt(stepper.dataset.min || "1", 10);
    const max = parseInt(stepper.dataset.max || "99", 10);
    stepper.querySelector(".qty-minus").addEventListener("click", () => {
      const v = Math.max(min, (parseInt(input.value, 10) || min) - 1);
      input.value = v;
      input.dispatchEvent(new Event("change"));
    });
    stepper.querySelector(".qty-plus").addEventListener("click", () => {
      const v = Math.min(max, (parseInt(input.value, 10) || min) + 1);
      input.value = v;
      input.dispatchEvent(new Event("change"));
    });
    input.addEventListener("change", () => {
      let v = parseInt(input.value, 10) || min;
      v = Math.max(min, Math.min(max, v));
      input.value = v;
    });
  });
}

/* ---------- simple modal (quick view) ---------- */
function wireModalTriggers() {
  const backdrop = document.getElementById("quickview-modal");
  if (!backdrop) return;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop || e.target.closest(".modal__close")) {
      closeModal();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}
function openModal() {
  const backdrop = document.getElementById("quickview-modal");
  if (backdrop) { backdrop.classList.add("is-open"); document.body.style.overflow = "hidden"; }
}
function closeModal() {
  const backdrop = document.getElementById("quickview-modal");
  if (backdrop) { backdrop.classList.remove("is-open"); document.body.style.overflow = ""; }
}

/* ---------- icon set (inline SVG strings, reused everywhere) ---------- */
const ICONS = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.5 3h2l2.6 12.6a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 8H6"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.8-4 5-6 8-6s6.2 2 8 6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="14" height="11"/><path d="M15 10h4l3 3v4h-7z"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2.3z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  package: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>',
  store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5M4 9v10h16V9M4 9h16M9 21v-6h6v6"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.13-4.9-4.32-.14-.19-1.17-1.56-1.17-2.98 0-1.42.74-2.11 1-2.4.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.81 1.99.88 2.13.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.13.57.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.41.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.66.78 1.94.93.29.14.48.21.55.33.07.12.07.68-.17 1.36z"/></svg>',
};
function icon(name) { return ICONS[name] || ""; }
