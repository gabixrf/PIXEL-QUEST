/*
 * PIXEL QUEST — Página da região
 * Partículas no topo da página, de acordo com o tema da região:
 *   floresta  -> vagalumes
 *   vale      -> cubinhos azuis subindo
 *   montanhas -> neve
 *   cavernas  -> cristais brilhando
 * Também move a imagem do topo de leve com o mouse (parallax).
 * Sem bibliotecas. Respeita "reduzir movimento" e pausa quando a aba está escondida.
 */
(() => {
    "use strict";

    const hero = document.querySelector(".reg-hero");
    const canvas = hero && hero.querySelector(".reg-particulas");
    if (!hero || !canvas || !canvas.getContext) return;

    const ctx = canvas.getContext("2d");
    const tema = document.body.dataset.tema || "floresta";
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const PALETAS = {
        floresta:  ["#d9f99d", "#86efac", "#fde68a"],
        vale:      ["#7dd3fc", "#bae6fd", "#bef264"],
        montanhas: ["#ffffff", "#e0e7ff", "#ddd6fe"],
        cavernas:  ["#c084fc", "#22d3ee", "#e879f9"]
    };
    const cores = PALETAS[tema] || PALETAS.floresta;

    const rand = (a, b) => a + Math.random() * (b - a);
    const escolher = lista => lista[Math.floor(Math.random() * lista.length)];

    let w = 0, h = 0, dpr = 1;
    let particulas = [];

    function criar(inicial) {
        const p = {
            x: rand(0, w),
            y: inicial ? rand(0, h) : 0,
            cor: escolher(cores),
            fase: rand(0, Math.PI * 2),
            vel: rand(.6, 1.8),
            alfa: rand(.45, .95),
            rot: rand(0, Math.PI * 2),
            vr: rand(-.01, .01)
        };

        switch (tema) {
            case "montanhas":                       // neve caindo
                p.r = rand(1, 3.2);
                p.vx = rand(-.15, .15);
                p.vy = rand(.25, .85);
                p.y = inicial ? p.y : -10;
                break;
            case "vale":                            // cubinhos subindo
                p.r = rand(4, 9);
                p.vx = rand(-.1, .1);
                p.vy = -rand(.15, .45);
                p.y = inicial ? p.y : h + 12;
                break;
            case "cavernas":                        // cristais flutuando
                p.r = rand(3, 8);
                p.vx = rand(-.08, .08);
                p.vy = -rand(.04, .16);
                p.y = inicial ? p.y : h + 12;
                break;
            default:                                // vagalumes
                p.r = rand(1.5, 3.4);
                p.vx = rand(-.2, .2);
                p.vy = rand(-.18, .08);
                p.y = inicial ? p.y : rand(0, h);
        }
        return p;
    }

    function ajustar() {
        const rc = hero.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = Math.max(1, Math.round(rc.width));
        h = Math.max(1, Math.round(rc.height));
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const alvo = Math.min(70, Math.round(w * h / 11000));
        while (particulas.length < alvo) particulas.push(criar(true));
        particulas.length = alvo;
    }

    function desenhar(p, t) {
        const brilho = tema === "montanhas" ? 1 : .55 + .45 * Math.sin(t * p.vel + p.fase);
        ctx.globalAlpha = Math.max(0, p.alfa * brilho);
        ctx.fillStyle = p.cor;
        ctx.strokeStyle = p.cor;
        ctx.shadowColor = p.cor;
        ctx.shadowBlur = tema === "montanhas" ? 4 : 14;

        if (tema === "vale") {                      // cubinho (contorno)
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.lineWidth = 1.4;
            ctx.strokeRect(-p.r / 2, -p.r / 2, p.r, p.r);
            ctx.restore();
        } else if (tema === "cavernas") {           // losango (cristal)
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - p.r * 1.4);
            ctx.lineTo(p.x + p.r * .7, p.y);
            ctx.lineTo(p.x, p.y + p.r * 1.4);
            ctx.lineTo(p.x - p.r * .7, p.y);
            ctx.closePath();
            ctx.fill();
        } else {                                    // círculo (neve e vagalumes)
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function quadro(t) {
        ctx.clearRect(0, 0, w, h);

        for (const p of particulas) {
            if (!reduzir) {
                if (tema === "montanhas") p.x += p.vx + Math.sin(t / 900 + p.fase) * .25;
                else if (tema === "floresta") {
                    p.x += p.vx + Math.sin(t / 1400 + p.fase) * .3;
                    p.y += p.vy + Math.cos(t / 1700 + p.fase) * .2;
                } else p.x += p.vx + Math.sin(t / 1600 + p.fase) * .12;

                if (tema !== "floresta") p.y += p.vy;
                p.rot += p.vr;

                // reaparece do outro lado quando sai da tela
                if (p.y > h + 14) { p.y = -10; p.x = rand(0, w); }
                if (p.y < -14) { p.y = h + 10; p.x = rand(0, w); }
                if (p.x > w + 14) p.x = -10;
                if (p.x < -14) p.x = w + 10;
            }
            desenhar(p, t / 1000);
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    // ---- laço de animação (só roda com o hero visível) ----
    let rodando = false, visivel = true, id = 0;

    function laco(t) {
        if (!rodando) return;
        quadro(t);
        id = requestAnimationFrame(laco);
    }

    function atualizar() {
        const deve = visivel && !document.hidden && !reduzir;
        if (deve && !rodando) { rodando = true; id = requestAnimationFrame(laco); }
        if (!deve && rodando) { rodando = false; cancelAnimationFrame(id); }
    }

    ajustar();
    quadro(performance.now());          // um quadro estático (também usado em "reduzir movimento")

    if ("ResizeObserver" in window) {
        new ResizeObserver(() => { ajustar(); if (!rodando) quadro(performance.now()); }).observe(hero);
    } else {
        window.addEventListener("resize", ajustar);
    }

    if ("IntersectionObserver" in window) {
        new IntersectionObserver(entradas => {
            visivel = entradas[0].isIntersecting;
            atualizar();
        }).observe(hero);
    }
    document.addEventListener("visibilitychange", atualizar);
    atualizar();

    // ---- parallax suave da imagem ----
    const img = hero.querySelector(".reg-hero-img");
    if (img && !reduzir && window.matchMedia("(hover: hover)").matches) {
        hero.addEventListener("pointermove", e => {
            const rc = hero.getBoundingClientRect();
            const nx = (e.clientX - rc.left) / rc.width - .5;
            const ny = (e.clientY - rc.top) / rc.height - .5;
            img.style.transform = `translate(${(-nx * 18).toFixed(1)}px, ${(-ny * 12).toFixed(1)}px) scale(1.02)`;
        });
        hero.addEventListener("pointerleave", () => { img.style.transform = ""; });
    }
})();