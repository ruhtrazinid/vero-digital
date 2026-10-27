// js/cardapio.js
let cart = {};
let activeCategory = "Todos";
let currentStore = null;
let allProducts = [];

const categoryIconMap = {
  "Lanches & Hambúrgueres": "sandwich",
  "Pizzas": "pizza",
  "Porções & Petiscos": "cookie",
  "Cervejas & Chopp": "beer",
  "Refrigerantes & Sucos": "cup-soda",
  "Destilados & Vinhos": "wine",
  "Energéticos": "zap",
  "Sobremesas & Açaí": "ice-cream-2",
  "Gelo & Carvão": "snowflake",
  "Outros Produtos": "package"
};

document.addEventListener("DOMContentLoaded", async () => {
  // Lê pelo parâmetro ?loja=... ou pelo final da URL /p/nome-da-loja
  const urlParams = new URLSearchParams(window.location.search);
  let storeSlug = urlParams.get("loja");

  if (!storeSlug) {
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === "p") {
      storeSlug = pathParts[1];
    }
  }

  if (!storeSlug) {
    storeSlug = "conveniencia-central";
  }

  await loadStoreData(storeSlug);
  if (currentStore) {
    await loadProducts();
  }

  document.getElementById("btnOpenModal").addEventListener("click", openCheckoutModal);
  document.getElementById("btnCloseModal").addEventListener("click", closeCheckoutModal);

  const paymentSelect = document.getElementById("custPayment");
  const changeBox = document.getElementById("changeBox");
  paymentSelect.addEventListener("change", (e) => {
    changeBox.style.display = e.target.value === "Dinheiro" ? "block" : "none";
  });

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    renderFilteredProducts(e.target.value);
  });

  document.getElementById("orderForm").addEventListener("submit", sendOrderToWhatsApp);
});

async function loadStoreData(slug) {
  currentStore = await getStoreBySlug(slug);
  if (!currentStore) {
    document.getElementById("bannerName").innerText = "Estabelecimento não encontrado";
    document.getElementById("bannerDesc").innerText = "Verifique o link informado na barra de endereço.";
    document.getElementById("productsList").innerHTML = `<p style="text-align: center; color: #ef4444; padding: 4rem 1rem;">Nenhum cardápio ativo neste endereço.</p>`;
    return;
  }

  document.title = `${currentStore.nome} | Cardápio Digital`;
  const banner = document.getElementById("banner");
  if (currentStore.cor_tema) {
    banner.style.background = `linear-gradient(180deg, ${currentStore.cor_tema} 0%, #0f172a 100%)`;
  }

  document.getElementById("bannerName").innerText = currentStore.nome;
  document.getElementById("bannerDesc").innerText = `${currentStore.segmento || ""} • Taxa: R$ ${parseFloat(currentStore.taxa_entrega).toFixed(2)}`;
  document.getElementById("bannerAddress").innerText = currentStore.endereco || "";
}

async function loadProducts() {
  if (!currentStore) return;

  allProducts = await getProducts(currentStore.id);
  const chipsContainer = document.getElementById("categoryChips");

  if (allProducts.length === 0) {
    chipsContainer.innerHTML = "";
    document.getElementById("productsList").innerHTML = `<p style="text-align: center; color: #64748b; padding: 3rem 1rem;">Cardápio em atualização. Nenhum item cadastrado no momento.</p>`;
    return;
  }

  const categories = ["Todos", ...new Set(allProducts.map((p) => p.categoria))];

  chipsContainer.innerHTML = "";
  categories.forEach((cat) => {
    const chip = document.createElement("button");
    chip.className = `chip-modern ${cat === activeCategory ? "active" : ""}`;
    
    const iconName = categoryIconMap[cat] || "package";
    chip.innerHTML = cat === "Todos" 
      ? `<span>✨ Todos</span>` 
      : `<i data-lucide="${iconName}" style="width: 14px; height: 14px;"></i> <span>${cat}</span>`;

    chip.addEventListener("click", () => {
      activeCategory = cat;
      document.querySelectorAll(".chip-modern").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      renderFilteredProducts(document.getElementById("searchInput").value);
    });
    chipsContainer.appendChild(chip);
  });

  renderFilteredProducts();
}

