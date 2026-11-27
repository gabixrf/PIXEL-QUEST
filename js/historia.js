document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // 1) PIXEL ART EM TEXTO (preservada do original)
    // ==============================
    const cores = {
        k: "#12143a", w: "#ffffff", p: "#c4a5ff", P: "#a77bff", d: "#7855e8",
        y: "#ffd36b", o: "#ffb900", g: "#4ade80", G: "#1f9d55", n: "#8b5a2b",
        s: "#9299ad", S: "#5b6490", b: "#38bdf8", v: "#0a0f2c"
    };

    const sprites = {
        cristal: [
            ".....kk.....", "....kppk....", "...kpwppk...", "..kpwpPPPk..", ".kpwpPPPPPk.", "kpwpPPPPPPPk",
            "kpwPPPPPPPdk", "kpPPPPPPPPdk", ".kPPPPPPPdk.", "..kPPPPPdk..", "...kPPPdk...", "....kPdk....", ".....kk....."
        ],
        cristalPartido: [
            ".....kk.....", "....kppk....", "...kpwkpk...", "..kpwpkPPk..", ".kpwpPkPPPk.", "kpwpPPkPPPdk",
            "kpwPPkkPPPdk", "kpPPPkPPPPdk", ".kPPPPkPPdk.", "..kPPkPPdk..", "...kPkPdk...", "....kkdk....", ".....kk....."
        ],
        caco: [".kk..", "kppk.", "kwPdk", ".kPdk", "..kdk", "...k."],
        espada: [
            "...k...", "..kwk..", "..kwk..", "..kwk..", "..kwk..", "..kwk..", "..kwk..",
            "kkkkkkk", "kyyoyyk", "kkkkkkk", "..knk..", "..knk..", "..kyk..", "...k..."
        ],
        livro: [
            "kkkkkkkkkk", "kPPPPPPPPk", "kPPPyyPPPk", "kPPyyyyPPk", "kPPPyyPPPk",
            "kPPPPPPPPk", "kddddddddk", "kkkkkkkkkk", "kwwwwwwwwk", "kkkkkkkkkk"
        ],
        floresta: [
            "...kkkk...", "..kGggGk..", ".kGggggGk.", "kGggGggggk", "kGgggggGGk", ".kGGggGGk.",
            "..kkGGkk..", "...knnk...", "...knnk...", "...knnk...", "..kkkkkk.."
        ],
        vale: [
            "........yy", "........yy", "..........", "...kkk....", "..kgggk...", ".kgggggk.k",
            "kggggggkgk", "kggbbgggGk", "kgbbbgggGk", "kggbbggGGk", "kkkkkkkkkk"
        ],
        montanha: [
            "....kk....", "...kwwk...", "..kwwwwk..", "..kwsswk..", ".kssSSssk.",
            ".ksSSSSsk.", "kssSSSSssk", "ksSSSSSSsk", "kssSSSSssk", "kkkkkkkkkk"
        ],
        caverna: [
            "..kkkkkk..", ".kSSSSSSk.", "kSSssssSSk", "kSsvvvvsSk", "kSvvvvvvSk",
            "kSvvvvvvSk", "kSvvvvvvSk", "kSsvyvvsSk", "kSsvvvvsSk", "kkkkkkkkkk"
        ]
    };

    // ==============================
    // 2) A HISTÓRIA (textos originais; [[ ]] só marca o destaque dourado)
    //    "emoji" é só ambientação, acima de cada trecho
    // ==============================
    let caminho = sessionStorage.getItem("caminho") || "explorador";

    const falas = [
        {
            emoji: "🌌",
            titulo: "O Reino de Asteria",
            texto: "Além das montanhas existe [[Asteria]], um reino feito de código e imaginação. No coração dele brilha o [[Cristal do Conhecimento]].",
            cena: ["cristal"], escala: 12, cor: "172,130,255"
        },
        {
            emoji: "💥",
            titulo: "A Grande Falha",
            texto: "Um dia, o [[cristal se partiu]]. Seus fragmentos se espalharam pelas [[quatro regiões]] e o reino perdeu a sua luz.",
            cena: ["caco", "caco", "cristalPartido", "caco", "caco"],
            escala: 12, cor: "248,113,113", efeito: "tremer"
        },
        {
            emoji: "🏰",
            titulo: "Uma Escolha",
            texto: "Os guardiões procuram alguém para recuperar os fragmentos. Como você quer começar a sua jornada?",
            cena: ["espada", "livro"], escala: 10, cor: "255,211,107",
            escolhas: [
                {
                    texto: "⚔ Explorar o desconhecido",
                    resultado: "Coragem não falta! Você parte sem medo dos desafios que vêm pela frente.",
                    caminho: "explorador", item: 0
                },
                {
                    texto: "✦ Buscar conhecimento",
                    resultado: "Boa ideia! Você vai aprender os segredos do código antes de enfrentar os desafios.",
                    caminho: "sabio", item: 1
                }
            ]
        },
        {
            emoji: "🌳",
            titulo: "Sua História Começa",
            texto: () =>
                (caminho === "sabio"
                    ? "Com a mente afiada, você segue em frente. "
                    : "Com a espada em punho, você segue em frente. ") +
                "[[Floresta, vale, montanhas e cavernas]] esperam por você. A cada desafio vencido, o cristal brilha um pouquinho mais.",
            cena: ["floresta", "vale", "montanha", "caverna"], escala: 8, cor: "74,222,128"
        }
    ];

    const romanos = ["I", "II", "III", "IV"];

    // ==============================
    // CONTROLE
    // ==============================
    const historia = document.getElementById("historia");
    const botaoPular = document.getElementById("pular");
    const final = document.getElementById("final");
    const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let run = 0;               // muda a cada "Pular": cancela a animação em andamento
    let redirecionar = null;

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = (tag, classe) => Object.assign(document.createElement(tag), { className: classe || "" });
    const textoDe = (f) => (typeof f.texto === "function" ? f.texto() : f.texto);

    function seguir() {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reduzir ? "auto" : "smooth" });
    }

    // ==============================
    // SPRITES
    // ==============================
    function desenhar(nome) {
        const linhas = sprites[nome];
        const c = document.createElement("canvas");
        c.width = linhas[0].length;
        c.height = linhas.length;
        c.className = "sprite " + nome;
        c.style.setProperty("--c", c.width);
        const g = c.getContext("2d");
        linhas.forEach((linha, y) => [...linha].forEach((l, x) => {
            if (l === ".") return;
            g.fillStyle = cores[l];
            g.fillRect(x, y, 1, 1);
        }));
        return c;
    }

    // ==============================
    // TEXTO: cada letra vira um <span> (espaço já reservado, sem pulos de layout)
    // ==============================
    function montar(alvoFinal, conteudo) {
        alvoFinal.innerHTML = "";
        const letras = [];
        let hl = false;
        for (const parte of conteudo.split(/(\[\[|\]\])/)) {
            if (parte === "[[") { hl = true; continue; }
            if (parte === "]]") { hl = false; continue; }
            const alvo = hl ? el("em", "h-hl") : alvoFinal;
            parte.split(/( )/).forEach((palavra) => {
                if (palavra === "") return;
                if (palavra === " ") { alvo.appendChild(document.createTextNode(" ")); return; }
                const w = el("span", "w");
                [...palavra].forEach((ch) => {
                    const s = document.createElement("span");
                    s.textContent = ch;
                    w.appendChild(s);
                    letras.push(s);
                });
                alvo.appendChild(w);
            });
            if (hl) alvoFinal.appendChild(alvo);
        }
        return letras;
    }

    // devolve false se o "Pular" cancelou no meio
    async function digitar(letras, tok, vel) {
        let anterior = null;
        for (let i = 0; i < letras.length; i++) {
            if (tok !== run) return false;
            if (anterior) anterior.classList.remove("cur");
            const l = letras[i];
            l.classList.add("on", "cur");
            anterior = l;
            if (i % 40 === 0) seguir();
            const ch = l.textContent;
            await wait(".!?".includes(ch) ? 340 : ch === "," ? 150 : vel);
        }
        if (anterior) anterior.classList.remove("cur");
        seguir();
        return tok === run;
    }

    // ==============================
    // CENA
    // ==============================
    function criarCena(f, i) {
        const sec = el("section", "h-cena");
        const emoji = el("div", "h-emoji");
        emoji.textContent = f.emoji;
        emoji.setAttribute("aria-hidden", "true");

        const palco = el("div", "h-palco");
        palco.setAttribute("aria-hidden", "true");
        palco.style.setProperty("--e", f.escala + "px");
        palco.style.setProperty("--aura", f.cor);
        f.cena.forEach((nome, n) => {
            const s = desenhar(nome);
            s.style.setProperty("--i", n);
            palco.appendChild(s);
        });

        const cap = el("p", "h-capitulo");
        cap.textContent = "CAPÍTULO " + romanos[i];
        const tit = el("h2", "h-titulo");
        const tx = el("p", "h-texto");
        const esc = el("div", "h-escolhas");
        const res = el("p", "h-texto h-resultado");

        sec.append(emoji, palco, cap, tit, tx, esc, res);
        historia.appendChild(sec);
        return { sec, emoji, palco, cap, tit, tx, esc, res };
    }

    function marcarEscolha(c, f, e) {
        c.esc.querySelectorAll("button").forEach((b, n) => {
            b.classList.toggle("escolhida", n === e);
            b.disabled = true;
        });
        const alvo = f.escolhas[e].item;
        c.palco.querySelectorAll("canvas").forEach((s, n) => {
            s.classList.toggle("escolhido", n === alvo);
            s.classList.toggle("apagado", n !== alvo);
        });
    }

    function esperarEscolha(c, f) {
        return new Promise((resolve) => {
            f.escolhas.forEach((opcao, i) => {
                const b = el("button", "");
                b.type = "button";
                b.textContent = opcao.texto;
                b.addEventListener("click", () => {
                    caminho = opcao.caminho;
                    sessionStorage.setItem("caminho", caminho);
                    marcarEscolha(c, f, i);
                    resolve(i);
                });
                c.esc.appendChild(b);
            });
            c.esc.classList.add("visivel");
            seguir();
        });
    }

    // ==============================
    // REPRODUÇÃO NORMAL (automática)
    // ==============================
    async function tocar(tok) {
        for (let i = 0; i < falas.length; i++) {
            const f = falas[i];
            const c = criarCena(f, i);
            seguir();

            await wait(600);               if (tok !== run) return;
            c.emoji.classList.add("visivel");
            await wait(900);               if (tok !== run) return;
            c.palco.classList.add("visivel");
            if (f.efeito) c.palco.classList.add(f.efeito);
            await wait(1100);              if (tok !== run) return;

            c.cap.classList.add("visivel");
            if (!await digitar(montar(c.tit, f.titulo), tok, 80)) return;
            await wait(500);               if (tok !== run) return;

            if (!await digitar(montar(c.tx, textoDe(f)), tok, 70)) return;

            if (f.escolhas) {
                await wait(700);           if (tok !== run) return;
                const e = await esperarEscolha(c, f);
                if (tok !== run) return;
                await wait(600);           if (tok !== run) return;
                if (!await digitar(montar(c.res, f.escolhas[e].resultado), tok, 70)) return;
            }

            await wait(1800);              if (tok !== run) return;
        }
        await wait(800);                   if (tok !== run) return;
        mostrarFinal(true);
    }

    // ==============================
    // PULAR: mostra tudo de uma vez
    // ==============================
    function mostrarTudo() {
        historia.innerHTML = "";
        falas.forEach((f, i) => {
            const c = criarCena(f, i);
            [c.emoji, c.palco, c.cap].forEach((x) => x.classList.add("visivel"));
            c.tit.textContent = f.titulo;
            montar(c.tx, textoDe(f)).forEach((l) => l.classList.add("on"));
            if (f.escolhas) {
                const e = Math.max(0, f.escolhas.findIndex((o) => o.caminho === caminho));
                f.escolhas.forEach((opcao) => {
                    const b = el("button", "");
                    b.type = "button";
                    b.textContent = opcao.texto;
                    c.esc.appendChild(b);
                });
                c.esc.classList.add("visivel");
                marcarEscolha(c, f, e);
                montar(c.res, f.escolhas[e].resultado).forEach((l) => l.classList.add("on"));
            }
        });
        mostrarFinal(false);
    }

    function pular() {
        run++;                              // cancela qualquer digitação em andamento
        clearTimeout(redirecionar);
        mostrarTudo();
        window.scrollTo({ top: 0, behavior: "auto" });
    }

    // ==============================
    // FINAL
    // ==============================
    function mostrarFinal(auto) {
        botaoPular.hidden = true;
        final.hidden = false;
        final.focus({ preventScroll: true });
        if (auto) {
            seguir();
            redirecionar = setTimeout(sair, 9000);
        }
    }

    function sair() {
        clearTimeout(redirecionar);
        document.body.classList.add("saindo");
        setTimeout(() => { window.location.href = "cadastro_usuario.php"; }, 450);
    }

    botaoPular.addEventListener("click", pular);
    final.addEventListener("click", (e) => { e.preventDefault(); sair(); });

    document.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && !final.hidden && !e.target.closest("button")) {
            e.preventDefault();
            sair();
        }
    });

    // ==============================
    // INÍCIO
    // ==============================
    if (reduzir) mostrarTudo();
    else tocar(run);
});