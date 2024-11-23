// admin_dashboard.js

document.addEventListener("DOMContentLoaded", function() {
    if (localStorage.getItem("userRole") !== "admin") {
        alert("Acesso não autorizado");
        window.location.href = 'index.html';
        return;
    }
    fetchUserList();
    setDefaultDates();
});

function setDefaultDates() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const dataInicioInput = document.querySelector('#data_inicio');
    const dataFimInput = document.querySelector('#data_fim');

    dataInicioInput.value = firstDayOfMonth.toISOString().split('T')[0];
    dataFimInput.value = today.toISOString().split('T')[0];
}

function fetchUserList() {
    fetch('https://recuperacao-3e9d5efa7a2e.herokuapp.com/admin/dashboard', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        const userSelect = document.getElementById('userSelect');
        data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.user_id;
            option.textContent = user.username;
            userSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Erro ao obter a lista de usuários:', error);
    });
}

document.getElementById('userSelect').addEventListener('change', function() {
    const userId = this.value;
    if (userId) {
        setDefaultDates();
        fetchDashboardData(userId);
    } else {
        clearDashboard();
    }
});

function fetchDashboardData(userId) {
    const dataInicioInput = document.querySelector('#data_inicio');
    const dataFimInput = document.querySelector('#data_fim');

    const dataInicio = dataInicioInput.value;
    const dataFim = dataFimInput.value;

    fetch(`https://recuperacao-3e9d5efa7a2e.herokuapp.com/admin/user/${userId}/dashboard?day_start=${dataInicio}&day_end=${dataFim}`, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        renderDashboardData(data);

        vendasData = data.vendas_data;

        if (vendasData && vendasData.length > 0) {
            vendasData.sort((a, b) => {
                let dataA = a.status === 'recuperado' ? a.data_recuperacao : a.data_abandono;
                let dataB = b.status === 'recuperado' ? b.data_recuperacao : b.data_abandono;
                return new Date(dataB) - new Date(dataA);
            });

            document.querySelector('.recent-orders tbody').innerHTML = '';
            currentOffset = 0;
            loadMoreData();

            if (vendasData.length > currentOffset) {
                document.querySelector('.recent-orders a').style.display = 'block';
            } else {
                document.querySelector('.recent-orders a').style.display = 'none';
            }
        } else {
            document.querySelector('.recent-orders tbody').innerHTML = '<tr><td colspan="5">Nenhum pedido encontrado.</td></tr>';
            document.querySelector('.recent-orders a').style.display = 'none';
        }

        fetchWebhooks(userId);
    })
    .catch(error => {
        console.error("Erro ao buscar dados do dashboard:", error);
    });
}

function renderDashboardData(statusData) {
    document.querySelector('.carrinhos-abandonados').textContent = statusData.carrinhos_abandonados;
    document.querySelector('.vendas-recuperadas').textContent = statusData.vendas_recuperadas;
    document.querySelector('.dinheiro-recuperado').textContent = formatCurrency(statusData.total_dinheiro_recuperado);

    const taxaRecuperacao = (statusData.vendas_recuperadas / statusData.carrinhos_abandonados) * 100 || 0;
    document.querySelector('#taxaRecuperacao').textContent = taxaRecuperacao.toFixed(2) + '%';

    const valorMedioRecuperacao = statusData.total_dinheiro_recuperado / statusData.vendas_recuperadas || 0;
    document.querySelector('#valorMedioRecuperacao').textContent = formatCurrency(valorMedioRecuperacao);

    let tempoMedioRecuperacao = parseFloat(statusData.tempo_medio_recuperacao);
    if (isNaN(tempoMedioRecuperacao)) {
        tempoMedioRecuperacao = 0;
    }
    document.querySelector('#tempoMedioRecuperacao').textContent = tempoMedioRecuperacao.toFixed(2) + ' dias';
}

function clearDashboard() {
    document.querySelector('.carrinhos-abandonados').textContent = '0';
    document.querySelector('.vendas-recuperadas').textContent = '0';
    document.querySelector('.dinheiro-recuperado').textContent = 'R$0.00';
    document.querySelector('#taxaRecuperacao').textContent = '0%';
    document.querySelector('#valorMedioRecuperacao').textContent = 'R$0.00';
    document.querySelector('#tempoMedioRecuperacao').textContent = '0 dias';
    document.getElementById('webhooksInfo').style.display = 'none';
    document.querySelector('.recent-orders tbody').innerHTML = '';
}

