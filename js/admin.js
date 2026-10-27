// js/admin.js
let currentUser = null;
let currentStore = null;
let currentProducts = [];
let qrCodeInstance = null;
let existingPhotoUrl = null;

document.addEventListener("DOMContentLoaded", async () => {
  // 1. VERIFICA SE ESTÁ AUTENTICADO
  currentUser = await getCurrentUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // BOTÃO DE SAIR
  document.getElementById("btnSignOut").addEventListener("click", async () => {
    if (confirm("Deseja sair do painel?")) {
      await signOut();
      window.location.href = "login.html";
    }
  });

  // 2. BUSCA LOJA VINCULADA AO USUÁRIO
  currentStore = await getStoreByUserId(currentUser.id);

  if (!currentStore) {
    // USUÁRIO NOVO: MOSTRA TELA DE ONBOARDING
    showOnboardingScreen();
    return;
  }

  // USUÁRIO COM LOJA: CARREGA O PAINEL
  showAdminDashboard();
});

// ONBOARDING PARA NOVO USUÁRIO
function showOnboardingScreen() {
  document.getElementById("onboardingScreen").style.display = "block";
  document.getElementById("adminMainContent").style.display = "none";

  const obName = document.getElementById("obName");
  const obSlug = document.getElementById("obSlug");

  // Preenche o slug automaticamente conforme digita o nome
  obName.addEventListener("input", () => {
    obSlug.value = obName.value
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  });

  document.getElementById("onboardingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnCreateStoreSubmit");
    btn.disabled = true;
    btn.innerText = "Criando seu estabelecimento...";

    try {
      const newStore = {
        user_id: currentUser.id,
        nome: obName.value.trim(),
        slug: obSlug.value.trim(),
        segmento: document.getElementById("obSegment").value.trim() || "Comércio Local",
        whatsapp: document.getElementById("obPhone").value.trim(),
        taxa_entrega: parseFloat(document.getElementById("obTax").value) || 0,
        cor_tema: "#d97706"
      };

      currentStore = await createStore(newStore);
      document.getElementById("onboardingScreen").style.display = "none";
      showAdminDashboard();
    } catch (err) {
      alert("Erro ao criar estabelecimento: " + err.message);
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="sparkles" style="width: 18px; height: 18px;"></i> Criar Meu Cardápio Agora`;
      if (window.lucide) lucide.createIcons();
    }
  });

  if (window.lucide) lucide.createIcons();
}

// INICIALIZA O PAINEL QUANDO A LOJA EXISTE
async function showAdminDashboard() {
  document.getElementById("adminMainContent").style.display = "block";
  document.getElementById("headerStoreName").innerText = `/ ${currentStore.nome}`;

  // Preenche Configurações da Loja
  const storeNameInput = document.getElementById("storeName");
  const storeSegmentInput = document.getElementById("storeSegment");
  const storePhoneInput = document.getElementById("storePhone");
  const storeTaxInput = document.getElementById("storeTax");
  const storeColorInput = document.getElementById("storeColor");
  const storeAddressInput = document.getElementById("storeAddress");
  const storeForm = document.getElementById("storeForm");
  const btnSaveStore = document.getElementById("btnSaveStore");

  storeNameInput.value = currentStore.nome || "";
  storeSegmentInput.value = currentStore.segmento || "";
  storePhoneInput.value = currentStore.whatsapp || "";
  storeTaxInput.value = currentStore.taxa_entrega || 0;
  storeColorInput.value = currentStore.cor_tema || "#d97706";
  storeAddressInput.value = currentStore.endereco || "";
  document.getElementById("statTax").innerText = `R$ ${parseFloat(currentStore.taxa_entrega || 0).toFixed(2)}`;

  // Botão abrir cardápio público
  const liveUrl = `cardapio.html?loja=${currentStore.slug}`;
  document.getElementById("btnOpenLiveCardapio").href = liveUrl;

  setupQrCodeAndShare(currentStore.slug);

  // Abas
  const tabStoreBtn = document.getElementById("tabStoreBtn");
  const tabProductsBtn = document.getElementById("tabProductsBtn");
  const sectionStore = document.getElementById("sectionStore");
  const sectionProducts = document.getElementById("sectionProducts");

  tabStoreBtn.addEventListener("click", () => {
    tabStoreBtn.classList.add("active");
    tabProductsBtn.classList.remove("active");
    sectionStore.style.display = "block";
    sectionProducts.style.display = "none";
  });

  tabProductsBtn.addEventListener("click", () => {
    tabProductsBtn.classList.add("active");
    tabStoreBtn.classList.remove("active");
    sectionStore.style.display = "none";
    sectionProducts.style.display = "block";
    loadAndRenderProducts();
  });

  // Salvar Configurações da Loja
  storeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    btnSaveStore.disabled = true;
    btnSaveStore.innerText = "Salvando...";

    try {
      currentStore = await updateStoreData(currentStore.id, {
        nome: storeNameInput.value,
        segmento: storeSegmentInput.value,
        whatsapp: storePhoneInput.value,
        taxa_entrega: parseFloat(storeTaxInput.value) || 0,
        cor_tema: storeColorInput.value,
        endereco: storeAddressInput.value
      });
      document.getElementById("statTax").innerText = `R$ ${parseFloat(currentStore.taxa_entrega).toFixed(2)}`;
      document.getElementById("headerStoreName").innerText = `/ ${currentStore.nome}`;
      alert("Configurações atualizadas!");
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      btnSaveStore.disabled = false;
      btnSaveStore.innerHTML = `<i data-lucide="save" style="width: 18px; height: 18px;"></i> Salvar Configurações`;
      if (window.lucide) lucide.createIcons();
    }
  });

  // Upload e Prévia
  const prodFileInput = document.getElementById("prodFileInput");
  const imagePreviewContainer = document.getElementById("imagePreviewContainer");
  const imagePreview = document.getElementById("imagePreview");
  const imagePreviewName = document.getElementById("imagePreviewName");
  const btnRemoveChosenImage = document.getElementById("btnRemoveChosenImage");
  const btnCancelEdit = document.getElementById("btnCancelEdit");

  prodFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      existingPhotoUrl = null;
      imagePreview.src = URL.createObjectURL(file);
      imagePreviewName.innerText = file.name;
      imagePreviewContainer.style.display = "flex";
    }
  });

  btnRemoveChosenImage.addEventListener("click", () => {
    prodFileInput.value = "";
    existingPhotoUrl = null;
    imagePreviewContainer.style.display = "none";
  });

  btnCancelEdit.addEventListener("click", resetProductForm);

  // Formulário de Produtos
  const productForm = document.getElementById("productForm");
  const btnAddProd = document.getElementById("btnAddProd");
  const btnSubmitText = document.getElementById("btnSubmitText");

  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const editingId = document.getElementById("editingProdId").value;
    btnAddProd.disabled = true;
    if (btnSubmitText) btnSubmitText.innerText = editingId ? "Atualizando..." : "Adicionando item...";

    try {
      let finalPhotoUrl = existingPhotoUrl;
      if (prodFileInput.files[0]) {
        if (btnSubmitText) btnSubmitText.innerText = "Enviando foto...";
        finalPhotoUrl = await uploadProductImage(prodFileInput.files[0]);
      }

      const [selectedCat, selectedIcon] = document.getElementById("prodCategorySelect").value.split("|");

      const productPayload = {
        comercio_id: currentStore.id,
        nome: document.getElementById("prodName").value,
        categoria: selectedCat,
        icone: selectedIcon || "package",
        preco: parseFloat(document.getElementById("prodPrice").value) || 0,
        foto_url: finalPhotoUrl,
        descricao: document.getElementById("prodDesc").value
      };

      if (editingId) {
        await updateProductData(editingId, productPayload);
        alert("Produto atualizado com sucesso!");
      } else {
        productPayload.disponivel = true;
        await addProduct(productPayload);
      }

      resetProductForm();
      await loadAndRenderProducts();
    } catch (err) {
      alert("Erro ao salvar produto: " + err.message);
    } finally {
      btnAddProd.disabled = false;
      if (window.lucide) lucide.createIcons();
    }
  });

  await loadAndRenderProducts();
  if (window.lucide) lucide.createIcons();
}

function setupQrCodeAndShare(slug) {
  const currentOrigin = window.location.origin;
  
  // Link encurtado e profissional
  const publicUrl = `${currentOrigin}/p/${slug}`;

  const inputUrl = document.getElementById("storePublicUrlInput");
  inputUrl.value = publicUrl;

  const btnCopy = document.getElementById("btnCopyLink");
  const copyText = document.getElementById("copyBtnText");

  btnCopy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      copyText.innerText = "Copiado!";
      btnCopy.style.background = "#10b981";
      setTimeout(() => {
        copyText.innerText = "Copiar Link";
        btnCopy.style.background = "";
      }, 2500);
    } catch (err) {
      prompt("Copie o link abaixo:", publicUrl);
    }
  });

  const qrContainer = document.getElementById("qrcodeBox");
  qrContainer.innerHTML = "";
  qrCodeInstance = new QRCode(qrContainer, {
    text: publicUrl,
    width: 100,
    height: 100,
    colorDark: "#090d16",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  const btnDownloadQr = document.getElementById("btnDownloadQr");
  btnDownloadQr.addEventListener("click", () => {
    const qrImg = qrContainer.querySelector("img");
    if (qrImg && qrImg.src) {
      const a = document.createElement("a");
      a.href = qrImg.src;
      a.download = `qrcode-${slug}.png`;
      a.click();
    } else {
      alert("Aguarde o QR Code carregar.");
    }
  });
}

async function loadAndRenderProducts() {
  const tbody = document.getElementById("productTableBody");
  if (!currentStore) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8;">Buscando itens na nuvem...</td></tr>`;
  currentProducts = await getProducts(currentStore.id);

  document.getElementById("statTotalProds").innerText = currentProducts.length;
  const activeCount = currentProducts.filter(p => p.disponivel).length;
  document.getElementById("statActiveProds").innerText = activeCount;

  if (currentProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 2rem;">Nenhum produto cadastrado ainda. O cardápio está zerado!</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  currentProducts.forEach((prod) => {
    const tr = document.createElement("tr");

    const visualElement = prod.foto_url 
      ? `<img src="${prod.foto_url}" class="table-thumb" alt="${prod.nome}">`
      : `<div class="table-icon-thumb"><i data-lucide="${prod.icone || 'package'}" style="width: 20px; height: 20px; color: #fbbf24;"></i></div>`;

    tr.innerHTML = `
      <td>${visualElement}</td>
      <td><strong>${prod.nome}</strong></td>
      <td><span style="background: rgba(255,255,255,0.06); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem;">${prod.categoria}</span></td>
      <td><strong>R$ ${parseFloat(prod.preco).toFixed(2)}</strong></td>
      <td>
        <span class="status-badge ${prod.disponivel ? "badge-active" : "badge-inactive"}" onclick="handleToggleStatus('${prod.id}', ${prod.disponivel})">
          ${prod.disponivel ? "● Disponível" : "✕ Esgotado"}
        </span>
      </td>
      <td style="text-align: right; white-space: nowrap;">
        <button class="btn-action-edit" onclick="handleStartEdit('${prod.id}')">
          <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i> Editar
        </button>
        <button style="background: none; border: none; color: #ef4444; cursor: pointer; font-weight: 600; margin-left: 0.5rem;" onclick="handleDelete('${prod.id}')">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

window.handleStartEdit = function(id) {
  const prod = currentProducts.find(p => p.id === id);
  if (!prod) return;

  document.getElementById("editingProdId").value = prod.id;
  document.getElementById("prodName").value = prod.nome;
  document.getElementById("prodPrice").value = prod.preco;
  document.getElementById("prodDesc").value = prod.descricao || "";

  const select = document.getElementById("prodCategorySelect");
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].value.startsWith(prod.categoria)) {
      select.selectedIndex = i;
      break;
    }
  }

  const previewContainer = document.getElementById("imagePreviewContainer");
  const previewImg = document.getElementById("imagePreview");
  const previewName = document.getElementById("imagePreviewName");

  if (prod.foto_url) {
    existingPhotoUrl = prod.foto_url;
    previewImg.src = prod.foto_url;
    previewName.innerText = "Foto atual cadastrada";
    previewContainer.style.display = "flex";
  } else {
    existingPhotoUrl = null;
    previewContainer.style.display = "none";
  }

  document.getElementById("formTitle").innerText = `Editando: ${prod.nome}`;
  document.getElementById("formSubtitle").innerText = "Altere o preço, descrição ou categoria e clique em salvar alterações.";
  
  const submitText = document.getElementById("btnSubmitText");
  if (submitText) submitText.innerText = "Salvar Alterações";
  
  document.getElementById("btnCancelEdit").style.display = "inline-flex";

  document.getElementById("productForm").scrollIntoView({ behavior: "smooth" });
  document.getElementById("prodPrice").focus();
};

function resetProductForm() {
  document.getElementById("productForm").reset();
  document.getElementById("editingProdId").value = "";
  existingPhotoUrl = null;
  document.getElementById("imagePreviewContainer").style.display = "none";

  document.getElementById("formTitle").innerText = "Cadastrar Novo Item";
  document.getElementById("formSubtitle").innerText = "Válido para conveniências, lanchonetes, hamburguerias, pizzarias e açaís.";
  
  const submitText = document.getElementById("btnSubmitText");
  if (submitText) submitText.innerText = "Adicionar Item ao Cardápio";
  
  document.getElementById("btnCancelEdit").style.display = "none";
  if (window.lucide) lucide.createIcons();
}

window.handleToggleStatus = async function(id, currentStatus) {
  try {
    await toggleProductStatus(id, currentStatus);
    await loadAndRenderProducts();
  } catch (err) {
    alert("Erro ao alterar status: " + err.message);
  }
};

window.handleDelete = async function(id) {
  if (confirm("Deseja realmente excluir este item?")) {
    try {
      await deleteProductById(id);
      await loadAndRenderProducts();
    } catch (err) {
      alert("Erro ao deletar: " + err.message);
    }
  }
};
