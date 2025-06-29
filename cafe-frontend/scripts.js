// Variáveis globais para armazenar os dados e o banco de dados
let db = null;
let allMenuItems = []; // Armazenará todos os itens do cardápio do DB

// Mapeamento de categorias para ícones (opcional, para exibir nos títulos das seções)
const categoryIcons = {
    'Cafés': 'fas fa-coffee',
    'Chocolates Quentes': 'fas fa-mug-hot',
    'Sodas': 'fas fa-wine-glass',
    'Salgados': 'fas fa-bread-slice',
    'Doces': 'fas fa-cookie-bite'
};

// Função para formatar o preço para BRL
function formatPrice(price) {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
}

// Função para gerar o HTML de um único item do cardápio
function createMenuItemHTML(item) {
    return `
        <div class="menu-item mb-6 pb-6 border-b border-[#e8d8c0] last:border-0 flex justify-between items-start fade-in-up">
            <div class="flex-1 pr-4">
                <h3 class="title-font text-xl text-[#6b4f3a] mb-1">${item.nome}</h3>
                <p class="text-[#8c6b54] text-sm">${item.descricao || ''}</p>
            </div>
            <div class="price-tag ml-4">
                ${formatPrice(item.preco)}
            </div>
        </div>
    `;
}

// Função para renderizar as seções do cardápio
function renderMenuSections(items) {
    const container = document.getElementById('menu-sections-container');
    container.innerHTML = ''; // Limpa o conteúdo existente

    // Agrupa os itens por categoria
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.categoria]) {
            acc[item.categoria] = [];
        }
        acc[item.categoria].push(item);
        return acc;
    }, {});

    // Mapeamento de categorias para classes de cor de fundo (para o cabeçalho das seções)
    const categoryBgColors = {
        'Cafés': 'bg-[#8c6b54]',
        'Chocolates Quentes': 'bg-[#a37f5e]', // Nova cor
        'Sodas': 'bg-[#6b4f3a]', // Nova cor
        'Salgados': 'bg-[#8c6b54]',
        'Doces': 'bg-[#a37f5e]'
    };

    // Ordem desejada das categorias
    const orderedCategories = ['Cafés', 'Chocolates Quentes', 'Sodas', 'Salgados', 'Doces'];

    orderedCategories.forEach(category => {
        const categoryItems = groupedItems[category];
        if (categoryItems && categoryItems.length > 0) {
            const sectionClass = category === 'Salgados' || category === 'Doces' ? 'md:col-span-1' : 'md:col-span-1'; // Ajusta layout, se precisar de col-span-2

            const sectionDiv = document.createElement('div');
            sectionDiv.id = `section-${category.toLowerCase().replace(/\s/g, '-')}`; // ID para a seção
            sectionDiv.classList.add('bg-white', 'rounded-lg', 'shadow-md', 'overflow-hidden', 'border', 'border-[#e8d8c0]', sectionClass, 'menu-section');

            const bgColorClass = categoryBgColors[category] || 'bg-[#8c6b54]'; // Fallback color
            const iconClass = categoryIcons[category] || 'fas fa-utensils'; // Fallback icon

            sectionDiv.innerHTML = `
                <div class="${bgColorClass} p-4">
                    <h2 class="title-font text-2xl text-[#f8f4e9] flex items-center">
                        <i class="${iconClass} mr-3"></i> ${category}
                    </h2>
                </div>
                <div class="p-6">
                    ${categoryItems.map(createMenuItemHTML).join('')}
                </div>
            `;
            container.appendChild(sectionDiv);
        }
    });

    // Inicia a animação dos itens de menu
    animateMenuItems();
}

