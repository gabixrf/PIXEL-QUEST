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

    /* ==================== SOM (tudo sintetizado, sem arquivos) ==================== */

    const Som = (() => {
        const AC = window.AudioContext || window.webkitAudioContext;
        const escala = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
        let ctx = null, master = null, bus = null;
        let ligado = true, vivo = false;

        try { ligado = localStorage.getItem('pq-som') !== 'off'; } catch (e) { /* sem storage */ }

        const volume = () => (ligado ? 0.7 : 0);

        function nota(freq, dur, vol, tipo, destino) {
            const t = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = tipo;
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g);
            g.connect(destino);
            o.start(t);
            o.stop(t + dur + 0.05);
        }

        function arpejo() {
            setTimeout(() => {
                if (ligado && ctx.state === 'running') {
                    const f = escala[Math.floor(Math.random() * escala.length)] * (Math.random() < 0.3 ? 2 : 1);
                    nota(f, 1.6, 0.045, 'triangle', bus);
                }
                arpejo();
            }, rand(600, 1400));
        }

        function iniciar() {
            if (!AC || vivo) return;
            vivo = true;

            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = 0;
            master.connect(ctx.destination);

            // eco suave para as notas
            bus = ctx.createGain();
            const eco = ctx.createDelay();
            const fb = ctx.createGain();
            const lp = ctx.createBiquadFilter();
            eco.delayTime.value = 0.42;
            fb.gain.value = 0.38;
            lp.type = 'lowpass';
            lp.frequency.value = 1800;
            bus.connect(master);
            bus.connect(eco);
            eco.connect(lp);
            lp.connect(fb);
            fb.connect(eco);
            lp.connect(master);

            // pad grave (acorde de Lá menor) com filtro respirando
            const filtro = ctx.createBiquadFilter();
            filtro.type = 'lowpass';
            filtro.frequency.value = 600;
            filtro.connect(master);

            [110, 164.81, 220, 261.63].forEach((f, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = i % 2 ? 'sine' : 'triangle';
                o.frequency.value = f;
                o.detune.value = (i - 1.5) * 4;
                g.gain.value = 0.035;
                o.connect(g);
                g.connect(filtro);
                o.start();
            });

            const lfo = ctx.createOscillator();
            const lg = ctx.createGain();
            lfo.frequency.value = 0.12;
            lg.gain.value = 200;
            lfo.connect(lg);
            lg.connect(filtro.frequency);
            lfo.start();

            master.gain.setTargetAtTime(volume(), ctx.currentTime, 1.2);
            arpejo();

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

            // "tec" da digitação
            blip() {
                if (ctx && ligado) nota(520 + Math.random() * 120, 0.05, 0.018, 'square', master);
            },

            // acorde curto ao apertar PRESS START
            plink() {
                if (!ctx || !ligado) return;
                [523.25, 783.99, 1046.5].forEach((f, i) =>
                    setTimeout(() => nota(f, 0.5, 0.05, 'square', bus), i * 90));
            },

            sair()      { if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.12); },
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
                    m.style.top = rand(3, 30).toFixed(1) + '%';
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