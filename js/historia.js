document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // 1) OS DESENHOS (pixel art em texto!)
    // Cada letra é um pixel e cada linha de texto é uma fileira do desenho.
    // O "." é vazio. As cores estão na tabela logo abaixo.
    // Para mudar um desenho, é só editar as letras.
    // ==============================
    const cores = {
        k: "#12143a", // contorno
        w: "#ffffff", // branco / brilho
        p: "#c4a5ff", // roxo claro
        P: "#a77bff", // roxo
        d: "#7855e8", // roxo escuro (sombra)
        y: "#ffd36b", // dourado
        o: "#ffb900", // laranja
        g: "#4ade80", // verde
        G: "#1f9d55", // verde escuro
        n: "#8b5a2b", // marrom
        s: "#9299ad", // cinza
        S: "#5b6490", // cinza escuro
        b: "#38bdf8", // azul
        v: "#0a0f2c"  // quase preto
    };

    const sprites = {
        cristal: [
            ".....kk.....",
            "....kppk....",
            "...kpwppk...",
            "..kpwpPPPk..",
            ".kpwpPPPPPk.",
            "kpwpPPPPPPPk",
            "kpwPPPPPPPdk",
            "kpPPPPPPPPdk",
            ".kPPPPPPPdk.",
            "..kPPPPPdk..",
            "...kPPPdk...",
            "....kPdk....",
            ".....kk....."
        ],
        // o mesmo cristal, mas com uma rachadura (as letras "k" no meio)
        cristalPartido: [
            ".....kk.....",
            "....kppk....",
            "...kpwkpk...",
            "..kpwpkPPk..",
            ".kpwpPkPPPk.",
            "kpwpPPkPPPdk",
            "kpwPPkkPPPdk",
            "kpPPPkPPPPdk",
            ".kPPPPkPPdk.",
            "..kPPkPPdk..",
            "...kPkPdk...",
            "....kkdk....",
            ".....kk....."
        ],
        caco: [
            ".kk..",
            "kppk.",
            "kwPdk",
            ".kPdk",
            "..kdk",
            "...k."
        ],
        espada: [
            "...k...",
            "..kwk..",
            "..kwk..",
            "..kwk..",
            "..kwk..",
            "..kwk..",
            "..kwk..",
            "kkkkkkk",
            "kyyoyyk",
            "kkkkkkk",
            "..knk..",
            "..knk..",
            "..kyk..",
            "...k..."
        ],
        livro: [
            "kkkkkkkkkk",
            "kPPPPPPPPk",
            "kPPPyyPPPk",
            "kPPyyyyPPk",
            "kPPPyyPPPk",
            "kPPPPPPPPk",
            "kddddddddk",
            "kkkkkkkkkk",
            "kwwwwwwwwk",
            "kkkkkkkkkk"
        ],
        floresta: [
            "...kkkk...",
            "..kGggGk..",
            ".kGggggGk.",
            "kGggGggggk",
            "kGgggggGGk",
            ".kGGggGGk.",
            "..kkGGkk..",
            "...knnk...",
            "...knnk...",
            "...knnk...",
            "..kkkkkk.."
        ],
        vale: [
            "........yy",
            "........yy",
            "..........",
            "...kkk....",
            "..kgggk...",
            ".kgggggk.k",
            "kggggggkgk",
            "kggbbgggGk",
            "kgbbbgggGk",
            "kggbbggGGk",
            "kkkkkkkkkk"
        ],
        montanha: [
            "....kk....",
            "...kwwk...",
            "..kwwwwk..",
            "..kwsswk..",
            ".kssSSssk.",
            ".ksSSSSsk.",
            "kssSSSSssk",
            "ksSSSSSSsk",
            "kssSSSSssk",
            "kkkkkkkkkk"
        ],
        caverna: [
            "..kkkkkk..",
            ".kSSSSSSk.",
            "kSSssssSSk",
            "kSsvvvvsSk",
            "kSvvvvvvSk",
            "kSvvvvvvSk",
            "kSvvvvvvSk",
            "kSsvyvvsSk",
            "kSsvvvvsSk",
            "kkkkkkkkkk"
        ]
    };

    // ==============================
    // 2) A HISTÓRIA (4 partes)
    // cena  = quais desenhos aparecem        escala = tamanho dos pixels
    // cor   = cor do brilho (R,G,B)          efeito = "tremer" (opcional)
    // ==============================
    let caminho = sessionStorage.getItem("caminho") || "explorador";

    const falas = [
        {
            titulo: "O Reino de Asteria",
            texto: "Além das montanhas existe Asteria, um reino feito de código e imaginação. No coração dele brilha o Cristal do Conhecimento.",
            cena: ["cristal"],
            escala: 12,
            cor: "172,130,255"
        },
        {
            titulo: "A Grande Falha",
            texto: "Um dia, o cristal se partiu. Seus fragmentos se espalharam pelas quatro regiões e o reino perdeu a sua luz.",
            cena: ["caco", "caco", "cristalPartido", "caco", "caco"],
            escala: 12,
            cor: "248,113,113",
            efeito: "tremer"
        },
        {
            titulo: "Uma Escolha",
            texto: "Os guardiões procuram alguém para recuperar os fragmentos. Como você quer começar a sua jornada?",
            cena: ["espada", "livro"],
            escala: 10,
            cor: "255,211,107",
            escolhas: [
                {
                    texto: "⚔ Explorar o desconhecido",
                    resultado: "Coragem não falta! Você parte sem medo dos desafios que vêm pela frente.",
                    caminho: "explorador",
                    item: 0 // destaca o 1º desenho da cena (a espada)
                },
                {
                    texto: "✦ Buscar conhecimento",
                    resultado: "Boa ideia! Você vai aprender os segredos do código antes de enfrentar os desafios.",
                    caminho: "sabio",
                    item: 1 // destaca o 2º desenho (o livro)
                }
            ]
        },
        {
            titulo: "Sua História Começa",
            // aqui o texto muda conforme a escolha do jogador
            texto: () =>
                (caminho === "sabio"
                    ? "Com a mente afiada, você segue em frente. "
                    : "Com a espada em punho, você segue em frente. ") +
                "Floresta, vale, montanhas e cavernas esperam por você. A cada desafio vencido, o cristal brilha um pouquinho mais.",
            cena: ["floresta", "vale", "montanha", "caverna"],
            escala: 8,
            cor: "74,222,128"
        }
    ];

    // ==============================
    // VARIÁVEIS DE CONTROLE
    // ==============================
    let atual = 0;       // em qual parte da história estamos
    let digitando = false;
    let timer = null;
    let textoAtual = "";
    const escolhidas = {}; // lembra a escolha de cada parte: { 2: 0 }
    const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ==============================
    // ELEMENTOS DA TELA
    // ==============================
    const titulo = document.getElementById("titulo");
    const texto = document.getElementById("texto");
    const escolhas = document.getElementById("escolhas");
    const pontos = document.getElementById("pontos");
    const seta = document.getElementById("seta");
    const cena = document.getElementById("cena");
    const dialogo = document.getElementById("dialogo");
    const estrelas = document.getElementById("estrelas");
    const botaoAvancar = document.getElementById("avancar");
    const botaoVoltar = document.getElementById("voltar");

    // bolinhas de progresso
    falas.forEach(() => pontos.appendChild(document.createElement("span")));

    // estrelinhas em posições aleatórias
    for (let i = 0; i < 40; i++) {
        const e = document.createElement("i");
        e.style.left = Math.random() * 100 + "%";
        e.style.top = Math.random() * 100 + "%";
        e.style.setProperty("--d", Math.random() * 3 + "s");
        e.style.setProperty("--t", 2 + Math.random() * 2 + "s");
        estrelas.appendChild(e);
    }

    // ==============================
    // DESENHAR OS SPRITES
    // Lê as letras e pinta um quadradinho (pixel) para cada uma.
    // ==============================
    function desenhar(nome) {
        const linhas = sprites[nome];
        const c = document.createElement("canvas");
        c.width = linhas[0].length;
        c.height = linhas.length;
        c.className = "sprite " + nome;
        c.style.setProperty("--c", c.width); // largura em pixels do desenho

        const ctx = c.getContext("2d");
        linhas.forEach((linha, y) => {
            [...linha].forEach((letra, x) => {
                if (letra === ".") return;
                ctx.fillStyle = cores[letra];
                ctx.fillRect(x, y, 1, 1);
            });
        });
        return c;
    }

    function desenharCena(fala) {
        cena.innerHTML = "";
        cena.style.setProperty("--e", fala.escala + "px");
        cena.style.setProperty("--aura", fala.cor);
        fala.cena.forEach((nome) => cena.appendChild(desenhar(nome)));

        // reinicia a animação de entrada (e o tremor, se tiver)
        cena.classList.remove("nova", "tremer");
        void cena.offsetWidth;
        cena.classList.add("nova");
        if (fala.efeito) cena.classList.add(fala.efeito);
    }

    // ==============================
    // EFEITO DE DIGITAÇÃO
    // Pausa um pouquinho nas vírgulas e pontos, fica mais natural.
    // ==============================
    function escrever(conteudo) {
        clearTimeout(timer);
        textoAtual = conteudo;
        texto.textContent = "";

        if (reduzir) { // quem prefere menos animação vê o texto direto
            terminarDigitacao();
            return;
        }

        digitando = true;
        atualizarBotoes();

        let i = 0;
        function proximaLetra() {
            const letra = conteudo[i];
            texto.textContent += letra;
            i++;
            if (i >= conteudo.length) return terminarDigitacao();

            const pausa = ".!?".includes(letra) ? 350 : letra === "," ? 150 : 25;
            timer = setTimeout(proximaLetra, pausa);
        }
        proximaLetra();
    }

    function terminarDigitacao() {
        clearTimeout(timer);
        texto.textContent = textoAtual;
        digitando = false;
        atualizarBotoes();
    }

    // ==============================
    // BOTÕES, BOLINHAS E SETINHA
    // ==============================
    function atualizarBotoes() {
        const ultima = atual === falas.length - 1;
        const precisaEscolher = falas[atual].escolhas && escolhidas[atual] === undefined;

        botaoAvancar.textContent = ultima ? "COMEÇAR ▶" : "CONTINUAR ▶";
        botaoAvancar.disabled = precisaEscolher;
        botaoVoltar.disabled = atual === 0;

        seta.classList.toggle("pisca", !digitando);

        pontos.querySelectorAll("span").forEach((ponto, i) => {
            ponto.className = i < atual ? "feito" : i === atual ? "ativo" : "";
        });
    }

    // ==============================
    // ESCOLHAS
    // ==============================
    function mostrarEscolhas(fala) {
        escolhas.innerHTML = "";
        if (!fala.escolhas) return;

        fala.escolhas.forEach((opcao, i) => {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.textContent = opcao.texto;

            botao.addEventListener("click", () => {
                escolhidas[atual] = i;
                caminho = opcao.caminho;
                sessionStorage.setItem("caminho", caminho); // dá pra usar no cadastro depois
                marcarEscolha();
                escrever(opcao.resultado);
            });

            escolhas.appendChild(botao);
        });
    }

    // pinta o botão escolhido e destaca o desenho correspondente
    function marcarEscolha() {
        const escolhida = escolhidas[atual];
        const fala = falas[atual];

        escolhas.querySelectorAll("button").forEach((b, n) => {
            b.classList.toggle("escolhida", n === escolhida);
            b.setAttribute("aria-pressed", n === escolhida);
        });

        if (escolhida === undefined || !fala.escolhas) return;

        const alvo = fala.escolhas[escolhida].item;
        cena.querySelectorAll("canvas").forEach((c, n) => {
            c.classList.toggle("escolhido", n === alvo);
            c.classList.toggle("apagado", n !== alvo);
        });
    }

    // ==============================
    // MOSTRA UMA PARTE DA HISTÓRIA
    // ==============================
    function mostrarFala() {
        const fala = falas[atual];

        titulo.textContent = fala.titulo;
        desenharCena(fala);
        mostrarEscolhas(fala);
        marcarEscolha();

        // o texto pode ser uma frase ou uma função que monta a frase
        escrever(typeof fala.texto === "function" ? fala.texto() : fala.texto);
        atualizarBotoes();
    }

    function proximo() {
        if (digitando) { // texto ainda aparecendo: o clique só completa ele
            terminarDigitacao();
            return;
        }

        if (falas[atual].escolhas && escolhidas[atual] === undefined) return;

        if (atual < falas.length - 1) {
            atual++;
            mostrarFala();
        } else {
            // escurece a tela e depois vai para o cadastro
            document.body.classList.add("saindo");
            setTimeout(() => { window.location.href = "cadastro_usuario.php"; }, 450);
        }
    }

    function anterior() {
        if (atual === 0) return;
        atual--;
        mostrarFala();
    }

    // ==============================
    // EVENTOS
    // ==============================
    botaoAvancar.addEventListener("click", proximo);
    botaoVoltar.addEventListener("click", anterior);

    // clicar na caixa também completa o texto
    dialogo.addEventListener("click", (e) => {
        if (digitando && !e.target.closest("button")) terminarDigitacao();
    });

    document.addEventListener("keydown", (e) => {
        // Enter/Espaço em cima de um botão já faz o clique sozinho;
        // sem esta checagem o "proximo" rodava duas vezes
        const emBotao = e.target.closest("button, a");

        if ((e.key === "Enter" || e.key === " ") && !emBotao) {
            e.preventDefault();
            if (!e.repeat) proximo();
        }
        if (e.key === "ArrowRight") proximo();
        if (e.key === "ArrowLeft") anterior();
    });

    mostrarFala();
});