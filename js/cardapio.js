let currentStore = null;
let allProducts = [];
let cart = [];
let activeCategory = "all";
let orderType = "delivery"; // "delivery" ou "pickup"

document.addEventListener("DOMContentLoaded", async () => {
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

  currentStore = await getStoreBySlug(storeSlug);

  if (!currentStore) {
    document.getElementById("bannerName").innerText = "Estabelecimento não encontrado";
    document.getElementById("productsList").innerHTML = `<p style="text-align: center; color: #ef4444; padding: 3rem;">Loja não cadastrada ou link inválido.</p>`;
    return;
  }

  // Preenche dados da loja
  document.getElementById("bannerName").innerText = currentStore.nome;
  document.getElementById("bannerDesc").innerText = currentStore.segmento || "Cardápio Online Oficial";
  if (currentStore.endereco) {
    document.getElementById("bannerAddress").innerText = `📍 ${currentStore.endereco}`;
  }

  // Busca produtos
  allProducts = await getProducts(currentStore.id);
  renderCategoryChips();
  renderProducts();

  // Configura Busca
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderProducts(e.target.value.toLowerCase());
    });
  }

  // Controle de Modal de Checkout
  const btnOpenModal = document.getElementById("btnOpenModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const checkoutModal = document.getElementById("checkoutModal");

  btnOpenModal.addEventListener("click", () => {
    renderModalItems();
    checkoutModal.classList.add("active");
  });

  btnCloseModal.addEventListener("click", () => {
    checkoutModal.classList.remove("active");
  });

  // Alternância: Entrega vs Retirada
  const btnTypeDelivery = document.getElementById("btnTypeDelivery");
  const btnTypePickup = document.getElementById("btnTypePickup");
  const boxAddress = document.getElementById("boxAddress");
  const custAddressInput = document.getElementById("custAddress");

  btnTypeDelivery.addEventListener("click", () => {
    orderType = "delivery";
    btnTypeDelivery.style.background = "var(--primary-light)";
    btnTypeDelivery.style.borderColor = "var(--border-active)";
    btnTypeDelivery.style.color = "#fbbf24";

    btnTypePickup.style.background = "#090e1a";
    btnTypePickup.style.borderColor = "var(--border-color)";
    btnTypePickup.style.color = "var(--text-muted)";

    boxAddress.style.display = "flex";
    custAddressInput.required = true;
    updateCartDisplay();
  });

  btnTypePickup.addEventListener("click", () => {
    orderType = "pickup";
    btnTypePickup.style.background = "var(--primary-light)";
    btnTypePickup.style.borderColor = "var(--border-active)";
    btnTypePickup.style.color = "#fbbf24";

    btnTypeDelivery.style.background = "#090e1a";
    btnTypeDelivery.style.borderColor = "var(--border-color)";
    btnTypeDelivery.style.color = "var(--text-muted)";

    boxAddress.style.display = "none";
    custAddressInput.required = false;
    updateCartDisplay();
  });

  // Mostra campo de troco se dinheiro
  const custPayment = document.getElementById("custPayment");
  const changeBox = document.getElementById("changeBox");
  custPayment.addEventListener("change", (e) => {
    changeBox.style.display = e.target.value === "Dinheiro" ? "flex" : "none";
  });

  // Envio do Pedido no padrão visual restaurado
  const orderForm = document.getElementById("orderForm");
  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Sua sacola está vazia!");
      return;
    }

    const name = document.getElementById("custName").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const address = orderType === "delivery" ? document.getElementById("custAddress").value.trim() : "Retirada no Balcão";
    const payment = document.getElementById("custPayment").value;
    const change = document.getElementById("custChange")?.value.trim() || "";

    const subtotal = cart.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
    const deliveryTax = (orderType === "delivery") ? parseFloat(currentStore.taxa_entrega || 0) : 0;
    const totalGeral = subtotal + deliveryTax;

    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const orderTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let msg = `🛒 *PEDIDO #${orderNumber}* • *${currentStore.nome.toUpperCase()}*\n`;
    msg += `🕒 _Realizado às ${orderTime}_\n`;
    msg += `─────────────────────────\n\n`;

    msg += `👤 *DADOS DO CLIENTE*\n`;
    msg += `- *Nome:* ${name}\n`;
    msg += `- *WhatsApp:* ${phone}\n\n`;

    msg += `📦 *FORMA DE RECEBIMENTO*\n`;
    if (orderType === "delivery") {
      msg += `🛵 *Tipo:* Entrega (Delivery)\n`;
      msg += `📍 *Endereço:* ${address}\n\n`;
    } else {
      msg += `🏪 *Tipo:* Retirada no Balcão\n`;
      if (currentStore.endereco) {
        msg += `📍 *Retirar em:* ${currentStore.endereco}\n\n`;
      } else {
        msg += `📍 *Local:* No estabelecimento\n\n`;
      }
    }

    msg += `💳 *PAGAMENTO*\n`;
    msg += `- *Método:* ${payment}\n`;
    if (payment === "Dinheiro" && change) {
      msg += `- *Troco para:* ${change}\n`;
    }

    msg += `\n─────────────────────────\n`;
    msg += `📋 *RESUMO DOS ITENS*\n\n`;

    cart.forEach(item => {
      const itemSubtotal = (item.preco * item.qtd).toFixed(2);
      msg += `▫️ *${item.qtd}x* ${item.nome}\n`;
      msg += `   └─ R$ ${parseFloat(item.preco).toFixed(2)} un  ➔  *R$ ${itemSubtotal}*\n`;
    });

    msg += `─────────────────────────\n`;
    msg += `Subtotal: R$ ${subtotal.toFixed(2)}\n`;
    msg += `Taxa de Entrega: ${orderType === "delivery" ? `R$ ${deliveryTax.toFixed(2)}` : "Grátis (Retirada)"}\n`;
    msg += `💰 *TOTAL DO PEDIDO: R$ ${totalGeral.toFixed(2)}*\n`;
    msg += `─────────────────────────\n\n`;

    msg += `✨ *Agradecemos a sua preferência!*\n`;
    msg += `_Por favor, confirme se recebeu este pedido para iniciarmos o preparo._\n\n`;
    msg += `⚡ _Pedido gerado via Vero Digital_`;

    const cleanStorePhone = currentStore.whatsapp.replace(/\D/g, "");
    const encodedMsg = encodeURIComponent(msg);
    const waUrl = `https://wa.me/55${cleanStorePhone}?text=${encodedMsg}`;

    window.open(waUrl, "_blank");
  });

  if (window.lucide) lucide.createIcons();
});

