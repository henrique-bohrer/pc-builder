    /*
     * CORE JAVASCRIPT
     * Simulação de Backend, Lógica de Negócios e Manipulação de DOM
     */

    // Estado Global da Aplicação
    const state = {
      sales: [
        { id: 1, seller: "Roberto Alves", role: "Closer", avatar: "https://i.pravatar.cc/150?u=1", client: "Tech Solutions", value: 15000, source: "SQL", status: "Completed", date: "2023-10-01" },
        { id: 2, seller: "Ana Silva", role: "SDR", avatar: "https://i.pravatar.cc/150?u=2", client: "Mercado Local", value: 8500, source: "CSV", status: "Completed", date: "2023-10-02" },
        { id: 3, seller: "Roberto Alves", role: "Closer", avatar: "https://i.pravatar.cc/150?u=1", client: "Big Corp", value: 42000, source: "API", status: "Pending", date: "2023-10-05" },
        { id: 4, seller: "Carlos M.", role: "Account Exec", avatar: "https://i.pravatar.cc/150?u=3", client: "Startup X", value: 12000, source: "API", status: "Completed", date: "2023-10-06" },
        { id: 5, seller: "Ana Silva", role: "SDR", avatar: "https://i.pravatar.cc/150?u=2", client: "Padaria Central", value: 5000, source: "CSV", status: "Completed", date: "2023-10-07" },
      ],
      config: {
        companyName: "Vortex CRM",
        brandColor: "#6366f1",
        monthlyGoal: 50000,
        sponsors: ["AWS", "Salesforce"]
      }
    };

    // --- INICIALIZAÇÃO ---
    document.addEventListener('DOMContentLoaded', () => {
      renderTable(state.sales);
      calculateEmployeeOfMonth();
      updateThemeUI();

      // Listener para troca de tipo de integração
      document.getElementById('newIntegrationType').addEventListener('change', toggleIntegrationInputs);

      // Inicia na view Dashboard
      navigateTo('view-dashboard');
    });

    // --- NAVEGAÇÃO DE VIEWS ---
    function navigateTo(viewId) {
        // Esconde todas as views
        const views = ['view-dashboard', 'view-sellers', 'view-reports'];
        views.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });

        // Mostra a view alvo
        document.getElementById(viewId).classList.remove('hidden');

        // Atualiza Sidebar
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        const navMap = {
            'view-dashboard': 'nav-dashboard',
            'view-sellers': 'nav-sellers',
            'view-reports': 'nav-reports'
        };

        const navId = navMap[viewId];
        if (navId) {
            document.getElementById(navId).classList.add('active');
        }

        // Título da Página
        const titles = {
            'view-dashboard': 'Dashboard de Vendas',
            'view-sellers': 'Ranking de Vendedores',
            'view-reports': 'Relatórios de Performance'
        };
        document.getElementById('pageTitleText').innerText = titles[viewId];

        // Carrega dados específicos da view
        if (viewId === 'view-sellers') {
            renderSellersView();
        } else if (viewId === 'view-reports') {
            renderReportsView();
        }
    }

    // --- VIEW: VENDEDORES ---
    function renderSellersView() {
        // 1. Agrupar dados
        const sellers = {};
        state.sales.forEach(sale => {
            if (sale.status !== 'Completed') return;

            if (!sellers[sale.seller]) {
                sellers[sale.seller] = {
                    name: sale.seller,
                    role: sale.role,
                    avatar: sale.avatar,
                    total: 0,
                    count: 0
                };
            }
            sellers[sale.seller].total += sale.value;
            sellers[sale.seller].count += 1;
        });

        // 2. Converter para Array e Ordenar
        const sortedSellers = Object.values(sellers).sort((a, b) => b.total - a.total);

        // 3. Renderizar Tabela
        const tbody = document.querySelector('#sellersTable tbody');
        tbody.innerHTML = '';

        const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

        sortedSellers.forEach((s, index) => {
            const ticketMedio = s.count > 0 ? s.total / s.count : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span style="font-weight: 700; color: ${index === 0 ? '#fbbf24' : 'var(--text-muted)'}">#${index + 1}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${s.avatar}" style="width: 32px; height: 32px; border-radius: 50%;">
                        <span>${s.name}</span>
                    </div>
                </td>
                <td>${s.role}</td>
                <td style="font-weight: 600; color: #4ade80;">${fmt.format(s.total)}</td>
                <td>${s.count}</td>
                <td>${fmt.format(ticketMedio)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- VIEW: RELATÓRIOS (Chart.js) ---
    let salesChartInstance = null;

    function renderReportsView() {
        const sellerFilter = document.getElementById('reportSellerFilter').value;
        const dateFilter = document.getElementById('reportDateFilter').value;

        // 1. Filtrar Dados
        let filteredData = state.sales.filter(s => s.status === 'Completed');

        // Filtro de Vendedor
        if (sellerFilter !== 'all') {
            filteredData = filteredData.filter(s => s.seller === sellerFilter);
        }

        // Filtro de Data (Simples)
        const today = new Date();
        if (dateFilter === 'last7') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
            filteredData = filteredData.filter(s => new Date(s.date) >= sevenDaysAgo);
        } else if (dateFilter === 'last30') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            filteredData = filteredData.filter(s => new Date(s.date) >= thirtyDaysAgo);
        }

        // 2. Prepara Select de Vendedores (se vazio)
        const sellerSelect = document.getElementById('reportSellerFilter');
        if (sellerSelect.options.length === 1) {
            const uniqueSellers = [...new Set(state.sales.map(s => s.seller))];
            uniqueSellers.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.innerText = s;
                sellerSelect.appendChild(opt);
            });
        }

        // 3. Agrupar Dados para o Gráfico (Por Data e Vendedor)
        // Eixo X: Datas Ordenadas
        const uniqueDates = [...new Set(filteredData.map(s => s.date))].sort();

        // Datasets: Um por vendedor
        const sellersInView = [...new Set(filteredData.map(s => s.seller))];
        const datasets = sellersInView.map(sellerName => {
            const salesByDate = uniqueDates.map(date => {
                const totalOnDate = filteredData
                    .filter(s => s.seller === sellerName && s.date === date)
                    .reduce((sum, s) => sum + s.value, 0);
                return totalOnDate;
            });

            // Gerar cor aleatória consistente (hash simples do nome)
            let hash = 0;
            for (let i = 0; i < sellerName.length; i++) {
                hash = sellerName.charCodeAt(i) + ((hash << 5) - hash);
            }
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            const color = "#" + "00000".substring(0, 6 - c.length) + c;

            return {
                label: sellerName,
                data: salesByDate,
                borderColor: color,
                backgroundColor: color + '33', // Opacidade
                tension: 0.3,
                fill: false
            };
        });

        // 4. Renderizar Gráfico
        const ctx = document.getElementById('salesChart').getContext('2d');

        if (salesChartInstance) {
            salesChartInstance.destroy();
        }

        // Caso não haja dados
        if (uniqueDates.length === 0) {
            // Apenas limpa ou mostra msg
            return;
        }

        salesChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: uniqueDates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#94a3b8' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    // --- LÓGICA DE GAMIFICAÇÃO (Funcionário do Mês) ---
    function calculateEmployeeOfMonth() {
      // 1. Agrupar vendas por vendedor
      const sellers = {};

      state.sales.forEach(sale => {
        if (sale.status !== 'Completed') return; // Conta apenas vendas completas

        if (!sellers[sale.seller]) {
          sellers[sale.seller] = {
            name: sale.seller,
            role: sale.role,
            avatar: sale.avatar,
            total: 0,
            count: 0
          };
        }
        sellers[sale.seller].total += sale.value;
        sellers[sale.seller].count += 1;
      });

      // 2. Encontrar o Top Performer
      let topSeller = null;
      let maxSales = -1;

      Object.values(sellers).forEach(seller => {
        if (seller.total > maxSales) {
          maxSales = seller.total;
          topSeller = seller;
        }
      });

      // 3. Renderizar com base na Meta
      const section = document.getElementById('gamificationSection');
      const goal = state.config.monthlyGoal;

      // Formatador de Moeda
      const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

      document.getElementById('goalDisplay').innerText = fmt.format(goal);

      if (topSeller && topSeller.total >= goal) {
        // Bateu a meta!
        section.innerHTML = `
                    <div class="hero-card winner-active">
                        <div class="confetti-bg"></div>
                        <div class="hero-content">
                            <div class="hero-badge" style="background: rgba(34, 197, 94, 0.2); color: #4ade80; border-color: #22c55e;">
                                <i class="fas fa-crown"></i> Meta Batida!
                            </div>
                            <div class="hero-stats">
                                <h2>${topSeller.name}</h2>
                                <p style="color: var(--brand-accent); font-weight: 600; margin-bottom: 5px;">${topSeller.role}</p>
                                <span>Total Vendido: <strong>${fmt.format(topSeller.total)}</strong></span>
                                <div style="margin-top: 10px; font-size: 0.85rem; color: var(--text-muted);">
                                    ${topSeller.count} vendas realizadas este mês
                                </div>
                            </div>
                        </div>
                        <img src="${topSeller.avatar}" alt="${topSeller.name}" class="hero-avatar">
                    </div>
                `;
      } else {
        // Ninguém bateu a meta ainda
        let bestSoFar = topSeller ? `${topSeller.name} está liderando (${fmt.format(topSeller.total)})` : "Nenhuma venda registrada";

        section.innerHTML = `
                    <div class="hero-card">
                        <div class="confetti-bg"></div>
                        <div class="hero-content">
                            <div class="hero-badge"><i class="fas fa-lock"></i> Meta em aberto</div>
                            <div class="hero-stats">
                                <h2>Procura-se um Campeão</h2>
                                <span>Meta: <strong>${fmt.format(goal)}</strong></span>
                                <p style="margin-top: 8px; font-size: 0.9rem; color: var(--brand-accent);">${bestSoFar}</p>
                            </div>
                        </div>
                        <div style="width: 120px; height: 120px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-trophy" style="font-size: 3rem; color: var(--text-muted); opacity: 0.5;"></i>
                        </div>
                    </div>
                `;
      }
    }

    // --- RENDERIZAÇÃO DA TABELA ---
    function renderTable(data) {
      const tbody = document.querySelector('#salesTable tbody');
      tbody.innerHTML = '';

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">Nenhum dado encontrado.</td></tr>`;
        return;
      }

      const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

      data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${item.avatar}" style="width: 32px; height: 32px; border-radius: 50%;">
                            <span>${item.seller}</span>
                        </div>
                    </td>
                    <td>${item.client}</td>
                    <td style="font-weight: 600;">${fmt.format(item.value)}</td>
                    <td><span class="status-pill ${item.source.toLowerCase()}">${item.source}</span></td>
                    <td><span style="color: ${item.status === 'Completed' ? '#4ade80' : '#facc15'}">• ${item.status === 'Completed' ? 'Concluído' : 'Pendente'}</span></td>
                    <td style="color: var(--text-muted); font-size: 0.85rem;">${item.date}</td>
                `;
        tbody.appendChild(tr);
      });
    }

    // --- SISTEMA DE FILTRAGEM ---
    function filterTable() {
      const searchText = document.getElementById('searchInput').value.toLowerCase();
      const sourceFilter = document.getElementById('integrationFilter').value;
      const statusFilter = document.getElementById('statusFilter').value;

      const filtered = state.sales.filter(item => {
        // Filtro Texto
        const matchText = item.seller.toLowerCase().includes(searchText) ||
          item.client.toLowerCase().includes(searchText);

        // Filtro Origem
        const matchSource = sourceFilter === 'all' || item.source === sourceFilter;

        // Filtro Status
        const matchStatus = statusFilter === 'all' || item.status === statusFilter;

        return matchText && matchSource && matchStatus;
      });

      renderTable(filtered);
    }

    // --- CONFIGURAÇÃO DA EMPRESA (WHITELABEL) ---
    function saveSettings() {
      const name = document.getElementById('companyNameInput').value;
      const color = document.getElementById('brandColorInput').value;
      const goal = Number(document.getElementById('monthlyGoalInput').value);
      const sponsors = document.getElementById('sponsorsInput').value.split(',').map(s => s.trim());

      // Atualiza Estado
      state.config.companyName = name;
      state.config.brandColor = color;
      state.config.monthlyGoal = goal;
      state.config.sponsors = sponsors;

      updateThemeUI();
      calculateEmployeeOfMonth(); // Recalcula pois a meta mudou
      closeModal('settingsModal');
    }

    function updateThemeUI() {
      // Aplica Cor Principal na Variável CSS (Magia do Whitelabel)
      document.documentElement.style.setProperty('--brand-primary', state.config.brandColor);

      // Gera uma cor "Accent" mais clara baseada na primária (apenas visual, simplificado)
      document.documentElement.style.setProperty('--brand-accent', state.config.brandColor + '80'); // 50% opacity hack

      // Textos
      document.getElementById('sidebarCompanyName').innerText = state.config.companyName;

      // Avatar Logo (Gerador Dinâmico)
      const cleanName = state.config.companyName.replace(' ', '+');
      const cleanColor = state.config.brandColor.replace('#', '');
      document.getElementById('sidebarLogo').src = `https://ui-avatars.com/api/?name=${cleanName}&background=${cleanColor}&color=fff`;

      // Patrocinadores
      const sponsorsContainer = document.getElementById('sponsorsList');
      sponsorsContainer.innerHTML = state.config.sponsors.map(s => `<span class="sponsor-badge">${s}</span>`).join('');
    }

    // --- GERENCIAMENTO DE INTEGRAÇÕES ---
    function toggleIntegrationInputs() {
        const type = document.getElementById('newIntegrationType').value;
        const containers = {
            'CSV': document.getElementById('csvInputContainer'),
            'SQL': document.getElementById('sqlInputContainer'),
            'API': document.getElementById('apiInputContainer')
        };

        // Esconde todos
        Object.values(containers).forEach(el => el.classList.add('hidden'));

        // Mostra o selecionado
        if (containers[type]) {
            containers[type].classList.remove('hidden');
        }
    }

    function processIntegration() {
        const type = document.getElementById('newIntegrationType').value;

        if (type === 'CSV') {
            processCSV();
        } else if (type === 'SQL') {
            processSQL();
        } else if (type === 'API') {
            processAPI();
        }
    }

    function processCSV() {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput.files[0];

        if (!file) {
            alert("Por favor, selecione um arquivo CSV.");
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.errors.length > 0) {
                    console.error("Erros no CSV:", results.errors);
                    alert("Erro ao ler CSV. Verifique o console.");
                    return;
                }

                const newSales = results.data.map((row, index) => {
                    // Mapeamento básico e tratamento de dados
                    return {
                        id: state.sales.length + index + 1,
                        seller: row.seller || "Desconhecido",
                        role: row.role || "Vendedor",
                        avatar: row.avatar || `https://i.pravatar.cc/150?u=${Math.random()}`,
                        client: row.client || "Cliente CSV",
                        value: parseFloat(row.value) || 0,
                        source: "CSV",
                        status: row.status || "Completed",
                        date: row.date || new Date().toISOString().split('T')[0]
                    };
                });

                state.sales = [...newSales, ...state.sales];

                finalizeIntegration(newSales.length, "CSV");
            },
            error: function(err) {
                alert("Erro ao ler o arquivo: " + err.message);
            }
        });
    }

    function processSQL() {
        const query = document.getElementById('sqlQueryInput').value;
        if (!query.trim()) {
            alert("Digite uma query SQL para simular.");
            return;
        }

        // Simulação de resultado SQL
        const mockResult = {
            id: state.sales.length + 1,
            seller: "DB Admin (SQL)",
            role: "System",
            avatar: "https://i.pravatar.cc/150?u=sql",
            client: "Enterprise Database",
            value: 75000,
            source: "SQL",
            status: "Completed",
            date: new Date().toISOString().split('T')[0]
        };

        state.sales.unshift(mockResult);
        finalizeIntegration(1, "SQL");
    }

    function processAPI() {
        const endpoint = document.getElementById('apiEndpointInput').value;
        const token = document.getElementById('apiTokenInput').value;

        if (!endpoint || !token) {
            alert("Preencha Endpoint e Token.");
            return;
        }

        // Simulação de resposta API
        const mockResult = {
            id: state.sales.length + 1,
            seller: "API Bot",
            role: "Automation",
            avatar: "https://i.pravatar.cc/150?u=api",
            client: "Online Order",
            value: 3300,
            source: "API",
            status: "Completed",
            date: new Date().toISOString().split('T')[0]
        };

        state.sales.unshift(mockResult);
        finalizeIntegration(1, "API");
    }

    function finalizeIntegration(count, type) {
        renderTable(state.sales);
        calculateEmployeeOfMonth();
        closeModal('integrationModal');

        // Limpar inputs
        document.getElementById('csvFileInput').value = '';
        document.getElementById('sqlQueryInput').value = '';

        alert(`${count} venda(s) importada(s) via ${type} com sucesso!`);
    }

    // --- UTILITÁRIOS UI ---
    function openModal(id) {
      document.getElementById(id).classList.add('open');
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove('open');
    }

    function toggleSidebar() {
      document.getElementById('sidebar').classList.toggle('active');
    }

    // Fecha modal ao clicar fora
    window.onclick = function (event) {
      if (event.target.classList.contains('modal')) {
        event.target.classList.remove('open');
      }
    }
