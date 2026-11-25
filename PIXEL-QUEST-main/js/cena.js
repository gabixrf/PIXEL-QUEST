/* PIXEL QUEST - cena compartilhada (tela inicial + história): estrelas, estrela cadente e parallax
   Requer no HTML: #quadro (container) e <canvas id="estrelas"> */
(() => {
    'use strict';

    const $ = (s) => document.querySelector(s);
    const body = document.body;
    const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const quadro = $('#quadro');
    const cv = $('#estrelas');
    if (!quadro || !cv) return;

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

    // voltar do histórico (botão "voltar"): desliga a tela escura de saída que ficou no cache
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) body.classList.remove('saindo-pagina');
    });
})();