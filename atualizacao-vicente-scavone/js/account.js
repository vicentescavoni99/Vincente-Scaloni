/* ============================================================
   account.js — dados de demonstração (sem backend real)
   ============================================================ */

const USER_KEY = "vitanexa_user_v1";

const DEMO_ORDERS = [
  { id: "VX-10248", date: "02/09/2026", total: 186.90, status: "Concluído", step: 4 },
  { id: "VX-10259", date: "07/09/2026", total: 94.50, status: "Em preparação", step: 2 },
  { id: "VX-10266", date: "10/09/2026", total: 312.00, status: "Pagamento confirmado", step: 1 },
];

function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; }
}
function setUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
function logoutUser() { localStorage.removeItem(USER_KEY); }

function wireLoginForm(formEl) {
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (formEl.querySelector("[name=email]").value || "cliente").split("@")[0];
    setUser({ name: name || "Cliente", email: formEl.querySelector("[name=email]").value });
    showToast("Login realizado com sucesso");
    setTimeout(() => { window.location.href = "minha-conta.html"; }, 500);
  });
}

function wireRegisterForm(formEl) {
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = formEl.querySelector("[name=nome]").value || "Cliente";
    const email = formEl.querySelector("[name=email]").value;
    setUser({ name, email });
    showToast("Conta criada. Bem-vindo(a)!");
    setTimeout(() => { window.location.href = "minha-conta.html"; }, 500);
  });
}

function renderAccountDashboard() {
  const user = getUser();
  const helloName = document.getElementById("account-name");
  if (helloName) helloName.textContent = user ? user.name : "Visitante";

  const ordersEl = document.getElementById("orders-list");
  if (ordersEl) {
    ordersEl.innerHTML = DEMO_ORDERS.map(o => `
      <div class="order-card">
        <div>
          <div class="order-card__id">Pedido ${o.id}</div>
          <div class="order-card__date">${o.date} · ${formatBRL(o.total)}</div>
        </div>
        <span class="order-status ${o.step >= 4 ? "order-status--done" : "order-status--progress"}">${o.status}</span>
        <a class="btn btn-ghost btn-sm" href="rastrear-pedido.html?pedido=${o.id}">Rastrear</a>
      </div>`).join("");
  }
}

const TRACK_STEPS = ["Pedido recebido", "Pagamento confirmado", "Pedido preparado", "Disponível para retirada", "Concluído"];

function renderTracking(orderId) {
  const order = DEMO_ORDERS.find(o => o.id.toLowerCase() === (orderId || "").toLowerCase());
  const result = document.getElementById("tracking-result");
  if (!result) return;
  if (!order) {
    result.innerHTML = `<div class="empty-state"><h3>Não encontramos esse pedido</h3><p>Confira o número e tente novamente. Exemplo: VX-10248</p></div>`;
    return;
  }
  const pct = (order.step / (TRACK_STEPS.length - 1)) * 90;
  result.innerHTML = `
    <p style="text-align:center;color:var(--color-gray-mute);margin-bottom:34px">
      Pedido <strong style="color:var(--color-wine)">${order.id}</strong> · feito em ${order.date} · total ${formatBRL(order.total)}
    </p>
    <div class="timeline">
      <div class="timeline__progress" style="width:${pct}%"></div>
      ${TRACK_STEPS.map((label, i) => `
        <div class="timeline__step ${i < order.step ? "is-done" : i === order.step ? "is-current" : ""}">
          <div class="timeline__dot">${i < order.step ? icon("check") : i + 1}</div>
          <div class="timeline__label">${label}</div>
        </div>`).join("")}
    </div>`;
}