// Função para carregar e exibir os itens do cardápio do SQLite
async function carregarCardapio() {
    const loadingMessage = document.getElementById('loading-message');
    loadingMessage.textContent = 'Carregando cardápio...';

    try {
        // Inicializa o sql.js (aguarda o carregamento do módulo WASM)
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
        });

        // Baixa o arquivo do banco de dados
        const response = await fetch('cardapio.db');
        const buffer = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buffer)); // Armazena o DB globalmente

        // Executa a consulta SQL para obter todos os itens
        const res = db.exec("SELECT nome, descricao, preco, categoria FROM itens ORDER BY categoria, nome");

        if (res.length === 0 || res[0].values.length === 0) {
            console.log("Nenhum item encontrado no cardápio.");
            loadingMessage.textContent = 'Nenhum item encontrado no cardápio.';
            return;
        }

        const columns = res[0].columns;
        const values = res[0].values;

        allMenuItems = values.map(row => {
            const item = {};
            columns.forEach((col, index) => {
                item[col] = row[index];
            });
            return item;
        });

        loadingMessage.style.display = 'none'; // Oculta a mensagem de carregamento

        // Renderiza todas as seções por padrão no carregamento inicial
        renderMenuSections(allMenuItems);
        
        // Ativa a primeira aba por padrão
        const firstTab = document.querySelector('.tab-button');
        if (firstTab) {
            firstTab.click(); // Simula um clique para ativar a primeira aba
        }

    } catch (err) {
        console.error("Erro ao carregar o cardápio:", err);
        loadingMessage.textContent = 'Erro ao carregar o cardápio. Tente novamente mais tarde.';
    }
}

// Função para controlar a animação de entrada dos itens
function animateMenuItems() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        // Reset animation classes
        item.classList.remove('is-visible');
        item.classList.add('fade-in-up');

        // Trigger animation after a small delay
        setTimeout(() => {
            item.classList.add('is-visible');
        }, index * 100); // Staggered effect
    });
}

// Função para manipular a troca de abas
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const menuSectionsContainer = document.getElementById('menu-sections-container');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const selectedCategory = this.dataset.category;

            // Remove active state from all buttons
            tabButtons.forEach(btn => {
                btn.classList.remove('bg-[#6b4f3a]', 'bg-[#8c6b54]', 'bg-[#a37f5e]');
                btn.classList.add('bg-[#a37f5e]'); // Reset to a base color for inactive
            });

            // Add active state to clicked button based on its category
            if (selectedCategory === 'Cafés' || selectedCategory === 'Salgados') {
                this.classList.remove('bg-[#a37f5e]');
                this.classList.add('bg-[#6b4f3a]');
            } else if (selectedCategory === 'Chocolates Quentes' || selectedCategory === 'Doces') {
                this.classList.remove('bg-[#a37f5e]');
                this.classList.add('bg-[#8c6b54]');
            } else if (selectedCategory === 'Sodas') {
                 this.classList.remove('bg-[#a37f5e]');
                this.classList.add('bg-[#a37f5e]'); // Already this color, but for clarity
            }

            // Filtra os itens para a categoria selecionada
            const filteredItems = allMenuItems.filter(item => item.categoria === selectedCategory);
            
            // Renderiza apenas a seção da categoria selecionada
            renderMenuSections(filteredItems);

            // Adapta o layout para uma coluna se a categoria for "Lanches & Salgados" ou "Salgados"
            // Se você quiser que certas categorias ocupem 2 colunas, adapte aqui
            const sectionDivs = menuSectionsContainer.querySelectorAll('.menu-section');
            sectionDivs.forEach(div => {
                if (div.id === `section-${selectedCategory.toLowerCase().replace(/\s/g, '-')}`) {
                    div.classList.add('md:col-span-2'); // Exemplo: se uma categoria deve ocupar 2 colunas
                    div.classList.add('active'); // Mostra a seção ativa
                } else {
                    div.classList.remove('md:col-span-2');
                    div.classList.remove('active'); // Oculta as outras seções
                }
            });

            // Se quisermos que as seções sempre apareçam em uma grade de 2 colunas, remover o `col-span-2`
            // e deixar o display none/block funcionar
             menuSectionsContainer.querySelectorAll('.menu-section').forEach(section => {
                if (section.id === `section-${selectedCategory.toLowerCase().replace(/\s/g, '-')}`) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
}


// Chama as funções quando a página é carregada
document.addEventListener('DOMContentLoaded', () => {
    carregarCardapio();
    setupTabSwitching(); // Configura o controle das abas
});