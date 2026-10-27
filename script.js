/**
 * Vero Digital - Script Principal
 * Funcionalidades:
 * 1. Controle do menu mobile responsivo
 * 2. Atualização automática do ano no rodapé
 * 3. Catálogo e carrinho da demonstração interativa
 * 4. Geração do link de WhatsApp estruturado para o número 5587999383956
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Atualizar ano no footer dinamicamente
  const yearElement = document.getElementById('yearSpan');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // 2. Menu Mobile Hambúrguer
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const toggleIcon = document.getElementById('toggleIcon');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.toggle('hidden');
      if (toggleIcon) {
        if (isHidden) {
          toggleIcon.classList.remove('fa-xmark');
          toggleIcon.classList.add('fa-bars-staggered');
        } else {
          toggleIcon.classList.remove('fa-bars-staggered');
          toggleIcon.classList.add('fa-xmark');
        }
      }
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        if (toggleIcon) {
          toggleIcon.classList.remove('fa-xmark');
          toggleIcon.classList.add('fa-bars-staggered');
        }
      });
    });
  }

  // Inicializa o cardápio demonstrativo
  renderCatalog();
});

// Número oficial da agência Vero Digital
const VERO_WHATSAPP_NUMBER = '5587999383956';

// Dados dos produtos para demonstração
const catalogItems = [
  { id: 1, name: 'Burger Clássico Vero', category: 'lanches', price: 28.90, desc: 'Pão brioche, carne 160g, cheddar cremoso e maionese', icon: '🍔' },
  { id: 2, name: 'Smash Bacon Especial', category: 'lanches', price: 32.00, desc: '2x smash 90g, tiras de bacon crocante e queijo prato', icon: '🥓' },
  { id: 3, name: 'Frango Crocante', category: 'lanches', price: 26.50, desc: 'Empanado artesanal, alface americana e molho verde', icon: '🥪' },
  
  { id: 4, name: 'Refrigerante Lata 350ml', category: 'bebidas', price: 6.00, desc: 'Coca-Cola, Guaraná Antarctica ou opções Zero', icon: '🥤' },
  { id: 5, name: 'Suco Natural 500ml', category: 'bebidas', price: 9.50, desc: 'Polpa de fruta fresca sem conservantes', icon: '🍊' },
  { id: 6, name: 'Água Mineral 500ml', category: 'bebidas', price: 4.00, desc: 'Com ou sem gás gelada', icon: '💧' },

  { id: 7, name: 'Brownie com Sorvete', category: 'doces', price: 16.90, desc: 'Chocolate meio amargo com sorvete de baunilha', icon: '🍨' },
  { id: 8, name: 'Pudim Tradicional', category: 'doces', price: 11.00, desc: 'Fatia cremosa com calda de caramelo caseira', icon: '🍮' }
];

let selectedCategory = 'lanches';
let cart = [];

// Alternar abas de categoria
function switchCategory(categoryName) {
  selectedCategory = categoryName;
  
  const buttons = document.querySelectorAll('.category-chip');
  buttons.forEach(btn => {
    btn.classList.remove('active');
  });

  if (window.event && window.event.target) {
    const clickedBtn = window.event.target.closest('.category-chip');
    if (clickedBtn) {
      clickedBtn.classList.add('active');
    }
  }

  renderCatalog();
}

// Renderizar itens no cardápio
function renderCatalog() {
  const container = document.getElementById('demoItemList');
  if (!container) return;

  const filtered = catalogItems.filter(item => item.category === selectedCategory);

  container.innerHTML = filtered.map(item => `
    <div class="bg-white p-3 rounded-xl border border-gray-200/90 flex items-center justify-between gap-3 shadow-sm hover:border-[#F5A623] transition-colors">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-[#F8F9FB] flex items-center justify-center text-lg flex-shrink-0">
          ${item.icon}
        </div>
        <div>
          <h4 class="font-brand font-bold text-xs sm:text-sm text-[#1A182E] leading-tight">${item.name}</h4>
          <p class="text-[11px] text-gray-500 line-clamp-1">${item.desc}</p>
          <span class="font-brand font-bold text-xs text-[#1A182E] sm:hidden block mt-0.5">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
      
      <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <span class="hidden sm:inline font-brand font-bold text-xs sm:text-sm text-[#1A182E]">
          R$ ${item.price.toFixed(2).replace('.', ',')}
        </span>
        <button onclick="addItemToCart(${item.id})" class="bg-[#F5A623] hover:bg-[#E69516] text-[#1A182E] font-brand font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-transform active:scale-95 cursor-pointer">
          <i class="fa-solid fa-plus text-[10px]"></i>
          <span>Adicionar</span>
        </button>
      </div>
    </div>
  `).join('');
}

// Adicionar produto
function addItemToCart(id) {
  const product = catalogItems.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartDisplay();
}

// Subtrair produto
function removeItemFromCart(id) {
  const index = cart.findIndex(i => i.id === id);
  if (index !== -1) {
    if (cart[index].qty > 1) {
      cart[index].qty -= 1;
    } else {
      cart.splice(index, 1);
    }
  }
  updateCartDisplay();
}

// Atualizar interface do carrinho
function updateCartDisplay() {
  const cartContent = document.getElementById('cartContent');
  const cartTotalValue = document.getElementById('cartTotalValue');
  const cartCount = document.getElementById('cartCount');

  if (!cartContent || !cartTotalValue || !cartCount) return;

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  cartCount.textContent = `${totalQty} ${totalQty === 1 ? 'item' : 'itens'}`;
  cartTotalValue.textContent = `R$ ${totalAmount.toFixed(2).replace('.', ',')}`;

  if (cart.length === 0) {
    cartContent.innerHTML = `<p class="text-center text-gray-400 py-6 italic text-xs">Clique em "+ Adicionar" nos itens para montar seu pedido de teste.</p>`;
    return;
  }

  cartContent.innerHTML = cart.map(item => `
    <div class="flex items-center justify-between py-1.5 border-b border-gray-100 text-xs">
      <div class="pr-2">
        <span class="font-bold text-[#1A182E]">${item.qty}x</span> ${item.name}
        <span class="text-[10px] text-gray-400 block">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="removeItemFromCart(${item.id})" class="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold cursor-pointer">
          -
        </button>
        <button onclick="addItemToCart(${item.id})" class="w-6 h-6 rounded bg-[#F5A623]/30 hover:bg-[#F5A623] text-[#1A182E] flex items-center justify-center font-bold cursor-pointer">
          +
        </button>
      </div>
    </div>
  `).join('');
}

// Enviar pedido da demonstração formatado para o WhatsApp da Vero Digital
function submitDemoToWhatsApp() {
  const cartContent = document.getElementById('cartContent');

  if (cart.length === 0) {
    if (cartContent) {
      cartContent.innerHTML = `<p class="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg text-center font-medium">Selecione pelo menos um item para testar o envio!</p>`;
      setTimeout(updateCartDisplay, 2200);
    }
    return;
  }

  const itemsText = cart.map(item => `• ${item.qty}x ${item.name} (R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')})`).join('\n');
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2).replace('.', ',');

  const whatsappMessage = 
    `*Olá!*\n\n` +
    `Acabei de testar a demonstração no site institucional com este pedido:\n\n` +
    `${itemsText}\n\n` +
    `*Total estimado:* R$ ${totalAmount}\n\n` +
    `Gostaria de saber mais sobre como implementar essa solução no meu negócio!`;

  const encodedUrl = `https://wa.me/${VERO_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
  window.open(encodedUrl, '_blank', 'noopener,noreferrer');
}

// Animação suave de entrada dos elementos conforme rola a página
const initScrollReveal = () => {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Anima apenas uma vez
      }
    });
  }, {
    threshold: 0.15, // Ativa quando 15% do elemento estiver visível
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
};

// Dispara assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initScrollReveal);

// Interceção do botão de Assinatura para redirecionamento suave ou WhatsApp direto
document.addEventListener('DOMContentLoaded', () => {
  const btnAssinar = document.querySelector('a[href="#checkout"]');
  if (btnAssinar) {
    btnAssinar.addEventListener('click', (e) => {
      // Se não houver uma secção com id="checkout", direciona para o WhatsApp de adesão
      if (!document.getElementById('checkout')) {
        e.preventDefault();
        const msg = encodeURIComponent("Olá, Vero Digital! Gostaria de assinar o plano mensal do Vero Cardápio Digital para o meu estabelecimento.");
        window.open(`https://wa.me/5587999383956?text=${msg}`, '_blank', 'noopener,noreferrer');
      }
    });
  }
});