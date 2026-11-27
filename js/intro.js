/* =====================================================
   PIXEL QUEST - TELA INICIAL
   1) monta a cena (estrelas, luzes da vila, faíscas, mar, vaga-lumes, meteoros, parallax)
   2) loading com herói caminhando até o Cristal do Conhecimento
   3) PRESS START -> dissolve em pixels -> entrada orquestrada
   4) frase digitada, botão START e transição para historia.php
===================================================== */

(() => {
    'use strict';

    const $ = (seletor) => document.querySelector(seletor);
    const rand = (a, b) => a + Math.random() * (b - a);
    const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const body = document.body;
    const quadro = $('#quadro');
    const loader = $('#loader');
    const lv = $('#lv');
    const pct = $('#pct');
    const barra = $('.barra');
    const legenda = $('#legenda');
    const dica = $('#dica');
    const slot = $('#slotStart');
    const frase = $('#frase');
    const botaoStart = $('#botaoStart');
    const indicacao = $('.indicacao');
    const botaoSom = $('#botaoSom');

    /* ==================== SOM (noite à beira-mar: mar + batida chill, tudo sintetizado) ====================
       Cinco camadas ligam no PRESS START:
       1) MAR: ruído filtrado que sobe e desce devagar (as ondas), sempre ao fundo
       2) PIANO: acordes macios de piano elétrico em Lá menor (a noite), um por compasso
       3) CINTILAR: notinhas "de 8 bits" suaves, arpejando o acorde, e estrelas soltas com eco
       4) BATIDA: bumbo suave, caixa e chimbal bem baixinhos, com swing
       5) BAIXO: nota grave e redonda no tempo forte
       Para mudar o ritmo, altere o BPM abaixo (mais alto = mais rápido). */

    const Som = (() => {
        const AC = window.AudioContext || window.webkitAudioContext;
        let ctx = null, master = null, eco = null, ruido = null, timer = null;
        let ligado = true, vivo = false;
        let passo = 0, proximo = 0;

        try { ligado = localStorage.getItem('pq-som') !== 'off'; } catch (e) { /* sem storage */ }

        const volume = () => (ligado ? 0.8 : 0);

        // converte "semitons acima do Lá (220 Hz)" em frequência (Hz)
        const hz = (n) => 220 * Math.pow(2, n / 12);

        const BPM = 76;
        const OITAVO = 60 / BPM / 2;     // duração de meio tempo
        const SWING = 0.045;             // atraso dos tempos "fracos": dá o balanço

        // um acorde por compasso: Am9 -> Fmaj7 -> Cmaj7 -> Em7 (notas em semitons acima do Lá 220 Hz)
        const ACORDES = [
            { raiz: -12, notas: [0, 3, 7, 10, 14] },
            { raiz: -16, notas: [-4, 0, 3, 7] },
            { raiz: -9,  notas: [3, 7, 10, 14] },
            { raiz: -17, notas: [7, 10, 14, 17] }
        ];
        const ESCALA = [0, 3, 5, 7, 10];  // pentatônica menor de Lá, para as estrelas soltas

        // 1) MAR (mantido do original): ruído branco passado por um filtro que corta os agudos;
        //    um oscilador lento (LFO) faz o volume subir e descer, como a onda chegando e voltando
        function mar() {
            const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
            const dados = buf.getChannelData(0);
            for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;

            const fonte = ctx.createBufferSource();
            fonte.buffer = buf;
            fonte.loop = true;

            const filtro = ctx.createBiquadFilter();
            filtro.type = 'lowpass';
            filtro.frequency.value = 500;

            const onda = ctx.createGain();
            onda.gain.value = 0.07;                 // volume médio do mar

            const lfo = ctx.createOscillator();     // 1 ciclo a cada ~8 segundos
            const lfoForca = ctx.createGain();
            lfo.frequency.value = 0.12;
            lfoForca.gain.value = 0.05;             // quanto o volume varia
            lfo.connect(lfoForca);
            lfoForca.connect(onda.gain);

            fonte.connect(filtro);
            filtro.connect(onda);
            onda.connect(master);
            fonte.start();
            lfo.start();
        }

        // rajada curta de ruído filtrado (base de caixa, chimbal e do "tec" da digitação)
        function rajada(t, tipo, freq, q, pico, subida, queda, taxa, destino) {
            const src = ctx.createBufferSource();
            src.buffer = ruido;
            src.playbackRate.value = taxa;
            const f = ctx.createBiquadFilter();
            f.type = tipo;
            f.frequency.value = freq;
            f.Q.value = q;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(pico, t + subida);
            g.gain.exponentialRampToValueAtTime(0.0001, t + subida + queda);
            src.connect(f);
            f.connect(g);
            g.connect(destino || master);
            src.start(t);
            src.stop(t + subida + queda + 0.02);
        }

        // piano elétrico: duas ondas levemente desafinadas + um "brilho" agudo que some rápido
        function tecla(freq, t, dur, vol, destino) {
            const filtro = ctx.createBiquadFilter();
            filtro.type = 'lowpass';
            filtro.frequency.value = 1600;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            filtro.connect(g);
            g.connect(destino || master);

            [['sine', 1, -5, 1, dur], ['triangle', 1, 5, 0.5, dur], ['sine', 2, 0, 0.35, 0.35]]
                .forEach(([tipo, mult, det, ganho, vida]) => {
                    const o = ctx.createOscillator();
                    const og = ctx.createGain();
                    o.type = tipo;
                    o.frequency.value = freq * mult;
                    o.detune.value = det;
                    og.gain.setValueAtTime(ganho, t);
                    og.gain.exponentialRampToValueAtTime(0.0001, t + vida);
                    o.connect(og);
                    og.connect(filtro);
                    o.start(t);
                    o.stop(t + dur + 0.05);
                });
        }

        // "pluck" de 8 bits suavizado: onda quadrada passada por um filtro que fecha rápido
        // (lembra os jogos clássicos, mas sem aspereza)
        function pluck(freq, t, vol, destino) {
            const o = ctx.createOscillator();
            const f = ctx.createBiquadFilter();
            const g = ctx.createGain();
            o.type = 'square';
            o.frequency.value = freq;
            f.type = 'lowpass';
            f.frequency.setValueAtTime(2200, t);
            f.frequency.exponentialRampToValueAtTime(500, t + 0.3);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.006);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
            o.connect(f);
            f.connect(g);
            g.connect(destino || master);
            o.start(t);
            o.stop(t + 0.5);
        }

        function baixo(t, freq, dur, vol) {
            const o = ctx.createOscillator();
            const f = ctx.createBiquadFilter();
            const g = ctx.createGain();
            o.type = 'triangle';
            o.frequency.value = freq;
            f.type = 'lowpass';
            f.frequency.value = 420;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(f);
            f.connect(g);
            g.connect(master);
            o.start(t);
            o.stop(t + dur + 0.05);
        }

        function bumbo(t, vol) {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(120, t);
            o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
            o.connect(g);
            g.connect(master);
            o.start(t);
            o.stop(t + 0.3);
        }

        const caixa = (t, vol) => rajada(t, 'bandpass', 1500, 0.7, vol, 0.003, 0.14, 0.9);
        const chimbal = (t, vol) => rajada(t, 'bandpass', 6500, 0.6, vol, 0.001, 0.04, 1.2);

        // toca um "meio tempo" da música (p = número do passo, t0 = instante em que acontece)
        function tocarPasso(p, t0) {
            const i = p % 8;
            const a = ACORDES[Math.floor(p / 8) % ACORDES.length];
            const t = t0 + (i % 2 ? SWING : 0) + Math.random() * 0.008;   // levemente "humano"
            const v = 0.85 + Math.random() * 0.3;

            if (i === 0) {
                a.notas.forEach((n, k) => tecla(hz(n), t + k * 0.028, 2.8, 0.016 * v, eco));
                baixo(t, hz(a.raiz), 1.5, 0.12 * v);
                bumbo(t, 0.16 * v);
            }
            if (i === 3) bumbo(t, 0.1 * v);
            if (i === 5) {
                bumbo(t, 0.12 * v);
                baixo(t, hz(a.raiz + 12), 0.5, 0.05 * v);
                a.notas.slice(-2).forEach((n, k) => tecla(hz(n), t + k * 0.02, 1.1, 0.011 * v, eco));
            }
            if (i === 2 || i === 6) caixa(t, 0.035 * v);
            chimbal(t, (i % 2 ? 0.008 : 0.014) * v);

            // cintilar: arpejo suave do acorde nos tempos fracos, de vez em quando
            if (i % 2 === 1 && Math.random() < 0.45) {
                const n = a.notas[Math.floor(p / 2) % a.notas.length] + (Math.random() < 0.7 ? 12 : 24);
                pluck(hz(n), t, 0.012 * v, eco);
            }

            // de vez em quando, uma estrela cai: nota solta da pentatônica
            if (i % 2 === 0 && Math.random() < 0.12) {
                const n = ESCALA[Math.floor(Math.random() * ESCALA.length)] + (Math.random() < 0.5 ? 12 : 24);
                tecla(hz(n), t + 0.02, 2.2, 0.02, eco);
            }
        }

        // agenda a música um pouquinho à frente do relógio de áudio (ritmo sempre firme)
        function agendar() {
            if (proximo < ctx.currentTime) proximo = ctx.currentTime + 0.05;
            while (proximo < ctx.currentTime + 0.5) {
                tocarPasso(passo, proximo);
                passo++;
                proximo += OITAVO;
            }
        }

        function iniciar() {
            if (!AC || vivo) return;
            vivo = true;

            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = 0;
            const comp = ctx.createDynamicsCompressor();   // segura os picos e "cola" a mistura
            comp.threshold.value = -20;
            comp.ratio.value = 3;
            master.connect(comp);
            comp.connect(ctx.destination);

            // eco: o som vai direto para a saída e também para um atraso abafado que se repete mais fraco
            eco = ctx.createGain();
            const atraso = ctx.createDelay(2);
            const filtroEco = ctx.createBiquadFilter();
            const retorno = ctx.createGain();
            const molhado = ctx.createGain();
            atraso.delayTime.value = OITAVO * 1.5;
            filtroEco.type = 'lowpass';
            filtroEco.frequency.value = 1800;
            retorno.gain.value = 0.35;
            molhado.gain.value = 0.5;
            eco.connect(master);
            eco.connect(atraso);
            atraso.connect(filtroEco);
            filtroEco.connect(retorno);
            retorno.connect(atraso);
            filtroEco.connect(molhado);
            molhado.connect(master);

            // ruído branco curto, usado por caixa, chimbal e digitação
            ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
            const dados = ruido.getChannelData(0);
            for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;

            mar();
            proximo = ctx.currentTime + 0.15;
            agendar();
            timer = setInterval(agendar, 100);

            master.gain.setTargetAtTime(volume(), ctx.currentTime, 1.2);   // entra devagar

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) ctx.suspend(); else ctx.resume();
            });
        }

        return {
            iniciar,
            get ligado() { return ligado; },
            get suportado() { return !!AC; },

            alternar() {
                ligado = !ligado;
                try { localStorage.setItem('pq-som', ligado ? 'on' : 'off'); } catch (e) { /* ok */ }
                if (ctx) master.gain.setTargetAtTime(volume(), ctx.currentTime, 0.1);
                return ligado;
            },

            // "tec" suave da digitação: toque abafado, sem agudos
            blip() {
                if (!ctx || !ligado || !ruido) return;
                const t = ctx.currentTime;
                const r = 0.9 + Math.random() * 0.2;
                rajada(t, 'lowpass', 2000 * r, 0.5, 0.03, 0.003, 0.025, 0.8);
                rajada(t + 0.002, 'bandpass', 480 * r, 0.8, 0.06, 0.004, 0.05, 0.6);
            },

            // ao apertar PRESS START: arpejo suave de Lá menor no piano elétrico
            plink() {
                if (!ctx || !ligado) return;
                [0, 3, 7, 14].forEach((n, i) => tecla(hz(n + 12), ctx.currentTime + i * 0.11, 1.8, 0.03, eco));
            },

            // ao clicar em START: duas notas descendo (Mi -> Lá), fechando a porta devagar
            confirmar() {
                if (!ctx || !ligado) return;
                const t = ctx.currentTime;
                tecla(hz(7), t, 1.2, 0.04, eco);
                tecla(hz(0), t + 0.15, 1.8, 0.04, eco);
            },

            sair()      { if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime + 0.3, 0.1); },
            restaurar() { if (ctx) master.gain.setTargetAtTime(volume(), ctx.currentTime, 0.3); }
        };
    })();

    function atualizarBotaoSom() {
        botaoSom.textContent = Som.ligado ? '♪ SOM: LIGADO' : '♪ SOM: MUDO';
        botaoSom.setAttribute('aria-pressed', String(Som.ligado));
    }

    if (!Som.suportado) botaoSom.hidden = true;
    atualizarBotaoSom();

    botaoSom.addEventListener('click', () => {
        Som.alternar();
        atualizarBotaoSom();
    });

    /* ==================== CENA ==================== */

    // enquadramento: em telas largas a imagem quadrada é cortada em cima e embaixo.
    // Em vez de mostrar o centro (onde some a ilha e a ponte), mostramos a parte de baixo
    // (colina, mar e ilha). O valor --fy (0 a 1) é lido pelo CSS do .quadro.
    let topoVisivel = 0;   // % da imagem onde começa a área visível

    function enquadrar() {
        const V = innerHeight, Q = Math.max(innerWidth, innerHeight);
        const meio = V / (2 * Q);
        const fy = Math.min(Math.max(0.66, meio), 1 - meio);
        topoVisivel = (fy - meio) * 100;
        quadro.style.setProperty('--fy', fy.toFixed(4));
    }

    enquadrar();
    addEventListener('resize', enquadrar);

    // luzes da vila (x, y em % da imagem quadrada)
    const luzes = [
        [72.5, 70.9], [75.6, 67.8], [70.5, 74.0], [78.9, 69.3], [80.9, 70.4],
        [74.9, 71.5], [76.9, 71.4], [67.8, 75.9], [81.4, 72.9], [73.4, 74.6],
        [79.7, 77.8], [66.8, 74.2], [71.8, 76.9], [75.9, 74.4], [84.0, 72.2]
    ];

    const luzesEls = [];
    luzes.forEach(([x, y]) => {
        const l = document.createElement('div');
        l.className = 'luz';
        l.style.left = x + '%';
        l.style.top = y + '%';
        l.style.setProperty('--t', rand(2.2, 5).toFixed(2) + 's');
        l.style.setProperty('--d', (-rand(0, 4)).toFixed(2) + 's');
        luzesEls.push(l);
        quadro.append(l);
    });

    // faíscas subindo do notebook
    for (let i = 0; i < 9; i++) {
        const f = document.createElement('div');
        f.className = 'fagulha';
        f.style.marginLeft = rand(-14, 14).toFixed(1) + 'px';
        f.style.setProperty('--d', (-rand(0, 3.2)).toFixed(2) + 's');
        f.style.setProperty('--dx', rand(-26, 26).toFixed(0) + 'px');
        quadro.append(f);
    }

    // brilhos na água + reflexo das luzes da vila
    // (ajuste os intervalos de left/top se quiser mudar onde aparecem)
    for (let i = 0; i < 34; i++) {
        const c = document.createElement('div');
        const vila = i < 12;
        c.className = 'cintila' + (vila ? ' q' : '');
        c.style.left = (vila ? rand(66, 84) : rand(44, 100)).toFixed(1) + '%';
        c.style.top = (vila ? rand(80, 87) : rand(76, 94)).toFixed(1) + '%';
        c.style.setProperty('--t', rand(1.6, 4).toFixed(2) + 's');
        c.style.setProperty('--d', (-rand(0, 4)).toFixed(2) + 's');
        quadro.append(c);
    }

    // vaga-lumes na colina
    for (let i = 0; i < 14; i++) {
        const v = document.createElement('div');
        v.className = 'vagalume';
        v.style.left = rand(2, 40).toFixed(1) + '%';
        v.style.top = rand(70, 92).toFixed(1) + '%';
        v.style.setProperty('--dx', rand(-60, 60).toFixed(0) + 'px');
        v.style.setProperty('--dy', rand(-50, 30).toFixed(0) + 'px');
        v.style.setProperty('--t', rand(4, 9).toFixed(1) + 's');
        v.style.setProperty('--d', (-rand(0, 6)).toFixed(1) + 's');
        quadro.append(v);
    }

    // estrelas cadentes
    if (!reduz) {
        (function meteoro() {
            setTimeout(() => {
                if (!document.hidden) {
                    const m = document.createElement('div');
                    m.className = 'meteoro';
                    m.style.left = rand(25, 80).toFixed(1) + '%';
                    m.style.top = (topoVisivel + rand(2, 22)).toFixed(1) + '%';
                    m.addEventListener('animationend', () => m.remove());
                    quadro.append(m);
                }
                meteoro();
            }, rand(3500, 8000));
        })();
    }

    // estrelas extras cintilando no céu (canvas pequeno, ampliado em pixel)
    (function estrelas() {
        const c = $('#estrelas');
        const T = 640;
        c.width = c.height = T;
        const g = c.getContext('2d');
        const lista = [];

        while (lista.length < 70) {
            const x = Math.random();
            const y = Math.random() * 0.64;
            if (y < 0.58 || x > 0.42) {          // evita o personagem
                lista.push({
                    x: Math.floor(x * T), y: Math.floor(y * T),
                    f: rand(0.6, 2.2), p: rand(0, 6.28), grande: Math.random() < 0.15
                });
            }
        }

        function desenhar(t) {
            g.clearRect(0, 0, T, T);
            for (const s of lista) {
                const a = 0.25 + 0.75 * Math.max(0, Math.sin(t * s.f + s.p));
                if (s.grande) {
                    g.fillStyle = `rgba(217, 200, 255, ${(a * 0.85).toFixed(2)})`;
                    g.fillRect(s.x - 1, s.y, 3, 1);
                    g.fillRect(s.x, s.y - 1, 1, 3);
                } else {
                    g.fillStyle = `rgba(255, 255, 255, ${a.toFixed(2)})`;
                    g.fillRect(s.x, s.y, 1, 1);
                }
            }
        }

        if (reduz) { desenhar(1); return; }

        let ultimo = 0;
        (function loop(agora) {
            if (agora - ultimo > 110) { ultimo = agora; desenhar(agora / 1000); }
            requestAnimationFrame(loop);
        })(0);
    })();

    // parallax suave seguindo o mouse
    if (!reduz && matchMedia('(pointer: fine)').matches) {
        let alvoX = 0, alvoY = 0, x = 0, y = 0;

        addEventListener('pointermove', (e) => {
            alvoX = -(e.clientX / innerWidth - 0.5) * 26;
            alvoY = -(e.clientY / innerHeight - 0.5) * 16;
        });

        (function loop() {
            if (Math.abs(alvoX - x) > 0.02 || Math.abs(alvoY - y) > 0.02) {
                x += (alvoX - x) * 0.06;
                y += (alvoY - y) * 0.06;
                quadro.style.setProperty('--px', x.toFixed(2) + 'px');
                quadro.style.setProperty('--py', y.toFixed(2) + 'px');
            }
            requestAnimationFrame(loop);
        })();
    }

    /* ==================== TRAVESSIA (ponte de luz até Asteria) ==================== */

    let progresso = 0;   // 0 a 1, atualizado pelo carregamento

    (function travessia() {
        const c = $('#ponte'), rotulo = $('#pct');
        const T = 320;
        c.width = c.height = T;
        const g = c.getContext('2d');

        // caminho em % da imagem: da colina até a margem da ilha (ajuste aqui se precisar)
        const X0 = 0.375 * T, Y0 = 0.865 * T, X1 = 0.655 * T, Y1 = 0.838 * T, ARCO = 5;
        const ponto = (u) => ({ x: X0 + (X1 - X0) * u, y: Y0 + (Y1 - Y0) * u - Math.sin(Math.PI * u) * ARCO });
        const ilha = { x: 0.75 * T, y: 0.74 * T };
        const LAMPS = 8;
        const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
        const limiar = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

        const COR = { h: '#1b1230', s: '#f0b98a', d: '#5b3b1d', j: '#9a6b35', p: '#3a3f6b', b: '#1e1830', l: '#ffe08a' };
        const CORPO = ['..hhh..', '.hhhhs.', '.hhhss.', 'ddjjjjl', 'ddjjjjl', '.djjjj.', '..jjj..'];
        const PERNAS = {
            a: ['..p.p..', '..p..p.', '..b..b.'],
            b: ['...pp..', '...pp..', '...bb..'],
            i: ['...pp..', '...pp..', '..bb.b.']
        };

        // brilho pontilhado (lampião, notebook)
        function halo(cx, cy, r, cor, forca) {
            g.fillStyle = cor;
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const d = Math.hypot(dx, dy);
                    if (d < r && limiar(cx + dx, cy + dy) < (1 - d / r) * forca) g.fillRect(cx + dx, cy + dy, 1, 1);
                }
            }
        }

        let dp = 0, t = 0, ultimo = 0;

        function desenhar(agora) {
            requestAnimationFrame(desenhar);
            const dt = Math.min(0.05, (agora - ultimo) / 1000);
            ultimo = agora;
            t += dt;

            dp += (progresso - dp) * Math.min(1, dt * 5);
            if (progresso >= 1 && dp > 0.995) dp = 1;
            const fim = dp >= 1;
            const heroi = !body.classList.contains('comecou');
            const comp = X1 - X0;
            const ate = Math.min(1, dp + 0.04);

            g.clearRect(0, 0, T, T);

            // trilho "fantasma" mostrando o caminho que falta
            g.fillStyle = 'rgba(196, 165, 255, .22)';
            for (let x = 0; x <= comp; x += 3) {
                const p = ponto(x / comp);
                g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
            }

            // ponte: nasce sob os pés do herói
            for (let x = 0; x <= comp * ate; x++) {
                const p = ponto(x / comp), px = Math.round(p.x), py = Math.round(p.y);
                g.fillStyle = (x % 4) < 3 ? 'rgba(214, 196, 255, .9)' : 'rgba(130, 100, 220, .75)';
                g.fillRect(px, py, 1, 1);
                g.fillStyle = 'rgba(88, 60, 180, .7)';
                g.fillRect(px, py + 1, 1, 1);
                g.fillStyle = 'rgba(170, 150, 255, .2)';
                g.fillRect(px + Math.round(Math.sin(t * 2 + x * 0.3)), py + 3 + ((x >> 1) & 1), 1, 1);
            }

            // lampiões: acendem quando o herói passa
            for (let k = 0; k <= LAMPS; k++) {
                const u = k / LAMPS;
                if (u > ate + 0.02) continue;
                const p = ponto(u), x = Math.round(p.x), y = Math.round(p.y);
                const acesa = fim || u <= dp - 0.01;
                g.fillStyle = '#2a1f4a';
                g.fillRect(x, y - 6, 1, 6);
                if (acesa) {
                    halo(x, y - 7, 9, '#ffb347', 0.55 + 0.1 * Math.sin(t * 5 + k));
                    g.fillStyle = 'rgba(255, 179, 71, .45)';
                    g.fillRect(x + Math.round(Math.sin(t * 3 + k)), y + 4, 1, 2);
                }
                g.fillStyle = acesa ? '#ffd98a' : '#4a3a6a';
                g.fillRect(x - 1, y - 8, 3, 2);
            }

            // anel de luz saindo da ilha quando a travessia termina
            if (fim) {
                const ciclo = reduz ? 0.5 : (t % 3) / 3, r = ciclo * 62, al = (1 - ciclo) * 0.85;
                g.fillStyle = '#ffdca0';
                for (let dy = -Math.ceil(r / 2.4) - 2; dy <= Math.ceil(r / 2.4) + 2; dy++) {
                    for (let dx = -Math.ceil(r) - 2; dx <= Math.ceil(r) + 2; dx++) {
                        if (Math.abs(Math.hypot(dx, dy * 2.4) - r) > 1.2) continue;
                        const x = Math.round(ilha.x) + dx, y = Math.round(ilha.y) + dy;
                        if (limiar(x, y) < al) g.fillRect(x, y, 1, 1);
                    }
                }
            }

            // herói
            const p = ponto(dp);
            if (heroi) {
                const andando = !fim && !reduz, q = Math.floor(t / 0.16) % 2;
                const pernas = andando ? (q ? PERNAS.a : PERNAS.b) : PERNAS.i;
                const hx = Math.round(p.x) - 3, hy = Math.round(p.y) - 10 + (andando && q ? -1 : 0);
                halo(hx + 7, hy + 4, 10, '#ffcf70', 0.55 + 0.1 * Math.sin(t * 4));
                g.fillStyle = 'rgba(10, 6, 18, .45)';
                g.fillRect(hx, Math.round(p.y), 7, 1);
                [...CORPO, ...pernas].forEach((linha, yy) => {
                    for (let xx = 0; xx < linha.length; xx++) {
                        if (linha[xx] === '.') continue;
                        g.fillStyle = COR[linha[xx]];
                        g.fillRect(hx + xx, hy + yy, 1, 1);
                    }
                });
            }

            // porcentagem acompanha o herói
            rotulo.style.left = (p.x / T * 100).toFixed(2) + '%';
            rotulo.style.top = ((p.y - 14) / T * 100).toFixed(2) + '%';
        }

        requestAnimationFrame(desenhar);
    })();

    /* ==================== LOADING ==================== */

    const passos = [
        { p: 6,   t: 'Acordando o reino de Asteria' },
        { p: 24,  t: 'Polindo os pixels' },
        { p: 44,  t: 'Acendendo as luzes da vila' },
        { p: 64,  t: 'Afiando a lógica' },
        { p: 84,  t: 'Invocando o Cristal do Conhecimento' },
        { p: 100, t: 'Tudo pronto' }
    ];

    const dicas = [
        'DICA: TODO GRANDE CÓDIGO COMEÇA COM UM PRINT.',
        'DICA: ERRAR FAZ PARTE. É ASSIM QUE SE APRENDE.',
        'DICA: UM PASSO POR VEZ, UMA REGIÃO POR VEZ.',
        'DICA: LER O ERRO É METADE DA SOLUÇÃO.'
    ];

    function novaLinha(texto) { legenda.textContent = texto; }

    // dicas girando enquanto carrega
    let iDica = 0;
    dica.textContent = dicas[0];
    const giroDicas = setInterval(() => {
        iDica = (iDica + 1) % dicas.length;
        dica.textContent = dicas[iDica];
    }, 2400);

    // espera a imagem da cena e as fontes (com limite de tempo)
    const imagemCena = $('.cena-img');
    const imagemPronta = new Promise((ok) => {
        if (imagemCena.complete) return ok();
        imagemCena.addEventListener('load', ok, { once: true });
        imagemCena.addEventListener('error', ok, { once: true });
    });
    const fontesProntas = document.fonts ? document.fonts.ready : Promise.resolve();
    let tudoPronto = false;
    Promise.race([Promise.all([imagemPronta, fontesProntas]), esperar(8000)])
        .then(() => { tudoPronto = true; });

    const DURACAO = reduz ? 900 : 4800;
    const inicio = performance.now();
    let atual = 0;
    let proximoPasso = 0;

    function desenharProgresso(p) {
        loader.style.setProperty('--p', p + '%');
        progresso = p / 100;
        const acesas = Math.floor((p / 100) * luzesEls.length);
        luzesEls.forEach((l, i) => l.classList.toggle('acesa', i < acesas));
        pct.textContent = p + '%';
        barra.setAttribute('aria-valuenow', p);
        while (proximoPasso < passos.length && p >= passos[proximoPasso].p) {
            novaLinha(passos[proximoPasso].t);
            proximoPasso++;
        }
        lv.textContent = Math.max(1, proximoPasso);
    }

    function carregar(agora) {
        const t = Math.min((agora - inicio) / DURACAO, 1);
        let alvo = t * t * (3 - 2 * t) * 100;
        if (!tudoPronto) alvo = Math.min(alvo, 92);
        if (t >= 1 && tudoPronto) alvo = 100;

        atual = Math.max(atual, Math.floor(alvo));
        desenharProgresso(atual);

        if (atual < 100) requestAnimationFrame(carregar);
        else prontoParaStart();
    }

    body.classList.add('entrou');
    requestAnimationFrame(carregar);

    /* ==================== PRESS START ==================== */

    let aguardandoStart = false;
    let comecou = false;

    function prontoParaStart() {
        clearInterval(giroDicas);
        loader.classList.add('chegou');
        dica.textContent = 'CLIQUE OU APERTE ENTER PARA ENTRAR EM ASTERIA';

        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'press-start';
        b.textContent = 'PRESS START';
        b.addEventListener('click', comecar);
        slot.append(b);
        b.focus({ preventScroll: true });

        aguardandoStart = true;
    }

    document.addEventListener('keydown', (e) => {
        if (aguardandoStart && !comecou && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            comecar();
        }
    });

    async function comecar() {
        if (comecou) return;
        comecou = true;

        Som.iniciar();
        Som.plink();

        loader.classList.add('saindo');
        setTimeout(() => loader.remove(), reduz ? 0 : 700);

        body.classList.remove('carregando');
        body.classList.add('comecou');
        slot.replaceChildren();

        // título e cena já estão na tela: agora vêm a frase e o START
        await esperar(reduz ? 0 : 400);
        await digitar(frase);

        botaoStart.classList.add('mostrar');
        await esperar(reduz ? 0 : 500);
        indicacao.classList.add('mostrar');
        botaoStart.focus({ preventScroll: true });
    }

    /* ==================== FRASE DIGITADA ==================== */

    const textoFrase = frase.textContent.trim();
    frase.textContent = '';

    async function digitar(el) {
        if (reduz) { el.textContent = textoFrase; return; }

        el.classList.add('digitando');
        for (let i = 1; i <= textoFrase.length; i++) {
            el.textContent = textoFrase.slice(0, i);
            if (i % 2) Som.blip();
            await esperar(55 + (/[,.]/.test(textoFrase[i - 1]) ? 220 : 0));
        }
    }

    /* ==================== SAÍDA PARA A HISTÓRIA ==================== */

    botaoStart.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();

        const destino = botaoStart.href;
        body.classList.add('saindo-pagina');
        Som.confirmar();
        Som.sair();
        setTimeout(() => { location.href = destino; }, reduz ? 0 : 480);
    });

    // voltar pelo botão do navegador (página vinda do cache)
    addEventListener('pageshow', (e) => {
        if (e.persisted) {
            body.classList.remove('saindo-pagina');
            Som.restaurar();
        }
    });
})();