// js/missao.js — tela da missão (missao.php)
// Cuida de: editor de código, botão "Executar e corrigir", trilha de etapas
// e da tela de vitória. A correção em si é feita no servidor (monaco/executar.php).

(() => {
    const app = document.getElementById("ms-app");
    const editorEl = document.getElementById("ms-editor");
    const botao = document.getElementById("ms-executar");
    if (!app || !editorEl || !botao) return; // portão trancado ou missão em preparo

    const MISSAO = Number(app.dataset.missao);
    const CSRF = app.dataset.csrf;

    const saida = document.getElementById("ms-resultado");
    const tentativas = document.getElementById("ms-tentativas");
    const estado = document.getElementById("ms-estado");
    const vitoria = document.getElementById("ms-vitoria");
    const vitoriaXp = document.getElementById("ms-vitoria-xp");
    const etapas = [...document.querySelectorAll(".ms-etapa")];

    let lerCodigo = () => ""; // devolve o código digitado (Monaco ou caixa simples)
    let editorPronto = false;
    let venceu = app.dataset.concluida === "1";
    let passo = 1;

    /* ---------- Trilha de etapas: 1 ler, 2 escrever, 3 executar, 4 = tudo feito ---------- */

    function irParaEtapa(n) {
        passo = n;
        etapas.forEach((el, i) => {
            el.classList.toggle("feita", i + 1 < n || n === 4);
            el.classList.toggle("atual", i + 1 === n);
        });
    }

    irParaEtapa(venceu ? 4 : 1);

    // Quando o aluno clica no editor, ele já leu o pergaminho e começou a escrever
    function comecouAEscrever() {
        if (passo === 1) irParaEtapa(2);
    }

    /* ---------- Executar e corrigir ---------- */

    async function executar() {
        if (botao.disabled) return;

        if (!editorPronto) {
            saida.className = "ms-resultado";
            saida.textContent = "O editor ainda está carregando. Tente de novo em um instante.";
            return;
        }

        const codigo = lerCodigo();
        if (!codigo.trim()) {
            saida.className = "ms-resultado errado";
            saida.textContent = "Escreva seu código antes de executar.";
            return;
        }

        botao.disabled = true;
        botao.textContent = "EXECUTANDO...";
        saida.className = "ms-resultado";
        saida.textContent = "Invocando o código Python...";
        if (!venceu) irParaEtapa(3);

        try {
            const resposta = await fetch("monaco/executar.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ codigo: codigo, missao_id: MISSAO, csrf: CSRF })
            });
            const d = await resposta.json();

            saida.textContent =
                (d.mensagem || "") +
                (d.saida !== undefined ? "\n\nSaída:\n" + d.saida : "") +
                (d.erro ? "\n\nDetalhes:\n" + d.erro : "");
            saida.className = "ms-resultado " + (d.correto ? "certo" : "errado");

            // o servidor só conta tentativa quando o código chegou a rodar
            if (d.saida !== undefined) {
                tentativas.textContent = String(Number(tentativas.textContent) + 1);
            }

            if (d.correto) {
                vencer(d);
            } else if (!venceu) {
                irParaEtapa(2);
            }
        } catch (erro) {
            saida.className = "ms-resultado errado";
            saida.textContent = "Erro ao comunicar com o servidor: " + erro.message;
            if (!venceu) irParaEtapa(2);
        } finally {
            botao.disabled = false;
            botao.textContent = venceu ? "↻ Executar de novo" : "⚔ Executar e corrigir";
        }
    }

    function vencer(d) {
        const primeiraVez = !venceu;
        venceu = true;
        irParaEtapa(4);
        estado.textContent = "Concluída";
        app.classList.add("vencida");

        vitoriaXp.textContent = d.xp_ganho > 0
            ? "+" + d.xp_ganho + " XP"
            : "O XP desta missão você já recebeu antes.";

        vitoria.hidden = false;
        if (primeiraVez) {
            vitoria.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    botao.addEventListener("click", executar);

    /* ---------- Editor ---------- */

    const codigoInicial = editorEl.dataset.initial || "";

    // Plano B: caixa de texto simples (usada se o Monaco não carregar)
    function usarCaixaSimples() {
        editorEl.classList.add("simples");
        const caixa = document.createElement("textarea");
        caixa.value = codigoInicial;
        caixa.spellcheck = false;
        caixa.setAttribute("aria-label", "Código Python");
        caixa.addEventListener("focus", comecouAEscrever);
        caixa.addEventListener("keydown", (ev) => {
            if (ev.ctrlKey && ev.key === "Enter") {
                ev.preventDefault();
                executar();
            }
            // Tab insere 4 espaços (Python precisa de indentação)
            if (ev.key === "Tab") {
                ev.preventDefault();
                const i = caixa.selectionStart;
                caixa.setRangeText("    ", i, caixa.selectionEnd, "end");
            }
        });
        editorEl.appendChild(caixa);
        lerCodigo = () => caixa.value;
        editorPronto = true;
    }

    if (window.msSemMonaco || typeof require === "undefined") {
        usarCaixaSimples();
        return;
    }

    const base = "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/";
    window.MonacoEnvironment = {
        getWorkerUrl: () => {
            const codigo = `self.MonacoEnvironment={baseUrl:'${base}'};importScripts('${base}vs/base/worker/workerMain.js');`;
            return "data:text/javascript;charset=utf-8," + encodeURIComponent(codigo);
        }
    };

    require.config({ paths: { vs: base + "vs" } });

    require(["vs/editor/editor.main"], () => {
        const editor = monaco.editor.create(editorEl, {
            value: codigoInicial,
            language: "python",
            theme: "vs-dark",
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false
        });

        lerCodigo = () => editor.getValue();
        editorPronto = true;
        editor.onDidFocusEditorText(comecouAEscrever);
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, executar);
    }, usarCaixaSimples); // se der erro ao carregar, cai no plano B
})();