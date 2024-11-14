// Função para carregar o tema salvo ou definir o tema escuro por padrão
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');

    // Se não houver tema salvo, define o modo escuro como padrão
    if (!savedTheme) {
        document.body.classList.add('dark-theme-variables');
        themeToggler.querySelector('span:nth-child(1)').classList.remove('active');
        themeToggler.querySelector('span:nth-child(2)').classList.add('active');
    } else if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme-variables');
        themeToggler.querySelector('span:nth-child(1)').classList.remove('active');
        themeToggler.querySelector('span:nth-child(2)').classList.add('active');
    }
});

// Change theme and save preference
themeToggler.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme-variables');
    
    const isDarkTheme = document.body.classList.contains('dark-theme-variables');
    
    // Alterar o ícone de tema
    themeToggler.querySelector('span:nth-child(1)').classList.toggle('active');
    themeToggler.querySelector('span:nth-child(2)').classList.toggle('active');
    
    // Salvar a preferência de tema no localStorage
    if (isDarkTheme) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});