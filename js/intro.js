/* PIXEL QUEST - tela inicial: estrelas, parallax, digitação e música de fundo */
(() => {
    'use strict';

    const $ = (s) => document.querySelector(s);
    const body = document.body;
    const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ======================================================================
       MÚSICA DE FUNDO (chiptune 8-bit gerada por código, sem arquivos)
       - Trilha original: clima leve de aventura/"código", em Dó maior,
         96 BPM, 16 compassos (parte A + parte B), com baixo, pad suave,
         arpejo, melodia e bateria lo-fi.
       - É renderizada uma vez em memória e tocada em loop infinito, sem
         nenhuma pausa entre as repetições.
       - Tenta iniciar assim que a página carrega; se o navegador bloquear
         (política de autoplay), inicia no primeiro toque/clique/tecla.
       - Para na hora em que o usuário sai da página (START, link, voltar,
         fechar aba), sem continuar em segundo plano nem duplicar.
       ====================================================================== */

    const VOLUME = 0.35;                 // volume geral (0 a 1)
    const btnSom = $('#botaoSom');

    let mudo = false;                    // preferência do botão SOM
    let tocando = false;                 // evita iniciar duas vezes (sem sobreposição)
    let encerrada = false;               // true depois que o usuário sai da página
    let ctx = null;                      // AudioContext
    let ganho = null;                    // controle de volume
    let fonte = null;                    // fonte do buffer em loop
    let buffer = null;                   // música pronta

    try { mudo = localStorage.getItem('pq_mudo') === '1'; } catch (e) {}

    /* ---------- partitura (Dó maior, 16 compassos, 16 passos por compasso) ---------- */

    const BPM = 96;
    const PASSOS_COMPASSO = 16;          // semicolcheias por compasso
    const PASSO = 60 / BPM / 4;          // duração de uma semicolcheia, em segundos

    // b = nota do baixo, a = notas do acorde (números MIDI)
    const PROGRESSAO = [
        // parte A
        { b: 48, a: [60, 64, 67, 71] },  // Cmaj7
        { b: 45, a: [57, 60, 64, 67] },  // Am7
        { b: 41, a: [53, 57, 60, 64] },  // Fmaj7
        { b: 43, a: [55, 59, 62, 67] },  // G
        { b: 48, a: [60, 64, 67, 71] },  // Cmaj7
        { b: 45, a: [57, 60, 64, 67] },  // Am7
        { b: 41, a: [53, 57, 60, 64] },  // Fmaj7
        { b: 43, a: [55, 59, 62, 67] },  // G
        // parte B
        { b: 41, a: [53, 57, 60, 65] },  // F
        { b: 43, a: [55, 59, 62, 67] },  // G
        { b: 40, a: [52, 55, 59, 62] },  // Em7
        { b: 45, a: [57, 60, 64, 69] },  // Am
        { b: 41, a: [53, 57, 60, 65] },  // F
        { b: 43, a: [55, 59, 62, 67] },  // G
        { b: 48, a: [60, 64, 67, 72] },  // C
        { b: 43, a: [55, 59, 62, 67] },  // G (leva de volta ao início)
    ];

    // melodia: por compasso, cada nota é [passo de início (0-15), nota MIDI, duração em passos]
    const MELODIA = [
        // parte A
        [[0, 76, 3], [3, 79, 1], [4, 83, 4], [8, 81, 2], [10, 79, 2], [12, 76, 4]],
        [[0, 72, 2], [2, 76, 2], [4, 79, 3], [7, 76, 1], [8, 81, 4], [12, 79, 2], [14, 76, 2]],
        [[0, 77, 3], [3, 76, 1], [4, 72, 4], [8, 77, 2], [10, 81, 2], [12, 84, 4]],
        [[0, 83, 3], [3, 81, 1], [4, 79, 4], [8, 74, 2], [10, 79, 2], [12, 83, 4]],
        [[0, 76, 3], [3, 79, 1], [4, 83, 4], [8, 84, 2], [10, 83, 2], [12, 79, 4]],
        [[0, 81, 3], [3, 79, 1], [4, 76, 4], [8, 72, 2], [10, 76, 2], [12, 79, 2], [14, 81, 2]],
        [[0, 84, 3], [3, 81, 1], [4, 77, 4], [8, 81, 2], [10, 79, 2], [12, 77, 4]],
        [[0, 79, 4], [4, 74, 2], [6, 77, 2], [8, 79, 4], [12, 71, 2], [14, 74, 2]],
        // parte B
        [[0, 81, 4], [4, 77, 2], [6, 81, 2], [8, 84, 4], [12, 81, 4]],
        [[0, 83, 4], [4, 79, 2], [6, 83, 2], [8, 86, 4], [12, 83, 4]],
        [[0, 79, 3], [3, 76, 1], [4, 79, 4], [8, 83, 2], [10, 79, 2], [12, 76, 4]],
        [[0, 81, 3], [3, 76, 1], [4, 72, 4], [8, 76, 2], [10, 81, 2], [12, 84, 4]],
        [[0, 84, 3], [3, 81, 1], [4, 77, 4], [8, 81, 2], [10, 84, 2], [12, 81, 4]],
        [[0, 83, 3], [3, 86, 1], [4, 83, 4], [8, 79, 2], [10, 83, 2], [12, 86, 4]],
        [[0, 84, 4], [4, 79, 2], [6, 76, 2], [8, 79, 2], [10, 84, 2], [12, 84, 4]],
        [[0, 83, 2], [2, 79, 2], [4, 74, 4], [8, 79, 2], [10, 74, 2], [12, 71, 2], [14, 74, 2]],
    ];

    const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

    /* ---------- síntese: toca tudo num buffer e devolve pronto ---------- */

    function criarContexto() {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try {
            ctx = new AC();              // nasce "suspenso" até haver um gesto do usuário
            ganho = ctx.createGain();
            ganho.gain.value = 0;
            ganho.connect(ctx.destination);
            // se o navegador liberar o áudio sozinho, começa na hora
            ctx.addEventListener('statechange', () => {
                if (ctx.state === 'running') iniciar();
            });
        } catch (e) { ctx = null; ganho = null; }
    }

    async function gerarMusica() {
        const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!ctx || !OAC) return;

        try {
            const taxa = ctx.sampleRate;
            const passos = PROGRESSAO.length * PASSOS_COMPASSO;
            const total = passos * PASSO;
            const oc = new OAC(1, Math.ceil(total * taxa), taxa);

            const mestre = oc.createGain();
            mestre.gain.value = 0.9;
            mestre.connect(oc.destination);

            // onda de pulso (duty 0.25 = som "fino" de NES; 0.5 = quadrada)
            const pulso = (duty) => {
                const n = 32, re = new Float32Array(n), im = new Float32Array(n);
                for (let k = 1; k < n; k++) {
                    im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
                }
                return oc.createPeriodicWave(re, im);
            };
            const onda25 = pulso(0.25);
            const onda50 = pulso(0.5);

            // nota com envelope curtinho; "sust" deixa a nota mais sustentada (para a melodia)
            const tom = (onda, freq, t, dur, vol, sust) => {
                const o = oc.createOscillator();
                const g = oc.createGain();
                if (typeof onda === 'string') o.type = onda; else o.setPeriodicWave(onda);
                o.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0.0001, t);
                g.gain.linearRampToValueAtTime(vol, t + 0.008);
                if (sust) g.gain.exponentialRampToValueAtTime(vol * 0.6, t + dur * 0.6);
                g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                o.connect(g).connect(mestre);
                o.start(t);
                o.stop(t + dur + 0.01);
            };

            // ruído para caixa e chimbal
            const ruido = oc.createBuffer(1, taxa, taxa);
            const dados = ruido.getChannelData(0);
            for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;

            const chiado = (t, dur, vol, corte) => {
                const s = oc.createBufferSource();
                const f = oc.createBiquadFilter();
                const g = oc.createGain();
                s.buffer = ruido;
                f.type = 'highpass';
                f.frequency.value = corte;
                g.gain.setValueAtTime(vol, t);
                g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                s.connect(f).connect(g).connect(mestre);
                s.start(t);
                s.stop(t + dur);
            };

            const bumbo = (t) => {
                const o = oc.createOscillator();
                const g = oc.createGain();
                o.type = 'sine';
                o.frequency.setValueAtTime(150, t);
                o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
                g.gain.setValueAtTime(0.35, t);
                g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
                o.connect(g).connect(mestre);
                o.start(t);
                o.stop(t + 0.18);
            };

            const ARPEJO = [0, 1, 2, 3, 2, 1, 2, 3];   // arpejo em colcheias (passos pares)
            const BAIXO = { 0: 0, 3: 0, 6: 12, 8: 0, 11: 0, 14: 12 };   // passo -> oitava extra

            for (let i = 0; i < passos; i++) {
                const t = i * PASSO;
                const acorde = PROGRESSAO[(i / PASSOS_COMPASSO) | 0];
                const p = i % PASSOS_COMPASSO;                     // semicolcheia dentro do compasso

                // pad suave no início do compasso (triângulo, bem baixinho)
                if (p === 0) {
                    for (let k = 0; k < 3; k++) {
                        tom('triangle', hz(acorde.a[k] - 12), t, PASSO * PASSOS_COMPASSO * 0.95, 0.022);
                    }
                }

                // baixo (triângulo), com oitava em alguns tempos
                if (p in BAIXO) {
                    tom('triangle', hz(acorde.b + BAIXO[p]), t, PASSO * 2.6, 0.28);
                }

                // arpejo do acorde (pulso fino, bem baixinho)
                if (p % 2 === 0) {
                    tom(onda25, hz(acorde.a[ARPEJO[p / 2]] + 12), t, PASSO * 1.8, 0.04);
                }

                // bateria lo-fi: bumbo em 0 e 10, caixa em 4 e 12, chimbal nas colcheias
                if (p === 0 || p === 10) bumbo(t);
                if (p === 4 || p === 12) chiado(t, 0.11, 0.08, 1800);
                if (p % 2 === 0) chiado(t, 0.03, p % 4 === 2 ? 0.045 : 0.025, 6000);
            }

            // melodia (onda quadrada)
            MELODIA.forEach((compasso, c) => {
                compasso.forEach(([s, nota, len]) => {
                    const t = (c * PASSOS_COMPASSO + s) * PASSO;
                    const dur = Math.min(len * PASSO * 0.95, total - t - 0.02);
                    if (dur > 0.02) tom(onda50, hz(nota), t, dur, 0.075, true);
                });
            });

            buffer = await oc.startRendering();
        } catch (e) { buffer = null; }
    }

    const pronto = (async () => { criarContexto(); await gerarMusica(); })();

    /* ---------- controle: iniciar, volume e parar ---------- */

    // aplica volume / mudo (com pequena suavização para não estalar)
    function aplicarVolume(suave) {
        if (!ctx || !ganho) return;
        ganho.gain.setTargetAtTime(mudo ? 0 : VOLUME, ctx.currentTime, suave ? 0.6 : 0.03);
    }

    function tocarBuffer() {
        fonte = ctx.createBufferSource();
        fonte.buffer = buffer;
        fonte.loop = true;               // loop infinito, sem pausa entre repetições
        fonte.connect(ganho);
        ganho.gain.cancelScheduledValues(0);
        ganho.gain.value = 0;
        fonte.start();
        tocando = true;
        aplicarVolume(true);             // entra com fade-in suave
    }

    // inicia a música (pode ser chamada várias vezes: só toca uma vez)
    function iniciar() {
        if (encerrada || tocando) return;

        // precisa ser chamado dentro do gesto do usuário (exigência do Safari/Chrome)
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});

        pronto.then(() => {
            if (encerrada || tocando || !buffer || !ctx) return;
            if (ctx.state === 'running') tocarBuffer();
        });
    }

    // para tudo imediatamente (usado ao sair da página)
    function parar() {
        encerrada = true;
        tocando = false;
        if (fonte) {
            try { fonte.stop(); } catch (e) {}
            try { fonte.disconnect(); } catch (e) {}
            fonte = null;
        }
        if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
    }

    // 1) tenta tocar assim que a página carrega
    iniciar();

    // 2) se foi bloqueado, toca no primeiro gesto do usuário
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach((ev) =>
        document.addEventListener(ev, iniciar, { passive: true })
    );

    // voltou para a aba: garante que o áudio não ficou suspenso
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !encerrada && ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
    });

    // saiu da página (navegação, fechar aba, trocar de endereço): para na hora
    window.addEventListener('pagehide', parar);

    // qualquer link que leve a outra página também para o som imediatamente
    document.addEventListener('click', (e) => {
        const a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || a.target === '_blank') return;
        parar();
    });

    // botão SOM: liga/desliga a música (a escolha fica salva)
    function atualizarBotao() {
        btnSom.textContent = mudo ? '♪ SOM: DESLIGADO' : '♪ SOM: LIGADO';
    }
    atualizarBotao();

    btnSom.addEventListener('click', () => {
        mudo = !mudo;
        try { localStorage.setItem('pq_mudo', mudo ? '1' : '0'); } catch (e) {}
        atualizarBotao();
        aplicarVolume(false);
        iniciar();
    });

    /* ---------- ESTRELAS + PARALLAX ---------- */

    const quadro = $('#quadro');
    const cv = $('#estrelas');
    const g = cv.getContext('2d');
    const CORES = ['#ffffff', '#ffffff', '#ffe9a8', '#c4a5ff'];

    let S = 0, estrelas = [], cad = null, proxCad = 4000;
    let alvoX = 0, alvoY = 0, nx = 0, ny = 0;

    function montar() {
        S = cv.clientWidth || 1000;
        cv.width = cv.height = S;
        const u = Math.max(2, Math.round(S / 450));
        estrelas = Array.from({ length: Math.round(S / 6) }, () => {
            const prof = Math.random();
            const grande = prof > 0.85;
            return {
                x: Math.random() * S,
                y: Math.random() * S * 0.72,      // só no céu, acima do horizonte
                u: grande ? u * 2 : u,
                c: CORES[(Math.random() * CORES.length) | 0],
                f: 0.8 + Math.random() * 2.2,      // velocidade do brilho
                p: Math.random() * 6.28,
                z: 0.3 + prof,                     // profundidade (parallax)
                cruz: grande,
            };
        });
        desenhar(performance.now(), 0);
    }

    function desenhar(t, dt) {
        g.clearRect(0, 0, S, S);

        for (const e of estrelas) {
            const brilho = reduzir ? 0.8 : 0.25 + 0.75 * (0.5 + 0.5 * Math.sin((t / 1000) * e.f + e.p));
            g.globalAlpha = Math.ceil(brilho * 4) / 4;   // 4 níveis: brilho "em degraus", estilo pixel
            g.fillStyle = e.c;
            const x = Math.round((e.x - nx * e.z * 28) / e.u) * e.u;
            const y = Math.round((e.y - ny * e.z * 28) / e.u) * e.u;
            g.fillRect(x, y, e.u, e.u);
            if (e.cruz) {
                g.fillRect(x - e.u, y, e.u, e.u);
                g.fillRect(x + e.u, y, e.u, e.u);
                g.fillRect(x, y - e.u, e.u, e.u);
                g.fillRect(x, y + e.u, e.u, e.u);
            }
        }

        // estrela cadente de tempos em tempos
        if (!reduzir) {
            if (!cad && t > proxCad) {
                cad = { x: S * (0.3 + Math.random() * 0.5), y: S * (0.05 + Math.random() * 0.2) };
                proxCad = t + 7000 + Math.random() * 6000;
            }
            if (cad) {
                const u = Math.max(2, Math.round(S / 450));
                cad.x += S * 0.6 * (dt / 1000);
                cad.y += S * 0.3 * (dt / 1000);
                g.fillStyle = '#fff';
                for (let i = 0; i < 10; i++) {
                    g.globalAlpha = 1 - i / 10;
                    g.fillRect(Math.round((cad.x - i * u * 2) / u) * u, Math.round((cad.y - i * u) / u) * u, u * 2, u);
                }
                if (cad.x > S || cad.y > S * 0.7) cad = null;
            }
        }
        g.globalAlpha = 1;
    }

    let ultimo = performance.now();
    function loop(t) {
        const dt = Math.min(64, t - ultimo);
        ultimo = t;
        const deriva = Math.sin(t / 5000) * 0.06;   // movimento sutil para quem não tem mouse
        nx += (alvoX + deriva - nx) * 0.06;
        ny += (alvoY - ny) * 0.06;
        quadro.style.setProperty('--px', (-nx * 16).toFixed(2) + 'px');
        quadro.style.setProperty('--py', (-ny * 16).toFixed(2) + 'px');
        desenhar(t, dt);
        requestAnimationFrame(loop);
    }

    window.addEventListener('pointermove', (e) => {
        alvoX = e.clientX / innerWidth - 0.5;
        alvoY = e.clientY / innerHeight - 0.5;
    });
    document.addEventListener('pointerleave', () => { alvoX = alvoY = 0; });

    let tr;
    window.addEventListener('resize', () => { clearTimeout(tr); tr = setTimeout(montar, 150); });

    montar();
    if (!reduzir) requestAnimationFrame(loop);

    /* ---------- ENTRADA: digitação da frase e botão START ---------- */

    const frase = $('#frase');
    const texto = frase.textContent.trim();
    frase.textContent = '';

    function revelar() {
        $('.botao-start').classList.add('mostrar');
        $('.indicacao').classList.add('mostrar');
    }

    function digitar() {
        frase.classList.add('digitando');
        if (reduzir) { frase.textContent = texto; revelar(); return; }

        let i = 0;
        (function passo() {
            frase.textContent = texto.slice(0, ++i);
            if (i < texto.length) setTimeout(passo, 55 + Math.random() * 60);
            else setTimeout(revelar, 500);
        })();
    }

    // começa a digitar depois que título e subtítulo terminam de aparecer
    setTimeout(digitar, reduzir ? 0 : 2900);

    /* Voltar do histórico (botão "voltar" do navegador): a página volta do cache
       com a tela escura da saída ainda ligada. Aqui ela é desligada e a música
       recomeça (já foi parada pelo pagehide). */
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            body.classList.remove('saindo-pagina');
            encerrada = false;
            tocando = false;
            iniciar();
        }
    });

    /* ---------- BOTÃO START ---------- */

    const start = $('.botao-start');

    start.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        e.preventDefault();
        parar();                                     // som para imediatamente
        body.classList.add('saindo-pagina');
        setTimeout(() => { location.href = start.href; }, reduzir ? 0 : 500);
    });
})();