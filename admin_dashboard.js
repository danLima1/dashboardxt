let usersData = [];
let vendasData = [];
let currentOffset = 0;

document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem("userRole");
    const currentPath = window.location.pathname;

    if ((userRole !== "admin" || !token) && !currentPath.endsWith('index.html')) {
        alert("Acesso não autorizado");
        window.location.href = 'index.html';
        return;
    }

    // Carrega os usuários somente se o usuário for um admin autenticado
    if (userRole === "admin" && token) {
        loadUsers();
        setDefaultDates();
    }
});

function setDefaultDates() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const dataInicioInput = document.querySelector('#data_inicio');
    const dataFimInput = document.querySelector('#data_fim');
    dataInicioInput.value = firstDayOfMonth.toISOString().split('T')[0];
    dataFimInput.value = today.toISOString().split('T')[0];
}

function loadUsers() {
    const token = localStorage.getItem('authToken');
    fetch('https://recuperacao-3e9d5efa7a2e.herokuapp.com/admin/dashboard', {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleSessionExpired();
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        usersData = data;
        const userSelect = document.getElementById('userSelect');
        data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.user_id;
            option.textContent = user.username;
            userSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Erro ao carregar usuários:', error);
    });
}

function handleSessionExpired() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
    alert("Sua sessão expirou ou você não tem permissão para acessar esta página. Por favor, faça login novamente.");
    window.location.href = 'index.html';
}

document.getElementById('userSelect').addEventListener('change', function() {
    const selectedUserId = this.value;
    const selectedUser = usersData.find(user => user.user_id == selectedUserId);
    if (selectedUser) {
        document.getElementById('creditsValue').textContent = selectedUser.credits;
        document.getElementById('userCredits').style.display = 'block';
        setDefaultDates();
        fetchDashboardData(selectedUserId);
    } else {
        document.getElementById('creditsValue').textContent = '0';
        document.getElementById('userCredits').style.display = 'none';
        clearDashboard();
    }
});

function fetchDashboardData(userId) {
    const token = localStorage.getItem('authToken');
    const dataInicioInput = document.querySelector('#data_inicio');
    const dataFimInput = document.querySelector('#data_fim');
    const dataInicio = dataInicioInput.value;
    const dataFim = dataFimInput.value;
    fetch(`https://recuperacao-3e9d5efa7a2e.herokuapp.com/admin/user/${userId}/dashboard?day_start=${dataInicio}&day_end=${dataFim}`, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 401) {
            handleSessionExpired();
            throw new Error('Unauthorized');
        }
        return response.json();
    })
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
    document.querySelector('.recent-orders tbody').innerHTML = '';
}

function formatCurrency(value) {
    return 'R$' + (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

document.getElementById('logoutButton').addEventListener('click', function() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
    window.location.href = 'index.html';
});

document.getElementById('addCreditsButton').addEventListener('click', async function() {
    const creditAmount = parseInt(document.getElementById('creditAmount').value);
    const userId = document.getElementById('userSelect').value;
    const messageDiv = document.getElementById('addCreditsMessage');
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
    messageDiv.className = 'message-container';
    messageDiv.textContent = '';
    messageDiv.style.display = 'none';
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('https://recuperacao-3e9d5efa7a2e.herokuapp.com/admin/add-credits', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: parseInt(userId), amount: creditAmount })
        });
        if (response.status === 401) {
            handleSessionExpired();
            return;
        }
        const result = await response.json();
        if (result.status === 'success') {
            messageDiv.className = 'message-container success';
            messageDiv.textContent = result.message;
            messageDiv.style.display = 'block';
            fetchDashboardData(userId);
            document.getElementById('creditAmount').value = '';
            updateUserCredits(userId, creditAmount);
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

function updateUserCredits(userId, addedCredits) {
    const selectedUser = usersData.find(user => user.user_id == userId);
    if (selectedUser) {
        selectedUser.credits += addedCredits;
        document.getElementById('creditsValue').textContent = selectedUser.credits;
    }
}
