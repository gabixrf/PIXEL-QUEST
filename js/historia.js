/* =====================================================
   PIXEL QUEST - TELA DE HISTÓRIA
   - narrativa em capítulos com efeito de digitação
   - música contínua entre as páginas (retoma de onde parou)
   - efeitos sonoros sintetizados (sem arquivos externos)
   - partículas e runas em canvas
===================================================== */

(() => {
    'use strict';

    /* ---------------------------------------------
       CONFIGURAÇÃO  (ajuste aqui se necessário)
    --------------------------------------------- */
    const CONFIG = {
        // Mesmo arquivo de música usado na tela inicial
        MUSICA_SRC: 'audio/musica-fundo.mp3',

        // Chaves compartilhadas com a tela inicial (veja o trecho para o index)
        CHAVE_TEMPO: 'pq_musica_tempo',
        CHAVE_MUDO: 'pq_musica_mudo',

        VOLUME: 0.35,              // volume agradável da música
        VOLUME_SFX: 0.04,          // efeitos bem discretos
        VELOCIDADE: 30,            // ms por letra
        PROXIMA_TELA: 'cadastro_usuario.php'
    };

    /* ---------------------------------------------
       HISTÓRIA
       **palavra** = destaque visual
    --------------------------------------------- */
    const CAPITULOS = [
        {
            num: 'CAPÍTULO I',
            titulo: 'O REINO DOS PIXELS',
            cena: 0,
            aura: 'rgba(172, 130, 255, .55)',
            falas: [
                { q: 'NARRADOR', t: 'Muito além das telas existe o **Reino dos Pixels**, um mundo vivo, feito de luz e de **código**.' },
                { q: 'NARRADOR', t: 'Ali, cada rio, cada ponte e cada estrela obedece a **instruções**. Nada acontece por acaso.' },
                { q: 'NARRADOR', t: 'No coração do reino brilha o **Cristal do Conhecimento**, que mantém tudo funcionando.' }
            ]
        },
        {
            num: 'CAPÍTULO II',
            titulo: 'A LINGUAGEM DOS CÓDIGOS',
            cena: 1,
            aura: 'rgba(255, 185, 0, .35)',
            falas: [
                { q: 'LIVRO ANTIGO', t: 'Eu guardo os **feitiços** mais antigos do reino. Aqui, eles se chamam **códigos**.' },
                { q: 'LIVRO ANTIGO', t: 'Com um **se**, o mundo toma decisões. Com um **laço**, ele repete tarefas. Com uma **variável**, ele guarda memórias.' },
                { q: 'LIVRO ANTIGO', t: 'Quem domina essa linguagem se torna um **Mestre da Programação**.' }
            ]
        },
        {
            num: 'CAPÍTULO III',
            titulo: 'O APAGÃO',
            cena: 2,
            aura: 'rgba(255, 107, 139, .35)',
            falas: [
                { q: 'NARRADOR', t: 'Mas algo terrível aconteceu. O Cristal começou a **rachar** e o conhecimento a **desaparecer**.' },
                { q: 'NARRADOR', t: 'Sem os códigos, as pontes somem, os mapas se embaralham e as luzes do reino se apagam, uma a uma.' },
                { q: 'VOZ DISTANTE', t: 'Ninguém mais lembra como escrever os feitiços... Estamos **esquecendo** como o mundo funciona.' }
            ]
        },
        {
            num: 'CAPÍTULO IV',
            titulo: 'O ÚLTIMO PORTAL',
            cena: 3,
            aura: 'rgba(56, 189, 248, .4)',
            falas: [
                { q: 'VOZ DISTANTE', t: 'Por isso o último **portal** foi aberto. Ele procura alguém **curioso** e **corajoso**... alguém como **você**.' },
                { q: 'VOZ DISTANTE', t: 'Sua missão: percorrer as **regiões** do reino, aprender cada feitiço e **restaurar** o conhecimento perdido.' },
                { q: 'VOZ DISTANTE', t: 'Não precisa saber nada agora. Todo mestre já foi um **iniciante**.' }
            ]
        },
        {
            num: 'CAPÍTULO V',
            titulo: 'O ESCOLHIDO',
            cena: 4,
            aura: 'rgba(172, 130, 255, .6)',
            falas: [
                { q: 'NARRADOR', t: 'Você é o **protagonista** desta história.' },
                { q: 'NARRADOR', t: 'A cada **desafio** resolvido, seu poder cresce. A cada linha de código, um pedaço do cristal volta a **brilhar**.' },
                { q: 'NARRADOR', t: 'Agora que você conhece o mundo que precisa salvar, chegou a hora de descobrir quem será o **herói** dessa jornada.' }
            ]
        }
    ];

    /* ---------------------------------------------
       ELEMENTOS
    --------------------------------------------- */
    const $ = (id) => document.getElementById(id);

    const el = {
        cenas: Array.from(document.querySelectorAll('.h-ilu')),
        cartao: $('cartao'),
        capNum: $('capNum'),
        capTitulo: $('capTitulo'),
        dialogo: $('dialogo'),
        falante: $('falante'),
        progresso: $('progresso'),
        fala: $('fala'),
        falaSr: $('falaSr'),
        dica: $('dica'),
        btnContinuar: $('btnContinuar'),
        btnIniciar: $('btnIniciar'),
        btnPular: $('btnPular'),
        btnSom: $('btnSom'),
        transicao: $('transicao')
    };

    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ls = {
        ler(chave) { try { return localStorage.getItem(chave); } catch (e) { return null; } },
        gravar(chave, valor) { try { localStorage.setItem(chave, valor); } catch (e) { /* ignora */ } }
    };

    /* =====================================================
       SOM: música contínua + efeitos
    ===================================================== */
    const Som = (() => {
        const musica = new Audio();
        musica.loop = true;
        musica.preload = 'auto';
        musica.volume = 0;

        let mudo = ls.ler(CONFIG.CHAVE_MUDO) === '1';
        let tocando = false;
        let fadeId = null;
        let ac = null;

        musica.muted = mudo;

        // Posição salva pela tela inicial (compensa o tempo da troca de página)
        function posicaoSalva() {
            try {
                const d = JSON.parse(ls.ler(CONFIG.CHAVE_TEMPO));
                if (!d || typeof d.t !== 'number') return 0;
                const decorrido = (Date.now() - d.em) / 1000;
                return decorrido >= 0 && decorrido < 30 ? d.t + decorrido : d.t;
            } catch (e) { return 0; }
        }

        musica.addEventListener('loadedmetadata', () => {
            const p = posicaoSalva();
            if (p > 0 && isFinite(musica.duration) && musica.duration > 0) {
                musica.currentTime = p % musica.duration;
            }
        });

        musica.src = CONFIG.MUSICA_SRC;

        function fade(alvo, ms) {
            clearInterval(fadeId);
            const passos = Math.max(1, Math.round(ms / 50));
            const inicio = musica.volume;
            let i = 0;
            fadeId = setInterval(() => {
                i++;
                musica.volume = Math.min(1, Math.max(0, inicio + (alvo - inicio) * (i / passos)));
                if (i >= passos) clearInterval(fadeId);
            }, 50);
        }

        function aguardarGesto() {
            const tentar = () => {
                window.removeEventListener('pointerdown', tentar);
                window.removeEventListener('keydown', tentar);
                iniciar();
            };
            window.addEventListener('pointerdown', tentar, { once: true });
            window.addEventListener('keydown', tentar, { once: true });
        }

        function iniciar() {
            if (tocando) return;
            const p = musica.play();
            if (p && typeof p.then === 'function') {
                p.then(() => {
                    tocando = true;
                    fade(CONFIG.VOLUME, 1500);
                }).catch(aguardarGesto);
            }
        }

        function salvar() {
            if (!tocando || musica.paused || !isFinite(musica.currentTime)) return;
            ls.gravar(CONFIG.CHAVE_TEMPO, JSON.stringify({ t: musica.currentTime, em: Date.now() }));
        }

        function atualizarBotao() {
            el.btnSom.textContent = mudo ? '♪ SOM: DESLIGADO' : '♪ SOM: LIGADO';
            el.btnSom.setAttribute('aria-pressed', String(mudo));
        }

        function alternar() {
            mudo = !mudo;
            musica.muted = mudo;
            ls.gravar(CONFIG.CHAVE_MUDO, mudo ? '1' : '0');
            atualizarBotao();
            if (!mudo && !tocando) iniciar();
            if (!mudo) confirmar();
        }

        /* ---- efeitos sintetizados (WebAudio) ---- */
        function bip(freq, dur, vol, tipo, atraso) {
            if (mudo) return;
            try {
                ac = ac || new (window.AudioContext || window.webkitAudioContext)();
                if (ac.state === 'suspended') ac.resume();
                const t0 = ac.currentTime + (atraso || 0);
                const osc = ac.createOscillator();
                const ganho = ac.createGain();
                osc.type = tipo || 'triangle';
                osc.frequency.setValueAtTime(freq, t0);
                ganho.gain.setValueAtTime(vol, t0);
                ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
                osc.connect(ganho).connect(ac.destination);
                osc.start(t0);
                osc.stop(t0 + dur + 0.02);
            } catch (e) { /* sem áudio, segue em silêncio */ }
        }

        function tick() { bip(480 + Math.random() * 120, 0.035, CONFIG.VOLUME_SFX * 0.5, 'triangle'); }
        function confirmar() {
            bip(660, 0.08, CONFIG.VOLUME_SFX, 'square');
            bip(990, 0.12, CONFIG.VOLUME_SFX, 'square', 0.07);
        }
        function capitulo() {
            [392, 523, 659, 784].forEach((f, i) => bip(f, 0.22, CONFIG.VOLUME_SFX * 0.8, 'triangle', i * 0.1));
        }

        atualizarBotao();
        setInterval(salvar, 1000);
        window.addEventListener('pagehide', salvar);
        document.addEventListener('visibilitychange', () => { if (document.hidden) salvar(); });

        return { iniciar, salvar, alternar, tick, confirmar, capitulo };
    })();

    /* =====================================================
       NARRATIVA
    ===================================================== */
    let capAtual = 0;
    let falaAtual = 0;
    let digitando = false;
    let bloqueado = true;
    let finalPronto = false;
    let saindo = false;
    let timer = null;
    let partes = [];
    let spans = [];

    function montarProgresso() {
        el.progresso.innerHTML = '';
        CAPITULOS.forEach(() => el.progresso.appendChild(document.createElement('span')));
    }

    function atualizarProgresso() {
        Array.from(el.progresso.children).forEach((s, i) => {
            s.className = i < capAtual ? 'feito' : (i === capAtual ? 'atual' : '');
        });
    }

    function trocarCena(cap) {
        el.cenas.forEach((c, i) => c.classList.toggle('ativa', i === cap.cena));
        document.documentElement.style.setProperty('--aura', cap.aura);
    }

    function esconderBotoes() {
        el.btnContinuar.classList.remove('mostrar');
        el.btnIniciar.classList.remove('mostrar');
        el.dica.style.visibility = 'hidden';
    }

    function mostrarBotoes() {
        const ultimaFala = capAtual === CAPITULOS.length - 1 &&
            falaAtual === CAPITULOS[capAtual].falas.length - 1;

        el.dica.style.visibility = 'visible';

        if (ultimaFala) {
            finalPronto = true;
            el.dialogo.classList.add('final');
            el.btnIniciar.classList.add('mostrar');
            el.btnIniciar.focus({ preventScroll: true });
        } else {
            el.btnContinuar.classList.add('mostrar');
            el.btnContinuar.focus({ preventScroll: true });
        }
    }

    function falar(fala) {
        clearTimeout(timer);
        esconderBotoes();

        el.falante.textContent = fala.q;
        el.falaSr.textContent = fala.t.replace(/\*\*/g, '');
        el.fala.textContent = '';
        el.fala.classList.add('digitando');

        // "**destaque**" vira <span class="destaque">
        partes = fala.t.split(/\*\*(.+?)\*\*/);
        spans = partes.map((_, i) => {
            const s = document.createElement('span');
            if (i % 2 === 1) s.className = 'destaque';
            el.fala.appendChild(s);
            return s;
        });

        const letras = [];
        partes.forEach((texto, i) => {
            Array.from(texto).forEach((c) => letras.push([i, c]));
        });

        digitando = true;
        let n = 0;

        const passo = () => {
            if (n >= letras.length) { terminarFala(); return; }
            const [i, c] = letras[n++];
            spans[i].textContent += c;
            if (n % 2 === 0 && c.trim()) Som.tick();

            let espera = CONFIG.VELOCIDADE;
            if (/[.!?…]/.test(c)) espera += 260;
            else if (/[,;:]/.test(c)) espera += 120;
            timer = setTimeout(passo, espera);
        };

        passo();
    }

    function terminarFala() {
        clearTimeout(timer);
        spans.forEach((s, i) => { s.textContent = partes[i]; });
        digitando = false;
        el.fala.classList.remove('digitando');
        mostrarBotoes();
    }

    function entrarCapitulo(indice) {
        const cap = CAPITULOS[indice];
        capAtual = indice;
        falaAtual = 0;
        bloqueado = true;

        el.dialogo.classList.add('oculto');
        esconderBotoes();
        atualizarProgresso();
        trocarCena(cap);

        el.capNum.textContent = cap.num;
        el.capTitulo.textContent = cap.titulo;
        el.cartao.classList.remove('mostrar');
        void el.cartao.offsetWidth; // reinicia a animação
        el.cartao.classList.add('mostrar');
        Som.capitulo();

        setTimeout(() => {
            el.dialogo.classList.remove('oculto');
            bloqueado = false;
            falar(cap.falas[0]);
        }, reduzirMovimento ? 600 : 2500);
    }

    function proxima() {
        const cap = CAPITULOS[capAtual];
        if (falaAtual + 1 < cap.falas.length) {
            falaAtual++;
            falar(cap.falas[falaAtual]);
        } else if (capAtual + 1 < CAPITULOS.length) {
            entrarCapitulo(capAtual + 1);
        }
    }

    function avancar() {
        if (bloqueado || saindo) return;
        if (digitando) { terminarFala(); return; }
        if (finalPronto) { irParaCadastro(); return; }
        Som.confirmar();
        proxima();
    }

    function irParaCadastro(e) {
        if (e) e.preventDefault();
        if (saindo) return;
        saindo = true;
        bloqueado = true;
        clearTimeout(timer);
        Som.confirmar();
        Som.salvar(); // a música continua de onde parou no cadastro
        el.transicao.classList.add('ligada');
        setTimeout(() => { window.location.href = CONFIG.PROXIMA_TELA; }, 500);
    }

    /* ---------------------------------------------
       EVENTOS
    --------------------------------------------- */
    el.dialogo.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        avancar();
    });

    el.btnContinuar.addEventListener('click', (e) => { e.stopPropagation(); avancar(); });
    el.btnIniciar.addEventListener('click', irParaCadastro);
    el.btnPular.addEventListener('click', irParaCadastro);
    el.btnSom.addEventListener('click', Som.alternar);

    document.addEventListener('keydown', (e) => {
        if (e.target.closest && e.target.closest('a, button')) return;
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
            e.preventDefault();
            avancar();
        }
    });

    /* =====================================================
       PARTÍCULAS E RUNAS (canvas)
    ===================================================== */
    (function particulas() {
        const canvas = $('particulas');
        const ctx = canvas.getContext('2d');
        const CORES = ['#b58aff', '#c4a5ff', '#ffd36b', '#38bdf8', '#ffffff'];
        const GLIFOS = ['{ }', '</>', '0101', '=>', '( )', '[ ]', 'if', 'for', 'var', ';', '++'];
        let W = 0, H = 0, ps = [], runas = [];

        const rand = (a, b) => a + Math.random() * (b - a);

        function nova(inicial) {
            return {
                x: rand(0, W),
                y: inicial ? rand(0, H) : H + 10,
                s: Math.random() < 0.7 ? 2 : 3,
                vy: -rand(0.08, 0.4),
                vx: rand(-0.08, 0.08),
                a: rand(0.2, 1),
                da: rand(0.005, 0.015) * (Math.random() < 0.5 ? -1 : 1),
                cor: CORES[(Math.random() * CORES.length) | 0]
            };
        }

        function novaRuna(inicial) {
            return {
                x: rand(0, W),
                y: inicial ? rand(0, H) : H + 30,
                v: -rand(0.1, 0.28),
                tam: rand(11, 18) | 0,
                a: rand(0.06, 0.16),
                g: GLIFOS[(Math.random() * GLIFOS.length) | 0]
            };
        }

        function redimensionar() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const pequeno = W < 600;
            ps = Array.from({ length: pequeno ? 35 : 70 }, () => nova(true));
            runas = Array.from({ length: pequeno ? 6 : 12 }, () => novaRuna(true));
            if (reduzirMovimento) desenhar();
        }

        function desenhar() {
            ctx.clearRect(0, 0, W, H);

            ctx.textAlign = 'center';
            runas.forEach((r) => {
                ctx.globalAlpha = r.a;
                ctx.fillStyle = '#c4a5ff';
                ctx.font = r.tam + 'px "Roboto Mono", monospace';
                ctx.fillText(r.g, r.x, r.y);
            });

            ps.forEach((p) => {
                ctx.globalAlpha = Math.max(0, Math.min(1, p.a));
                ctx.fillStyle = p.cor;
                ctx.fillRect(p.x | 0, p.y | 0, p.s, p.s);
            });
            ctx.globalAlpha = 1;
        }

        function quadro() {
            ps.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.a += p.da;
                if (p.a <= 0.1 || p.a >= 1) p.da *= -1;
                if (p.y < -10) ps[i] = nova(false);
            });
            runas.forEach((r, i) => {
                r.y += r.v;
                if (r.y < -30) runas[i] = novaRuna(false);
            });
            desenhar();
            requestAnimationFrame(quadro);
        }

        window.addEventListener('resize', redimensionar);
        redimensionar();
        if (!reduzirMovimento) requestAnimationFrame(quadro);
    })();

    /* ---------------------------------------------
       INÍCIO
    --------------------------------------------- */
    montarProgresso();
    Som.iniciar();                // retoma a música da tela inicial
    setTimeout(() => entrarCapitulo(0), 500);
})();