function renderFilteredProducts(searchTerm = "") {
  const listContainer = document.getElementById("productsList");
  let filtered = activeCategory === "Todos" 
    ? allProducts 
    : allProducts.filter((p) => p.categoria === activeCategory);

  if (searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(p => p.nome.toLowerCase().includes(term) || (p.descricao && p.descricao.toLowerCase().includes(term)));
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = `<p style="text-align: center; color: #64748b; padding: 3rem 1rem;">Nenhum item encontrado.</p>`;
    return;
  }

  listContainer.innerHTML = "";
  filtered.forEach((prod) => {
    const card = document.createElement("div");
    card.className = `menu-card ${prod.disponivel ? "" : "unavailable"}`;

    const visualHtml = prod.foto_url
      ? `<img src="${prod.foto_url}" class="menu-thumb" alt="${prod.nome}">`
      : `<div class="menu-icon-placeholder"><i data-lucide="${prod.icone || 'package'}" style="width: 32px; height: 32px; color: #f59e0b;"></i></div>`;

    card.innerHTML = `
      <div class="menu-thumb-wrapper">
        ${visualHtml}
      </div>
      <div class="menu-details">
        <div>
          <div class="item-title">${prod.nome}</div>
          <div class="item-desc">${prod.descricao || ""}</div>
        </div>
        <div class="item-bottom">
          <span class="item-price">R$ ${parseFloat(prod.preco).toFixed(2)}</span>
          ${
            prod.disponivel
              ? `<button class="btn-add-item" onclick="addToCart('${prod.id}')">+ Adicionar</button>`
              : `<span style="font-size: 0.75rem; color: #ef4444; font-weight: 700;">Esgotado</span>`
          }
        </div>
      </div>
    `;
    listContainer.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

window.addToCart = function(id) {
  const prod = allProducts.find((p) => p.id === id);
  if (!prod) return;

  if (cart[id]) {
    cart[id].qty += 1;
  } else {
    cart[id] = { item: prod, qty: 1 };
  }

  updateCartBar();
  renderModalItems();
};

window.changeQty = function(id, delta) {
  if (!cart[id]) return;

  cart[id].qty += delta;
  if (cart[id].qty <= 0) {
    delete cart[id];
  }

  updateCartBar();
  renderModalItems();

  if (Object.keys(cart).length === 0) {
    closeCheckoutModal();
  }
};

function getSubtotal() {
  return Object.values(cart).reduce((acc, curr) => acc + (parseFloat(curr.item.preco) * curr.qty), 0);
}

function updateCartBar() {
  const totalItems = Object.values(cart).reduce((acc, curr) => acc + curr.qty, 0);
  const subtotal = getSubtotal();
  const delivery = currentStore ? parseFloat(currentStore.taxa_entrega) : 0;
  const total = totalItems > 0 ? subtotal + delivery : 0;

  document.getElementById("cartCount").innerText = `${totalItems} ${totalItems === 1 ? 'item selecionado' : 'itens selecionados'}`;
  document.getElementById("cartTotal").innerText = `R$ ${total.toFixed(2)}`;

  const btnOpen = document.getElementById("btnOpenModal");
  btnOpen.disabled = totalItems === 0;
}

function openCheckoutModal() {
  renderModalItems();
  document.getElementById("checkoutModal").classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function closeCheckoutModal() {
  document.getElementById("checkoutModal").classList.remove("active");
}

function renderModalItems() {
  const container = document.getElementById("modalItemsList");
  container.innerHTML = "";

  const items = Object.values(cart);
  if (items.length === 0) {
    container.innerHTML = `<p style="font-size: 0.85rem; color: #64748b;">Nenhum item selecionado.</p>`;
    return;
  }

  items.forEach(({ item, qty }) => {
    const row = document.createElement("div");
    row.className = "modal-item-row";
    row.innerHTML = `
      <div style="flex: 1;">
        <strong style="font-size: 0.9rem;">${item.nome}</strong>
        <div style="font-size: 0.78rem; color: #64748b;">R$ ${parseFloat(item.preco).toFixed(2)} un</div>
      </div>
      <div class="qty-counter">
        <button type="button" class="btn-qty-action" onclick="changeQty('${item.id}', -1)">-</button>
        <span class="qty-display">${qty}</span>
        <button type="button" class="btn-qty-action" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
      <div style="font-weight: 700; min-width: 70px; text-align: right; font-size: 0.9rem;">
        R$ ${(parseFloat(item.preco) * qty).toFixed(2)}
      </div>
    `;
    container.appendChild(row);
  });

  const subtotal = getSubtotal();
  const delivery = currentStore ? parseFloat(currentStore.taxa_entrega) : 0;
  const total = subtotal + delivery;

  document.getElementById("summarySubtotal").innerText = `R$ ${subtotal.toFixed(2)}`;
  document.getElementById("summaryDelivery").innerText = `R$ ${delivery.toFixed(2)}`;
  document.getElementById("summaryTotal").innerText = `R$ ${total.toFixed(2)}`;
}

function sendOrderToWhatsApp(e) {
  e.preventDefault();

  if (Object.keys(cart).length === 0) {
    alert("Seu pedido está vazio!");
    return;
  }

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const payment = document.getElementById("custPayment").value;
  const change = document.getElementById("custChange").value.trim();

  const subtotal = getSubtotal();
  const delivery = parseFloat(currentStore.taxa_entrega);
  const total = subtotal + delivery;

  let msg = `🚨 *NOVO PEDIDO - ${currentStore.nome}*\n\n`;
  msg += `👤 *Cliente:* ${name}\n`;
  msg += `📱 *Telefone:* ${phone}\n`;
  msg += `📍 *Endereço:* ${address}\n`;
  msg += `💳 *Pagamento:* ${payment}`;
  if (payment === "Dinheiro" && change) {
    msg += ` (${change})`;
  }
  msg += `\n\n🛒 *Itens do Pedido:*\n`;

  Object.values(cart).forEach(({ item, qty }) => {
    const itemTotal = (parseFloat(item.preco) * qty).toFixed(2);
    msg += `• ${qty}x ${item.nome} (R$ ${itemTotal})\n`;
  });

  msg += `\n🛵 *Subtotal:* R$ ${subtotal.toFixed(2)}`;
  msg += `\n🛵 *Taxa de Entrega:* R$ ${delivery.toFixed(2)}`;
  msg += `\n💰 *Total Geral:* R$ ${total.toFixed(2)}`;
  msg += `\n\n_Pedido gerado via Cardápio Digital Vero_`;

  const cleanPhone = currentStore.whatsapp.replace(/\D/g, "");
  const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}