function renderCategoryChips() {
  const container = document.getElementById("categoryChips");
  if (!container) return;

  const categories = ["all", ...new Set(allProducts.map(p => p.categoria).filter(Boolean))];

  container.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `chip-modern ${activeCategory === cat ? "active" : ""}`;
    btn.innerText = cat === "all" ? "Todos os Itens" : cat;
    btn.onclick = () => {
      activeCategory = cat;
      renderCategoryChips();
      renderProducts();
    };
    container.appendChild(btn);
  });
}

function renderProducts(searchTerm = "") {
  const list = document.getElementById("productsList");
  if (!list) return;

  let filtered = allProducts;

  if (activeCategory !== "all") {
    filtered = filtered.filter(p => p.categoria === activeCategory);
  }

  if (searchTerm) {
    filtered = filtered.filter(p => p.nome.toLowerCase().includes(searchTerm) || (p.descricao && p.descricao.toLowerCase().includes(searchTerm)));
  }

  if (filtered.length === 0) {
    list.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 2rem;">Nenhum produto encontrado.</p>`;
    return;
  }

  list.innerHTML = "";
  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = `menu-card ${!p.disponivel ? "unavailable" : ""}`;

    const thumbHtml = p.foto_url
      ? `<div class="menu-thumb-wrapper"><img src="${p.foto_url}" class="menu-thumb" alt="${p.nome}"></div>`
      : `<div class="menu-thumb-wrapper"><div class="menu-icon-placeholder"><i data-lucide="${p.icone || 'package'}" style="width: 28px; height: 28px; color: #fbbf24;"></i></div></div>`;

    card.innerHTML = `
      ${thumbHtml}
      <div class="menu-details">
        <div>
          <h3 class="item-title">${p.nome}</h3>
          ${p.descricao ? `<p class="item-desc">${p.descricao}</p>` : ""}
        </div>
        <div class="item-bottom">
          <span class="item-price">R$ ${parseFloat(p.preco).toFixed(2)}</span>
          ${p.disponivel 
            ? `<button type="button" class="btn-add-item" onclick="addToCart('${p.id}')">+ Adicionar</button>` 
            : `<span style="font-size: 0.72rem; color: #ef4444; font-weight: 700;">Esgotado</span>`
          }
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

function addToCart(prodId) {
  const prod = allProducts.find(p => p.id === prodId);
  if (!prod) return;

  const itemInCart = cart.find(i => i.id === prodId);
  if (itemInCart) {
    itemInCart.qtd++;
  } else {
    cart.push({
      id: prod.id,
      nome: prod.nome,
      preco: parseFloat(prod.preco),
      qtd: 1
    });
  }

  updateCartDisplay();
}

function updateCartDisplay() {
  const totalItems = cart.reduce((acc, item) => acc + item.qtd, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
  const deliveryTax = (orderType === "delivery") ? parseFloat(currentStore?.taxa_entrega || 0) : 0;
  const totalGeral = subtotal + deliveryTax;

  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  const btnOpenModal = document.getElementById("btnOpenModal");
  const summarySubtotal = document.getElementById("summarySubtotal");
  const summaryDelivery = document.getElementById("summaryDelivery");
  const summaryTotal = document.getElementById("summaryTotal");

  if (cartCount) cartCount.innerText = `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`;
  if (cartTotal) cartTotal.innerText = `R$ ${totalGeral.toFixed(2)}`;
  if (btnOpenModal) btnOpenModal.disabled = totalItems === 0;

  if (summarySubtotal) summarySubtotal.innerText = `R$ ${subtotal.toFixed(2)}`;
  if (summaryDelivery) {
    summaryDelivery.innerText = orderType === "delivery" 
      ? `R$ ${deliveryTax.toFixed(2)}` 
      : "Grátis (Retirada)";
  }
  if (summaryTotal) summaryTotal.innerText = `R$ ${totalGeral.toFixed(2)}`;
}

function renderModalItems() {
  const container = document.getElementById("modalItemsList");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 1.5rem;">Sua sacola está vazia.</p>`;
    return;
  }

  container.innerHTML = "";
  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "modal-item-row";
    row.innerHTML = `
      <div style="flex: 1; min-width: 0;">
        <p style="font-size: 0.85rem; font-weight: 800; color: #fff; margin: 0;">${item.nome}</p>
        <span style="font-size: 0.75rem; color: #fbbf24;">R$ ${(item.preco * item.qtd).toFixed(2)}</span>
      </div>
      <div class="qty-counter">
        <button type="button" class="btn-qty-action" onclick="changeQty('${item.id}', -1)">−</button>
        <span class="qty-display">${item.qtd}</span>
        <button type="button" class="btn-qty-action" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
    `;
    container.appendChild(row);
  });
}

function changeQty(prodId, delta) {
  const item = cart.find(i => i.id === prodId);
  if (!item) return;

  item.qtd += delta;
  if (item.qtd <= 0) {
    cart = cart.filter(i => i.id !== prodId);
  }

  renderModalItems();
  updateCartDisplay();
}
