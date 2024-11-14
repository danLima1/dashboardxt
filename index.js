document.addEventListener("DOMContentLoaded", function() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        const userRole = localStorage.getItem("userRole");
        if (userRole === "admin") {
            window.location.href = 'admin_dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } else {
        document.getElementById('loginContainer').classList.add('active');
    }
});

document.getElementById('showRegister').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('loginContainer').classList.remove('active');
    document.getElementById('registerContainer').classList.add('active');
});

document.getElementById('showLogin').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('registerContainer').classList.remove('active');
    document.getElementById('loginContainer').classList.add('active');
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = {
        username_or_email: formData.get('username_or_email'),
        password: formData.get('password')
    };

    const response = await fetch('https://recuperacao-3e9d5efa7a2e.herokuapp.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
    });

    const result = await response.json();
    if (result.status === 'success') {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", result.role);
        if (result.role === 'admin') {
            window.location.href = 'admin_dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } else {
        alert(result.message);
    }
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password')
    };

    const response = await fetch('https://recuperacao-3e9d5efa7a2e.herokuapp.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (result.status === 'success') {
        alert('Registro realizado com sucesso! Faça login.');
        document.getElementById('registerContainer').classList.remove('active');
        document.getElementById('loginContainer').classList.add('active');
    } else {
        alert(result.message);
    }
});
