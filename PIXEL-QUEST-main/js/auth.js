(() => {
"use strict";

const caixa = document.getElementById("authCaixa");
const boxes = { login: document.getElementById("boxLogin"), cadastro: document.getElementById("boxCadastro") };
const paineis = { esquerda: document.getElementById("painelEsquerda"), direita: document.getElementById("painelDireita") };

const paginas = { login: "login.php", cadastro: "cadastro_usuario.php" };
const titulos = { login: "Entrar | PIXEL QUEST", cadastro: "Criar conta | PIXEL QUEST" };

// Troca entre entrar e criar conta com a animação do painel
function ir(modo) {
    const cad = modo === "cadastro";

    caixa.classList.toggle("ativo", cad);

    // "inert" tira do foco do teclado o que está escondido
    boxes.login.inert = cad;
    boxes.cadastro.inert = !cad;
    boxes.login.setAttribute("aria-hidden", String(cad));
    boxes.cadastro.setAttribute("aria-hidden", String(!cad));
    paineis.esquerda.inert = cad;
    paineis.direita.inert = !cad;

    document.title = titulos[modo];
    try {
        history.replaceState(null, "", paginas[modo]);   // a barra de endereço acompanha
    } catch (e) { /* ambientes que bloqueiam a troca de endereço */ }

    setTimeout(() => boxes[modo].querySelector("input").focus(), 700);
}

document.querySelectorAll("[data-ir]").forEach(link =>
    link.addEventListener("click", ev => {
        ev.preventDefault();
        ir(link.dataset.ir);
    })
);

// Confirmação de senha
const senha = document.getElementById("cad_senha");
const confirmar = document.getElementById("cad_confirmar");

const conferir = () =>
    confirmar.setCustomValidity(confirmar.value && confirmar.value !== senha.value ? "As senhas não coincidem." : "");

senha.addEventListener("input", conferir);
confirmar.addEventListener("input", conferir);
})();