// Função para formatar moeda
function formatCurrency(value) {
    return 'R$' + (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fetchWebhooks(userId) {
    fetch(`https://recuperacao-3e9d5efa7a2e.herokuapp.com/admin/user/${userId}/webhooks`, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('webhooksInfo').style.display = 'block';
        document.getElementById('webhookAbandono').textContent = `https://recuperacao-3e9d5efa7a2e.herokuapp.com/webhook2/${data.webhook_token}`;
        document.getElementById('webhookPagamento').textContent = `https://recuperacao-3e9d5efa7a2e.herokuapp.com/webhook-pagamento/${data.webhook_token}`;
    })
    .catch(error => {
        console.error("Erro ao buscar webhooks do usuário:", error);
    });
}

document.getElementById('logoutButton').addEventListener('click', async function() {
    try {
        const response = await fetch('https://recuperacao-3e9d5efa7a2e.herokuapp.com/logout', {  // Substitua pelo endpoint correto de logout
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            // Limpa os dados de autenticação do frontend
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userRole");
            
            // Redireciona para a página de login ou inicial
            window.location.href = 'index.html';
        } else {
            // Trate erros retornados pelo servidor
            const result = await response.json();
            alert(result.message || 'Erro ao fazer logout.');
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao fazer logout. Por favor, tente novamente.');
    }
});


let vendasData = [];
let currentOffset = 0;

function updateDashboard(userId = null) {
    if (!userId) {
        userId = document.getElementById('userSelect').value;
    }
    if (!userId) {
        alert('Selecione um usuário.');
        return;
    }

    fetchDashboardData(userId);
}

function loadMoreData() {
    if (!vendasData || vendasData.length === 0) {
        console.warn('Nenhum dado de vendas para exibir.');
        return;
    }

    let startIndex = currentOffset;
    let endIndex = currentOffset + 30;
    renderTableData(startIndex, endIndex);
    currentOffset = endIndex;

    if (currentOffset >= vendasData.length) {
        document.querySelector('.recent-orders a').style.display = 'none';
    }
}

function renderTableData(startIndex, endIndex) {
    let tabelaVendas = document.querySelector('.recent-orders tbody');

    for (let i = startIndex; i < endIndex && i < vendasData.length; i++) {
        let venda = vendasData[i];

        let statusClass = venda.status === 'recuperado' ? 'primary' : 'danger';
        let statusLabel = venda.status === 'recuperado' ? 'Pago' : 'Pendente';

        let data = venda.status === 'recuperado' ? venda.data_recuperacao : venda.data_abandono;
        let dataFormatada = formatDateBR(data);

        let row = `
            <tr>
                <td>${venda.full_name || 'N/A'}</td>
                <td>${dataFormatada}</td>
                <td>${venda.transaction_id || 'N/A'}</td>
                <td class="${statusClass}">${statusLabel}</td>
                <td></td>
            </tr>
        `;
        tabelaVendas.insertAdjacentHTML('beforeend', row);
    }
}

function formatDateBR(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

document.querySelector('.recent-orders a').addEventListener('click', function(e) {
    e.preventDefault();
    loadMoreData();
});

document.getElementById('confirmar').addEventListener('click', function() {
    updateDashboard();
});

// Seção de Adicionar Créditos

document.getElementById('addCreditsButton').addEventListener('click', async function() {
    const creditAmount = parseInt(document.getElementById('creditAmount').value);
    const userId = document.getElementById('userSelect').value;
    const messageDiv = document.getElementById('addCreditsMessage');

    // Validação dos dados
    if (!userId) {
        messageDiv.className = 'message-container error';
        messageDiv.textContent = 'Por favor, selecione um usuário.';
        messageDiv.style.display = 'block';
        return;
    }

    if (isNaN(creditAmount) || creditAmount <= 0) {
        messageDiv.className = 'message-container error';
        messageDiv.textContent = 'Por favor, insira uma quantidade válida de créditos.';
        messageDiv.style.display = 'block';
        return;
    }

    // Limpar mensagens anteriores
    messageDiv.className = 'message-container';
    messageDiv.textContent = '';
    messageDiv.style.display = 'none';

    // Enviar solicitação para adicionar créditos
    try {
        const response = await fetch('https://recuperacao-3e9d5efa7a2e.herokuapp.com/admin/add-credits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: parseInt(userId), amount: creditAmount }),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.status === 'success') {
            messageDiv.className = 'message-container success';
            messageDiv.textContent = result.message;
            messageDiv.style.display = 'block';

            // Atualizar os dados do dashboard para refletir o novo saldo de créditos
            fetchDashboardData(userId);

            // Limpar o campo de quantidade de créditos
            document.getElementById('creditAmount').value = '';
        } else {
            messageDiv.className = 'message-container error';
            messageDiv.textContent = result.message;
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao adicionar créditos:', error);
        messageDiv.className = 'message-container error';
        messageDiv.textContent = 'Erro ao adicionar créditos. Por favor, tente novamente.';
        messageDiv.style.display = 'block';
    }
});
