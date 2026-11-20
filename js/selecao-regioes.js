/*
 * PIXEL QUEST — Seleção de regiões (Three.js)
 *
 * - Os dados continuam vindo do PHP pelo <script id="dados" type="application/json">.
 * - O modal, os cliques, os contadores e o desbloqueio NÃO dependem do 3D:
 *   se o WebGL ou o CDN falharem, tudo continua funcionando com um visual 2D simples.
 * - Um único WebGLRenderer desenha uma "mini-cena" por ilha, dentro do retângulo exato
 *   do espaço reservado (.ilha-arte). Assim a ilha fica sempre alinhada ao nome e
 *   aos contadores, sem distorção, em qualquer resolução.
 * - Nenhuma imagem externa: relevo, rochas, árvores, cristais, rios e pontes são
 *   geometria procedural (texturas pequenas são desenhadas em <canvas> pelo próprio código).
 */

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const dadosEl = document.getElementById("dados");
const regioes = dadosEl ? JSON.parse(dadosEl.textContent) : [];
const painel = document.getElementById("painel");
const palco = document.querySelector(".ilhas");

// =====================================================================
// MODAL (comportamento original preservado)
// =====================================================================

function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
}

function abrir(r) {
    const corpo = painel.querySelector(".p-corpo");
    corpo.replaceChildren();

    const titulo = el("h2", "p-nome", r.nome);
    titulo.id = "painel-titulo";

    const estado = r.bloqueada
        ? ["Bloqueada", "bloq"]
        : r.completa
            ? ["Concluída", "ok"]
            : ["Desbloqueada", "livre"];

    const pct = r.total ? Math.round(r.feitos / r.total * 100) : 0;
    const barra = el("div", "p-barra");
    const preench = el("div");
    preench.style.width = pct + "%";
    barra.append(preench);

    const lista = el("ul", "p-fases");
    if (!r.aulas.length) {
        lista.append(el("li", "p-vazio", "Nenhuma fase publicada ainda."));
    }

    r.aulas.forEach(a => {
        const feita = a.total > 0 && a.feitos >= a.total;
        const li = el("li", feita ? "feita" : "");
        li.append(el("span", "p-icone", r.bloqueada ? "🔒" : feita ? "✓" : "✦"));

        if (r.bloqueada) {
            li.append(el("span", "p-fase-nome", a.titulo));
        } else {
            const link = el("a", "p-fase-nome", a.titulo);
            link.href = "aula.php?id=" + a.id;
            li.append(link);
        }

        li.append(el("small", "", a.total ? a.feitos + "/" + a.total : "sem exercícios"));
        lista.append(li);
    });

    corpo.append(
        titulo,
        el("span", "p-estado " + estado[1], estado[0]),
        el("p", "p-desc", r.descricao),
        el("p", "p-rotulo", r.total
            ? `Progresso: ${r.feitos} de ${r.total} exercícios`
            : "Progresso: sem exercícios ainda"),
        barra,
        el("h3", "", "Fases"),
        lista
    );

    if (r.missao !== "nenhuma") {
        const textos = {
            trancada: "🔒 Conclua os exercícios para abrir a missão",
            aberta: "✦ Missão disponível",
            feita: "✓ Missão concluída"
        };
        corpo.append(el(
            "p",
            "p-missao " + r.missao,
            `${r.missaoTitulo ? r.missaoTitulo + ": " : ""}${textos[r.missao] || ""}`
        ));
    }

    if (r.bloqueada) {
        corpo.append(el("span", "p-entrar off",
            "🔒 Conclua " + (r.anterior || "a região anterior")));
    } else {
        const entrar = el("a", "p-entrar", "Entrar na região");
        entrar.href = "regiao.php?id=" + r.id;
        corpo.append(entrar);
    }

    painel.showModal();
}

function iniciarModal() {
    document.querySelectorAll(".ilha").forEach(botao => {
        const regiao = regioes.find(r => r.id === Number(botao.dataset.id));
        if (!regiao) return;
        botao.addEventListener("click", () => abrir(regiao));
        const arte = botao.querySelector("[data-ilha]");
        if (arte) arte.dataset.tema = regiao.tema;   // usado só pelo visual 2D de reserva
    });

    painel.addEventListener("click", event => {
        if (event.target === painel) painel.close();
    });
}

// =====================================================================
// 3D — utilitários
// =====================================================================

let THREE = null;
let TMP = null;          // cor temporária
let K = null;            // cores fixas
const TEX = {};          // texturas desenhadas em canvas

const PI2 = Math.PI * 2;
const RX = 3.2, RZ = 2.45;      // semi-eixos da ilha
const PROF = 2.1;               // profundidade da parte de baixo
const FOV = 28;
const EL = 27 * Math.PI / 180;  // elevação da câmera
const META_LARG = 3.7;          // meia-largura do mundo que deve caber no quadro
const META_ALT = 3.6;           // meia-altura
const ESC = 1.1;                // o quadro 3D é um pouco maior que o espaço reservado

function webglDisponivel() {
    try {
        const c = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch { return false; }
}

function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hash2(x, y, s) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function vnoise(x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s);
    const c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y, s = 0, o = 4) {
    let v = 0, a = .5, f = 1;
    for (let i = 0; i < o; i++) { v += a * vnoise(x * f, y * f, s + i * 17); f *= 2; a *= .5; }
    return v;
}

function suave(a, b, x) {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
}

const cor = hex => new THREE.Color(hex);

function contorno(th, s) {
    return .80 + .26 * fbm(Math.cos(th) * 1.5 + 5, Math.sin(th) * 1.5 + 5, s, 3) / .88;
}

function distPolilinha(pts, x, z) {
    let m = 1e9;
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const abx = b.x - a.x, abz = b.z - a.z;
        const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz || 1)));
        const dx = x - (a.x + abx * t), dz = z - (a.z + abz * t);
        const d = dx * dx + dz * dz;
        if (d < m) m = d;
    }
    return Math.sqrt(m);
}

function curva2D(pontos, n = 80) {
    return new THREE.CatmullRomCurve3(
        pontos.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal"
    ).getPoints(n);
}

function matriz(x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
    return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
}

function deformar(geo, fn) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const v = fn(p.getX(i), p.getY(i), p.getZ(i));
        p.setXYZ(i, v[0], v[1], v[2]);
    }
    p.needsUpdate = true;
    return geo;
}

// Pinta cada face com uma cor (visual "low-poly" com faces nítidas)
function pintarFaces(geo, fn) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal;
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i += 3) {
        const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
        const cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
        const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
        const c = fn(cx, cy, cz, n.getX(i), n.getY(i), n.getZ(i));
        for (let k = 0; k < 3; k++) {
            col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b;
        }
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    if (g !== geo) geo.dispose();
    return g;
}

function fundir(partes) {
    let n = 0;
    partes.forEach(g => { n += g.attributes.position.count; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let o = 0;
    partes.forEach(g => {
        pos.set(g.attributes.position.array, o * 3);
        nor.set(g.attributes.normal.array, o * 3);
        col.set(g.attributes.color.array, o * 3);
        o += g.attributes.position.count;
        g.dispose();
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return geo;
}

function texRadial(stops, tam = 128) {
    const c = document.createElement("canvas");
    c.width = c.height = tam;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2);
    stops.forEach(([p, cor]) => gr.addColorStop(p, cor));
    g.fillStyle = gr;
    g.fillRect(0, 0, tam, tam);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function texGlifo(txt) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = "#000";
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = "#7fd0ff";
    g.lineWidth = 4;
    g.strokeRect(4, 4, 56, 56);
    g.fillStyle = "#fff";
    g.font = "bold 30px monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(txt, 32, 34);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

const matVC = (extra = {}) => new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: .92, metalness: 0, ...extra
});
const matP = (c, rough = .85, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, ...extra });

function malha(geo, mat, x, y, z, sombra = true) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = sombra;
    m.receiveShadow = true;
    return m;
}

function instanciar(geo, mat, ms, cs) {
    if (!ms.length) return new THREE.Group();
    const m = new THREE.InstancedMesh(geo, mat, ms.length);
    ms.forEach((x, i) => m.setMatrixAt(i, x));
    if (cs) cs.forEach((c, i) => m.setColorAt(i, c));
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
    return m;
}

// =====================================================================
// 3D — temas
// =====================================================================

const TEMAS = {
    floresta: {
        seed: 11, alvoY: .1,
        grama: ["#2c8438", "#47a847", "#74c957"],
        terra: "#7a4d2a", rocha: "#5d4637", fundo: "#2a2030", trilha: "#bf8a47"
    },
    vale: {
        seed: 23, alvoY: 0,
        grama: ["#3aae38", "#62d03e", "#a2ea5c"],
        terra: "#87572e", rocha: "#66503d", fundo: "#2d2638", trilha: "#c8944a"
    },
    montanhas: {
        seed: 37, alvoY: .5,
        grama: ["#d9d2f3", "#f3f0ff", "#bdb0e6"],
        terra: "#6a58a8", rocha: "#5a4a92", fundo: "#281f52", trilha: "#b3a2e8"
    },
    cavernas: {
        seed: 51, alvoY: .2,
        grama: ["#132652", "#1d3a7c", "#2c5398"],
        terra: "#18306a", rocha: "#142758", fundo: "#080f30", trilha: "#0a0520", borda: "#5b32b8"
    }
};

// ---- Geometrias ----

function geoRocha(det = 1, amp = .38, seed = 1) {
    const g = new THREE.IcosahedronGeometry(1, det);
    return deformar(g, (x, y, z) => {
        const n = vnoise(x * 1.9 + seed * 3.1 + 10, y * 1.9 + z * 1.7 + seed, seed);
        const f = 1 - amp / 2 + n * amp;
        return [x * f, y * f * .85, z * f];
    });
}

function geoRochaCor(det, amp, seed, base, topo) {
    return pintarFaces(geoRocha(det, amp, seed), (cx, cy, cz, nx, ny) => {
        const n = vnoise(cx * 3 + seed, cz * 3 + cy * 2, seed + 4);
        const c = TMP.copy(base).multiplyScalar(.72 + n * .5 + Math.max(0, ny) * .28);
        if (topo) c.lerp(topo, Math.max(0, ny - .35) * 1.4);
        return c;
    });
}

function geoPinheiro(n, seed, neve = false) {
    const partes = [];
    const tronco = new THREE.CylinderGeometry(.07, .11, .5, 6);
    tronco.translate(0, .25, 0);
    partes.push(pintarFaces(tronco, () => TMP.set("#5a371c")));
    const verde = ["#12502c", "#176238", "#1f7a40", "#2a9150", "#36a55c"];
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const base = .32 + i * (1.55 / n), alt = .72 - t * .12, raio = .64 * (1 - t * .7);
        const cone = new THREE.ConeGeometry(raio, alt, 7, 2);
        cone.translate(0, base + alt / 2, 0);
        deformar(cone, (x, y, z) => {
            const k = 1 + (vnoise(x * 5 + seed, z * 5 + y * 3, seed) - .5) * .35;
            return [x * k, y, z * k];
        });
        const cv = new THREE.Color(verde[Math.min(4, Math.round(t * 4))]);
        partes.push(pintarFaces(cone, (cx, cy, cz, nx, ny) => {
            const c = TMP.copy(cv).multiplyScalar(.7 + Math.max(0, ny) * .5 + vnoise(cx * 9, cz * 9 + cy * 4, seed) * .15);
            if (neve) {
                const f = (cy - base) / alt;
                c.lerp(K.neve, .88 * suave(.12, .45, f));
            }
            return c;
        }));
    }
    return fundir(partes);
}

function geoArvoreRedonda(seed) {
    const partes = [];
    const tronco = new THREE.CylinderGeometry(.06, .09, .55, 6);
    tronco.translate(0, .27, 0);
    partes.push(pintarFaces(tronco, () => TMP.set("#6b4423")));
    [[0, .8, 0, .36], [.2, .62, .1, .27], [-.2, .64, -.08, .28]].forEach(([x, y, z, r], i) => {
        const g = new THREE.IcosahedronGeometry(r, 1);
        deformar(g, (px, py, pz) => {
            const k = .85 + vnoise(px * 4 + seed + i, py * 4 + pz * 3, seed) * .3;
            return [px * k + x, py * k + y, pz * k + z];
        });
        partes.push(pintarFaces(g, (cx, cy, cz, nx, ny) =>
            TMP.set("#2f9a3f").lerp(K.verdeClaro, Math.max(0, ny) * .8).multiplyScalar(.75 + ny * .3)));
    });
    return fundir(partes);
}

function geoMontanha(h, raio, seed) {
    const g = new THREE.ConeGeometry(raio, h, 8, 7);
    g.translate(0, h / 2, 0);
    deformar(g, (x, y, z) => {
        const t = y / h;
        const f = (1 + (vnoise(x * 2.2 + seed, z * 2.2 + y * 1.4, seed) - .5) * .7) * (1 + .1 * Math.sin(t * 13 + seed));
        const dy = (vnoise(x * 3 + 9, z * 3 + y * 2, seed + 2) - .5) * .22 * h * (t < .97 && t > .03 ? 1 : 0);
        return [x * f, y + dy, z * f];
    });
    return pintarFaces(g, (cx, cy, cz, nx, ny) => {
        const t = cy / h, n = vnoise(cx * 3 + seed, cz * 3 + cy * 2, seed + 1);
        const linha = .42 + (n - .5) * .35;
        if (t > linha && ny > .12) return TMP.set("#f4f0ff").multiplyScalar(.86 + ny * .2);
        return TMP.set("#6b54a6").lerp(K.lilas, n).multiplyScalar(.62 + ny * .35 + n * .2);
    });
}

function geoCristal() {
    const corpo = new THREE.CylinderGeometry(.075, .1, .5, 6, 1);
    corpo.translate(0, .25, 0);
    const ponta = new THREE.ConeGeometry(.075, .28, 6, 1);
    ponta.translate(0, .64, 0);
    return fundir([corpo, ponta].map(g => pintarFaces(g, () => K.branco)));
}

function faixa(pts, larg, y) {
    const pos = [], idx = [];
    for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        let tx = b.x - a.x, tz = b.z - a.z;
        const l = Math.hypot(tx, tz) || 1;
        tx /= l; tz /= l;
        const w = larg * (.85 + .3 * Math.sin(i * .37)) / 2, p = pts[i];
        pos.push(p.x - tz * w, y, p.z + tx * w, p.x + tz * w, y, p.z - tx * w);
        if (i < pts.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
}

// ---- Relevo de cada região ----

function corGrama(C, x, z, s) {
    const n = Math.min(1, fbm(x * 1.6 + 3, z * 1.6 + 7, s + 9, 3) / .88);
    return n < .5 ? C.g0.clone().lerp(C.g1, n * 2) : C.g1.clone().lerp(C.g2, (n - .5) * 2);
}

const RELEVO = {
    floresta(ilha) {
        const s = ilha.seed, C = ilha.C;
        ilha.caminhos = [
            curva2D([[-.4, 2.2], [-.9, 1.4], [-.5, .5], [.5, .2], [1.1, -.5], [.5, -1.2], [-.7, -1.55]], 90),
            curva2D([[3.2, .9], [2.0, .85], [1.1, .3]], 40)
        ];
        ilha.hBase = (x, z) => {
            const n = (fbm(x * .55 + 9, z * .55 + 4, s, 4) - .47) * .6;
            const colina = Math.exp(-((x + 2.1) ** 2 + (z + .3) ** 2) / 1.5) * .4;
            return n + colina - (1 - suave(.08, .3, ilha.distCam(x, z))) * .05;
        };
        ilha.cor = (x, z) => {
            const c = corGrama(C, x, z, s);
            return c.lerp(C.trilha, (1 - suave(.1, .26, ilha.distCam(x, z))) * .92);
        };
    },

    vale(ilha) {
        const s = ilha.seed, C = ilha.C;
        const curva = new THREE.CatmullRomCurve3(
            [[-3.2, -1.5], [-1.8, -1.0], [-.8, -.3], [.15, .2], [.75, .95], [1.25, 1.75], [1.5, 2.7]]
                .map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal");
        ilha.rio = curva.getPoints(140);
        ilha.pontes = [.4, .8].map(t => {
            const p = curva.getPoint(t), tg = curva.getTangent(t);
            return { p, n: new THREE.Vector3(-tg.z, 0, tg.x).normalize() };
        });
        const [b1, b2] = ilha.pontes;
        const ao = (b, d) => [b.p.x + b.n.x * d, b.p.z + b.n.z * d];
        ilha.caminhos = [
            curva2D([[-2.7, 1.4], [-1.6, 1.45], ao(b1, 1.4), ao(b1, 0), ao(b1, -1.4), [1.5, -1.25], [2.7, -.8]], 90),
            curva2D([ao(b2, -1.6), ao(b2, 0), ao(b2, 1.6)], 40)
        ];
        ilha.hBase = (x, z) => {
            const n = (fbm(x * .5 + 2, z * .5 + 8, s, 4) - .47) * .5;
            const colina = Math.exp(-((x - 1.7) ** 2 + (z + 1.1) ** 2) / 1.8) * .35
                + Math.exp(-((x + 1.8) ** 2 + (z - .9) ** 2) / 2.2) * .25;
            const m = 1 - suave(.1, .42, ilha.distRio(x, z));
            return (n + colina) * (1 - m) - .1 * m - (1 - suave(.08, .3, ilha.distCam(x, z))) * .03;
        };
        ilha.cor = (x, z) => {
            const c = corGrama(C, x, z, s);
            c.lerp(C.terra, (1 - suave(.2, .36, ilha.distRio(x, z))) * .75);
            return c.lerp(C.trilha, (1 - suave(.1, .26, ilha.distCam(x, z))) * .92);
        };
    },

    montanhas(ilha) {
        const s = ilha.seed, C = ilha.C;
        ilha.caminhos = [curva2D([[-2.5, 1.5], [-1.3, 1.25], [-.3, .8], [.7, .9], [1.7, .4], [2.5, -.2]], 90)];
        ilha.hBase = (x, z) => {
            const n = (fbm(x * .65 + 4, z * .65 + 1, s, 4) - .47) * .55;
            return n + suave(-.2, -1.8, z) * .5 - (1 - suave(.08, .3, ilha.distCam(x, z))) * .05;
        };
        ilha.cor = (x, z, y, ny) => {
            const c = corGrama(C, x, z, s);
            c.lerp(C.rocha, suave(.05, .22, 1 - ny) * .8);
            return c.lerp(C.trilha, (1 - suave(.1, .26, ilha.distCam(x, z))) * .85);
        };
    },

    cavernas(ilha) {
        const s = ilha.seed, C = ilha.C;
        const esp = [];
        for (let k = 0; k <= 140; k++) {
            const a = k / 140 * Math.PI * 3.4 + .3, r = .18 + 1.05 * (k / 140);
            esp.push(new THREE.Vector3(1.25 + Math.cos(a) * r * 1.35, 0, .5 + Math.sin(a) * r * .8));
        }
        ilha.caminhos = [esp, curva2D([[-1.1, -.4], [-.5, -.25], [.16, -.24]], 30)];
        ilha.hBase = (x, z) => {
            const n = (fbm(x * 1.15 + 6, z * 1.15 + 2, s, 5) - .47) * .9;
            return n * .7 + suave(-.1, -1.7, z) * .6 - (1 - suave(.12, .34, ilha.distCam(x, z))) * .22;
        };
        ilha.cor = (x, z, y) => {
            const n = Math.min(1, fbm(x * 1.4 + 1, z * 1.4 + 4, s + 9, 3) / .88);
            const c = C.g0.clone().lerp(C.g1, n);
            c.lerp(C.g2, suave(.15, .75, y));
            const d = ilha.distCam(x, z);
            c.lerp(C.borda, suave(.18, .26, d) * (1 - suave(.26, .38, d)) * .55);
            return c.lerp(C.trilha, 1 - suave(.12, .3, d));
        };
    }
};

// ---- Terreno e base flutuante ----

function criarTerreno(ilha) {
    const ANEIS = 40, SEG = 104, s = ilha.seed;
    const pos = new Float32Array((ANEIS + 1) * SEG * 3);
    let o = 0;
    for (let i = 0; i <= ANEIS; i++) {
        const rho = i / ANEIS;
        for (let j = 0; j < SEG; j++) {
            const th = j / SEG * PI2, c = contorno(th, s);
            const x = rho * RX * c * Math.cos(th), z = rho * RZ * c * Math.sin(th);
            pos[o++] = x; pos[o++] = ilha.h(x, z); pos[o++] = z;
        }
    }
    const idx = [];
    for (let i = 0; i < ANEIS; i++) {
        for (let j = 0; j < SEG; j++) {
            const a = i * SEG + j, b = i * SEG + (j + 1) % SEG;
            const c = (i + 1) * SEG + j, d = (i + 1) * SEG + (j + 1) % SEG;
            idx.push(a, c, b, b, c, d);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const nor = geo.attributes.normal, col = new Float32Array(pos.length);
    for (let i = 0; i <= ANEIS; i++) {
        for (let j = 0; j < SEG; j++) {
            const v = i * SEG + j, rho = i / ANEIS;
            const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
            const ny = nor.getY(v);
            const c = ilha.cor(x, z, y, ny, rho);
            c.lerp(ilha.C.terra, suave(.93, 1, rho) * .85);
            c.multiplyScalar(.78 + .22 * Math.max(0, ny));
            col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
        }
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .93, metalness: 0, side: THREE.DoubleSide });
    ilha.raiz.add(malha(geo, mat, 0, 0, 0, false));
}

function criarBase(ilha) {
    const s = ilha.seed, SEG = 104, K2 = 18, C = ilha.C;
    const pos = [], col = [], idx = [];
    for (let k = 0; k <= K2; k++) {
        const t = k / K2;
        for (let j = 0; j < SEG; j++) {
            const th = j / SEG * PI2, c = contorno(th, s);
            const x0 = RX * c * Math.cos(th), z0 = RZ * c * Math.sin(th);
            const n = fbm(Math.cos(th) * 2.2 + t * 1.7 + 3, Math.sin(th) * 2.2 + t * 3.1 + 8, s + 3, 3);
            const f = Math.pow(1 - t, .8) * (1 + (n - .47) * .9 * Math.min(1, t * 5));
            const yTopo = ilha.h(x0, z0);
            const y = yTopo - PROF * Math.pow(t, .9) - n * .25 * t;
            pos.push(x0 * f, y, z0 * f);
            const cc = t < .07 ? C.terra.clone() : C.rocha.clone().lerp(C.fundo, Math.min(1, (t - .07) * 1.15));
            cc.multiplyScalar(.75 + n * .5 + Math.sin(y * 9 + n * 4) * .06);
            col.push(cc.r, cc.g, cc.b);
        }
    }
    for (let k = 0; k < K2; k++) {
        for (let j = 0; j < SEG; j++) {
            const a = k * SEG + j, b = k * SEG + (j + 1) % SEG;
            const c = (k + 1) * SEG + j, d = (k + 1) * SEG + (j + 1) % SEG;
            idx.push(a, c, b, b, c, d);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    ilha.raiz.add(malha(geo, matVC({ side: THREE.DoubleSide }), 0, 0, 0));

    // estalactites e pedras soltas
    const r = ilha.r, pedra = geoRochaCor(1, .5, s + 21, C.rocha.clone().multiplyScalar(1.1), null);
    const matR = matVC();
    for (let i = 0; i < 6; i++) {
        const a = r() * PI2, d = .25 + r() * .5;
        const ponta = new THREE.ConeGeometry(.28 + r() * .2, .8 + r() * .7, 6, 2);
        ponta.rotateX(Math.PI);   // ponta para baixo (rotação, sem inverter as faces)
        const cone = pintarFaces(ponta, (cx, cy, cz, nx, ny) => TMP.copy(C.fundo).multiplyScalar(1.2 + n01(cx, cz, s) * .5));
        ilha.raiz.add(malha(cone, matVC(), Math.cos(a) * RX * d * .7, -PROF * .72, Math.sin(a) * RZ * d * .7));
    }
    [[-1.5, -2.55, .6, .2], [1.3, -2.8, -.3, .15], [.2, -3.0, .8, .12], [-.4, -2.7, -.9, .1]].forEach(([x, y, z, e], i) => {
        const m = malha(pedra, matR, x, y, z);
        m.scale.setScalar(e);
        m.rotation.set(i, i * 2, 0);
        ilha.raiz.add(m);
        ilha.animacoes.push(t => { m.position.y = y + Math.sin(t * 1.3 + i * 1.7) * .1; m.rotation.y += .003; });
    });
}

function n01(x, z, s) { return vnoise(x * 3 + s, z * 3, s); }

// ---- Distribuição de objetos sobre o terreno ----

function espalhar(ilha, n, { tentativas = n * 12, rhoMax = .88, rhoMin = 0, distMin = 0, caminho = .2, rio = 0, filtro = null } = {}) {
    const r = ilha.r, out = [];
    for (let i = 0; i < tentativas && out.length < n; i++) {
        const th = r() * PI2, rho = Math.sqrt(r()) * rhoMax;
        if (rho < rhoMin) continue;
        const c = contorno(th, ilha.seed);
        const x = rho * RX * c * Math.cos(th), z = rho * RZ * c * Math.sin(th);
        if (caminho && ilha.distCam(x, z) < caminho) continue;
        if (rio && ilha.distRio(x, z) < rio) continue;
        if (filtro && !filtro(x, z)) continue;
        if (distMin && out.some(o => (o.x - x) ** 2 + (o.z - z) ** 2 < distMin * distMin)) continue;
        out.push({ x, z, y: ilha.h(x, z), rho });
    }
    return out;
}

function pedras(ilha, n, base, topo, rhoMax = .92, escala = 1) {
    const r = ilha.r;
    const geo = geoRochaCor(1, .42, ilha.seed + 5, cor(base), topo ? cor(topo) : null);
    const ms = espalhar(ilha, n, { rhoMax, caminho: .2 }).map(a => {
        const e = (.12 + r() * .2) * escala;
        return matriz(a.x, a.y + e * .25, a.z, e * 1.25, e * .85, e, r() * PI2, r() * .4, r() * .4);
    });
    ilha.raiz.add(instanciar(geo, matVC(), ms));
}

function arbustos(ilha, n, paleta) {
    const r = ilha.r, s = ilha.seed;
    const g = deformar(new THREE.IcosahedronGeometry(.3, 1), (x, y, z) => {
        const k = .85 + vnoise(x * 4 + s, y * 4 + z * 3, s) * .3;
        return [x * k, y * k, z * k];
    });
    const geo = pintarFaces(g, (cx, cy, cz, nx, ny) => TMP.setScalar(.6 + Math.max(0, ny) * .55));
    const cs = [], ms = espalhar(ilha, n, { rhoMax: .92, caminho: .24, rio: .35 }).map(a => {
        const e = .5 + r() * .6;
        cs.push(cor(paleta[Math.floor(r() * paleta.length)]));
        return matriz(a.x, a.y + .07, a.z, e * 1.2, e * .7, e, r() * PI2);
    });
    ilha.raiz.add(instanciar(geo, matVC(), ms, cs));
}

// ---- Cristais, brilhos, cavernas ----

function brilho(ilha, hex, x, y, z, esc) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: TEX.brilho, color: hex, transparent: true, opacity: .75,
        blending: THREE.AdditiveBlending, depthWrite: false
    }));
    sp.position.set(x, y, z);
    sp.scale.setScalar(esc);
    ilha.raiz.add(sp);
}

function aglomerado(ilha, x, z, tipo, n = 4, esc = 1) {
    const y = ilha.h(x, z), r = ilha.r;
    for (let i = 0; i < n; i++) {
        const e = esc * (i === 0 ? 1.5 : .6 + r() * .7), a = r() * PI2, d = i === 0 ? 0 : .12 + r() * .22;
        ilha.cristais[tipo].push(matriz(x + Math.cos(a) * d, y - .03, z + Math.sin(a) * d,
            e * (.8 + r() * .4), e, e * (.8 + r() * .4), r() * PI2, (r() - .5) * .7, (r() - .5) * .7));
    }
    brilho(ilha, tipo === "roxo" ? 0xb04dff : 0x35d8ff, x, y + .45 * esc, z, 1.3 * esc + .3);
}

function fecharCristais(ilha) {
    const geo = geoCristal();
    [["ciano", "#47e4ff", "#0b9bff", 1.5], ["roxo", "#c46bff", "#8a2be2", 1.7]].forEach(([k, c, e, i]) => {
        const ms = ilha.cristais[k];
        if (!ms.length) return;
        const mat = new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: i, roughness: .18, metalness: .2, flatShading: true });
        const m = instanciar(geo, mat, ms);
        m.castShadow = false;
        ilha.raiz.add(m);
    });
}

function entradaCaverna(ilha, x, z, giro, esc, base, topo) {
    const y = ilha.h(x, z) - .05, r = ilha.r, s = ilha.seed;
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = giro;
    g.scale.setScalar(esc);
    ilha.raiz.add(g);

    const mat = matVC();
    const massa = malha(geoRochaCor(2, .5, s + 13, base, topo), mat, 0, .8, -.35);
    massa.scale.set(1.55, 1.2, .75);
    g.add(massa);

    const disco = new THREE.Mesh(new THREE.CircleGeometry(.52, 28), new THREE.MeshBasicMaterial({ map: TEX.caverna }));
    disco.scale.set(1, 1.3, 1);
    disco.position.set(0, .68, .5);
    g.add(disco);

    const geoA = geoRochaCor(1, .45, s + 9, base, topo);
    for (let i = 0; i <= 10; i++) {
        const a = Math.PI * i / 10, e = .2 + r() * .1;
        const p = malha(geoA, mat, Math.cos(a) * .66, .62 + Math.sin(a) * .86, .5 + (r() - .5) * .06);
        p.scale.set(e * 1.3, e, e * 1.2);
        p.rotation.set(r(), r() * 3, r());
        g.add(p);
    }
    [-1, 1].forEach(l => [.05, .3, .5].forEach((yy, i) => {
        const p = malha(geoA, mat, l * (.68 + i * .01), yy, .5);
        p.scale.setScalar(.22 + r() * .08);
        p.rotation.set(r(), r() * 3, r());
        g.add(p);
    }));
    return g;
}

// ---- Povoamento de cada região ----

function povoarFloresta(ilha) {
    const r = ilha.r, s = ilha.seed, mat = matVC();
    const variantes = [geoPinheiro(4, s + 1), geoPinheiro(5, s + 2), geoPinheiro(6, s + 3)];
    const ms = [[], [], []], cs = [[], [], []];
    espalhar(ilha, 70, {
        rhoMax: .95, distMin: .34, caminho: .3,
        filtro: (x, z) => fbm(x * .6 + 1, z * .6 + 3, s + 5, 2) > .3
    }).forEach((a, i) => {
        const e = .55 + r() * .6 + (a.x < -1 ? .12 : 0);
        ms[i % 3].push(matriz(a.x, a.y - .04, a.z, e, e * (.92 + r() * .2), e, r() * PI2, (r() - .5) * .07, (r() - .5) * .07));
        cs[i % 3].push(new THREE.Color().setScalar(.8 + r() * .3));
    });
    variantes.forEach((g, i) => ilha.raiz.add(instanciar(g, mat, ms[i], cs[i])));
    arbustos(ilha, 28, ["#1f7a34", "#2f9a44", "#3fae4f"]);
    pedras(ilha, 16, "#6f6a66", "#8a8580");

    const tronco = malha(new THREE.CylinderGeometry(.09, .1, .95, 8), matP("#6b4423"), 1.9, ilha.h(1.9, 1.25) + .1, 1.25);
    tronco.rotation.set(0, .5, Math.PI / 2);
    ilha.raiz.add(tronco);
}

function povoarMontanhas(ilha) {
    const r = ilha.r, s = ilha.seed, C = ilha.C;
    [[-2.3, -1.05, 2.5, 1.15], [-1.0, -1.55, 3.0, 1.35], [.35, -1.25, 2.3, 1.05],
     [1.5, -1.65, 3.1, 1.45], [2.55, -.85, 2.0, .95], [-.2, -2.0, 1.9, .9]].forEach(([x, z, h, rd], i) => {
        const m = malha(geoMontanha(h, rd, s + i * 5), matVC(), x, ilha.h(x, z) - .12, z);
        m.rotation.y = i;
        ilha.raiz.add(m);
    });

    const base = cor("#6a55a8"), topo = cor("#efeaff");
    entradaCaverna(ilha, -1.0, -.05, .1, 1.0, base, topo);
    entradaCaverna(ilha, 1.6, -.15, -.2, .85, base, topo);

    const mat = matVC();
    const variantes = [geoPinheiro(4, s + 1, true), geoPinheiro(5, s + 2, true)];
    const ms = [[], []];
    espalhar(ilha, 18, {
        rhoMax: .93, distMin: .45, caminho: .3,
        filtro: (x, z) => z > .2 || (Math.abs(x) > 2.2 && z > -1.2)
    }).forEach((a, i) => {
        const e = .45 + r() * .4;
        ms[i % 2].push(matriz(a.x, a.y - .04, a.z, e, e, e, r() * PI2));
    });
    variantes.forEach((g, i) => ilha.raiz.add(instanciar(g, mat, ms[i])));
    pedras(ilha, 12, "#6a55a8", "#efeaff", .9, 1.2);
}

function ponte(ilha, b) {
    const g = new THREE.Group();
    g.position.set(b.p.x, .1, b.p.z);
    g.rotation.y = Math.atan2(-b.n.z, b.n.x);
    ilha.raiz.add(g);
    const comp = 1.05, larg = .4, madeira = matP("#9a6532"), escura = matP("#6b4423");
    for (let i = 0; i < 12; i++) {
        g.add(malha(new THREE.BoxGeometry(.075, .035, larg), madeira, -comp / 2 + (i + .5) * comp / 12, 0, 0));
    }
    [-1, 1].forEach(l => {
        g.add(malha(new THREE.BoxGeometry(comp, .035, .035), escura, 0, .15, l * larg / 2));
        g.add(malha(new THREE.BoxGeometry(comp, .04, .05), escura, 0, -.03, l * larg * .3));
        [-1, -.35, .35, 1].forEach(px =>
            g.add(malha(new THREE.BoxGeometry(.045, .2, .045), escura, px * comp / 2, .07, l * larg / 2)));
    });
}

function povoarVale(ilha) {
    const r = ilha.r, s = ilha.seed;

    // rio
    const pts = ilha.rio.filter(p => ilha.rhoDe(p.x, p.z) < .97);
    const agua = new THREE.MeshStandardMaterial({
        color: "#1f9bff", emissive: "#0a56b8", emissiveIntensity: .5, roughness: .12, metalness: .15,
        transparent: true, opacity: .93, side: THREE.DoubleSide
    });
    ilha.raiz.add(malha(faixa(pts, .46, 0), agua, 0, 0, 0, false));
    ilha.animacoes.push(t => { agua.emissiveIntensity = .5 + .18 * Math.sin(t * 2.2); });

    const fim = pts[pts.length - 1];
    const nx = fim.x / RX, nz = fim.z / RZ, nl = Math.hypot(nx, nz) || 1;
    const cach = new THREE.Mesh(new THREE.PlaneGeometry(.42, 1.9), new THREE.MeshBasicMaterial({
        color: "#9fdcff", transparent: true, opacity: .7, depthWrite: false, side: THREE.DoubleSide
    }));
    cach.position.set(fim.x + nx / nl * .1, -.95, fim.z + nz / nl * .1);
    cach.rotation.y = Math.atan2(nx, nz);
    ilha.raiz.add(cach);
    ilha.animacoes.push(t => { cach.material.opacity = .6 + .15 * Math.sin(t * 5); });

    ilha.pontes.forEach(b => ponte(ilha, b));

    // árvores redondas
    const geoAr = geoArvoreRedonda(s);
    const arv = espalhar(ilha, 8, { rhoMax: .9, distMin: .9, caminho: .35, rio: .5 }).map(a => {
        const e = .7 + r() * .5;
        return matriz(a.x, a.y - .03, a.z, e, e, e, r() * PI2);
    });
    ilha.raiz.add(instanciar(geoAr, matVC(), arv));

    arbustos(ilha, 14, ["#2f9a44", "#4fb94f", "#6fcd5a"]);
    pedras(ilha, 12, "#8d8a80", "#b8c9a0", .9, .9);

    // flores
    const paleta = ["#ff7ac8", "#ffffff", "#ffd84a", "#ff9a3d", "#b58cff"];
    const flores = espalhar(ilha, 240, {
        rhoMax: .9, caminho: .16, rio: .3,
        filtro: (x, z) => fbm(x * 1.4 + 2, z * 1.4 + 5, s + 6, 2) > .42
    });
    const cf = [], mf = flores.map(a => {
        cf.push(cor(paleta[Math.floor(r() * paleta.length)]));
        const e = .7 + r() * .7;
        return matriz(a.x, a.y + .05, a.z, e, e, e, r() * PI2);
    });
    ilha.raiz.add(instanciar(new THREE.IcosahedronGeometry(.05, 0), matP("#ffffff", .6, { flatShading: true }), mf, cf));

    // cubos azuis (variáveis)
    const glifos = ["{ }", "=", "x", "[ ]"].map(texGlifo);
    espalhar(ilha, 6, { rhoMax: .78, distMin: 1.0, caminho: .3, rio: .5 }).forEach((a, i) => {
        const mat = new THREE.MeshStandardMaterial({
            color: "#2a7bff", emissive: "#6fc8ff", emissiveMap: glifos[i % 4], emissiveIntensity: 1.3,
            transparent: true, opacity: .72, roughness: .2, metalness: .1
        });
        const g = new THREE.Group();
        const esc = .8 + r() * .35;
        g.add(malha(new THREE.BoxGeometry(.36, .36, .36), mat, 0, 0, 0, false));
        g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.37, .37, .37)),
            new THREE.LineBasicMaterial({ color: "#a8e6ff" })));
        g.scale.setScalar(esc);
        ilha.raiz.add(g);
        const sombra = new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .22, depthWrite: false }));
        sombra.rotation.x = -Math.PI / 2;
        sombra.position.set(a.x, a.y + .02, a.z);
        ilha.raiz.add(sombra);
        ilha.animacoes.push(t => {
            g.position.set(a.x, a.y + .55 + Math.sin(t * 1.6 + i * 2) * .08, a.z);
            g.rotation.y = t * .6 + i;
        });
    });
}

function povoarCavernas(ilha) {
    const r = ilha.r, s = ilha.seed, C = ilha.C;
    const geoA = geoRochaCor(2, .55, s + 2, cor("#1c3a80"), cor("#4a78c8"));
    const geoB = geoRochaCor(2, .6, s + 7, cor("#142c68"), cor("#3a62b0"));
    const ms = [[], []];
    espalhar(ilha, 46, {
        rhoMax: .96, rhoMin: .55, distMin: .3, caminho: .3,
        filtro: (x, z) => z < -.5 || Math.abs(x) > 2.2 || fbm(x + 3, z + 2, s, 2) > .62
    }).forEach((a, i) => {
        const alt = .5 + r() * .9 * (a.z < -.5 ? 1.5 : .8), e = .28 + r() * .34;
        ms[i % 2].push(matriz(a.x, a.y + alt * .35, a.z, e * (1 + r() * .4), alt, e, r() * PI2, (r() - .5) * .2, (r() - .5) * .2));
    });
    ilha.raiz.add(instanciar(geoA, matVC(), ms[0]));
    ilha.raiz.add(instanciar(geoB, matVC(), ms[1]));
    pedras(ilha, 16, "#27478f", "#4a78c8", .92, 1);

    entradaCaverna(ilha, -1.15, -.35, .12, 1.15, cor("#1b3a80"), cor("#456fc0"));
    entradaCaverna(ilha, 2.2, -.95, -.35, .8, cor("#1b3a80"), cor("#456fc0"));

    [[-1.75, -.1, "ciano", 4, 1.1], [-.55, -.05, "roxo", 3, .9], [.4, -.9, "roxo", 5, 1.2],
     [2.3, .5, "ciano", 4, 1], [1.3, .45, "roxo", 3, .8], [-1.7, .9, "roxo", 3, .9],
     [-.3, .9, "ciano", 4, .9], [.9, 1.5, "ciano", 3, .8]].forEach(c => aglomerado(ilha, ...c));

    [[0xa23bff, 7, -1.15, 1.0, .6], [0x2fc8ff, 6, 2.3, .9, .5], [0xa23bff, 6, .4, .9, -.9]].forEach(([c, i, x, y, z]) => {
        const l = new THREE.PointLight(c, i, 5, 2);
        l.position.set(x, y, z);
        ilha.raiz.add(l);
    });
}

// ---- Montagem de uma ilha ----

function luzes(ilha) {
    const frio = ilha.tema === "cavernas";
    ilha.cena.add(new THREE.HemisphereLight(frio ? 0x6f86ff : 0xcfdcff, frio ? 0x120a2a : 0x2c2442, frio ? .9 : 1.25));
    const sol = new THREE.DirectionalLight(frio ? 0x9db4ff : 0xfff1d6, frio ? 1.2 : 2.7);
    sol.position.set(-5.5, 9, 6.5);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    const c = sol.shadow.camera;
    c.left = -5; c.right = 5; c.top = 5.5; c.bottom = -4.5; c.near = 2; c.far = 26;
    sol.shadow.bias = -.0006;
    sol.shadow.normalBias = .04;
    ilha.cena.add(sol);
    const rec = new THREE.DirectionalLight(0x7f9cff, .9);
    rec.position.set(6, 3, -6);
    ilha.cena.add(rec);
}

function bloquear(ilha) {
    const cinza = (c, f) => { const l = (c.r * .3 + c.g * .59 + c.b * .11) * f; c.setRGB(l, l, l); };
    const grisAttr = a => {
        for (let i = 0; i < a.count; i++) {
            const l = (a.getX(i) * .3 + a.getY(i) * .59 + a.getZ(i) * .11) * .7;
            a.setXYZ(i, l, l, l);
        }
        a.needsUpdate = true;
    };
    ilha.cena.traverse(o => {
        if (o.isPointLight) o.intensity *= .15;
        if (o.isSprite) o.visible = false;
        if (!o.isMesh && !o.isLine) return;
        if (o.geometry && o.geometry.attributes.color) grisAttr(o.geometry.attributes.color);
        if (o.instanceColor) grisAttr(o.instanceColor);
        if (o.material) {
            o.material = o.material.clone();
            const m = o.material;
            if (m.color && !m.vertexColors) cinza(m.color, .85);
            if (m.emissive) m.emissive.multiplyScalar(.15);
        }
    });
}

function construirIlha(regiao) {
    const tema = TEMAS[regiao.tema] ? regiao.tema : "floresta";
    const T = TEMAS[tema];
    const cena = new THREE.Scene();
    const raiz = new THREE.Group();
    cena.add(raiz);

    const ilha = {
        tema, T, seed: T.seed, cena, raiz, alvoY: T.alvoY,
        animacoes: [], r: rng(T.seed * 7 + 3), caminhos: [], rio: null,
        cristais: { ciano: [], roxo: [] },
        C: {
            g0: cor(T.grama[0]), g1: cor(T.grama[1]), g2: cor(T.grama[2]),
            terra: cor(T.terra), rocha: cor(T.rocha), fundo: cor(T.fundo),
            trilha: cor(T.trilha), borda: cor(T.borda || "#5b32b8")
        }
    };

    ilha.distCam = (x, z) => { let m = 99; for (const p of ilha.caminhos) m = Math.min(m, distPolilinha(p, x, z)); return m; };
    ilha.distRio = (x, z) => ilha.rio ? distPolilinha(ilha.rio, x, z) : 99;
    ilha.rhoDe = (x, z) => Math.hypot(x / RX, z / RZ) / contorno(Math.atan2(z / RZ, x / RX), ilha.seed);

    RELEVO[tema](ilha);
    ilha.h = (x, z) => ilha.hBase(x, z) - suave(.86, 1, Math.min(ilha.rhoDe(x, z), 1.06)) * .2;

    luzes(ilha);

    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4),
        new THREE.MeshBasicMaterial({ map: TEX.sombra, transparent: true, depthWrite: false }));
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = -3.1;
    cena.add(sombra);
    ilha.sombra = sombra;

    criarTerreno(ilha);
    criarBase(ilha);

    ({ floresta: povoarFloresta, vale: povoarVale, montanhas: povoarMontanhas, cavernas: povoarCavernas })[tema](ilha);
    fecharCristais(ilha);

    if (regiao.bloqueada) bloquear(ilha);
    return ilha;
}

// =====================================================================
// 3D — renderizador, câmera por ilha e laço de animação
// =====================================================================

async function iniciarCena() {
    if (!webglDisponivel()) throw new Error("WebGL indisponível neste navegador");

    THREE = await import(THREE_URL);
    TMP = new THREE.Color();
    K = {
        branco: new THREE.Color(1, 1, 1),
        neve: new THREE.Color("#f2eeff"),
        lilas: new THREE.Color("#9a84d6"),
        verdeClaro: new THREE.Color("#8fe06a")
    };
    TEX.brilho = texRadial([[0, "rgba(255,255,255,1)"], [.35, "rgba(255,255,255,.35)"], [1, "rgba(255,255,255,0)"]]);
    TEX.sombra = texRadial([[0, "rgba(0,0,0,.5)"], [.6, "rgba(0,0,0,.2)"], [1, "rgba(0,0,0,0)"]]);
    TEX.caverna = texRadial([[0, "#02010a"], [.6, "#0a0420"], [1, "#2a1366"]]);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.autoClear = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping ?? THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.className = "cena-regioes-3d";
    canvas.setAttribute("aria-hidden", "true");
    palco.prepend(canvas);

    const ilhas = [];
    palco.querySelectorAll(".ilha").forEach((botao, i) => {
        const regiao = regioes.find(r => r.id === Number(botao.dataset.id));
        const arte = botao.querySelector("[data-ilha]");
        if (!regiao || !arte) return;
        const ilha = construirIlha(regiao);
        const I = {
            regiao, botao, arte, ilha, cena: ilha.cena, raiz: ilha.raiz,
            camera: new THREE.PerspectiveCamera(FOV, 1, .5, 80),
            hover: 0, alvoHover: 0, aspecto: 0, fase: i * 1.9
        };
        const liga = () => { I.alvoHover = 1; }, desliga = () => { I.alvoHover = 0; };
        botao.addEventListener("pointerenter", liga);
        botao.addEventListener("pointerleave", desliga);
        botao.addEventListener("focus", liga);
        botao.addEventListener("blur", desliga);
        ilhas.push(I);
    });

    function ajustarCamera(I, aspecto) {
        I.aspecto = aspecto;
        const cam = I.camera;
        cam.aspect = aspecto;
        cam.updateProjectionMatrix();
        const tv = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
        const D = Math.max(META_ALT / tv, META_LARG / (tv * aspecto));
        cam.position.set(0, I.ilha.alvoY + Math.sin(EL) * D, Math.cos(EL) * D);
        cam.lookAt(0, I.ilha.alvoY, 0);
    }

    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let mx = 0, my = 0, larg = 0, alt = 0, pronto = false;
    window.addEventListener("pointermove", e => {
        mx = e.clientX / window.innerWidth * 2 - 1;
        my = e.clientY / window.innerHeight * 2 - 1;
    }, { passive: true });

    canvas.addEventListener("webglcontextlost", e => {
        e.preventDefault();
        document.body.classList.add("sem-webgl");
    });
    canvas.addEventListener("webglcontextrestored", () => document.body.classList.remove("sem-webgl"));

    function quadro(ms) {
        requestAnimationFrame(quadro);
        if (painel && painel.open) return;   // modal aberto: economiza processamento

        const t = ms / 1000;
        const rc = canvas.getBoundingClientRect();
        const w = Math.round(rc.width), h = Math.round(rc.height);
        if (!w || !h) return;
        if (w !== larg || h !== alt) { larg = w; alt = h; renderer.setSize(w, h, false); }

        renderer.setScissorTest(false);
        renderer.clear();
        renderer.setScissorTest(true);

        for (const I of ilhas) {
            const rr = I.arte.getBoundingClientRect();
            if (!rr.width || rr.bottom < -200 || rr.top > window.innerHeight + 200) continue;

            const vw = rr.width * ESC, vh = rr.height * ESC;
            const vx = rr.left + rr.width / 2 - vw / 2 - rc.left;
            const vy = h - ((rr.top + rr.height / 2 - vh / 2 - rc.top) + vh);
            if (Math.abs(I.aspecto - vw / vh) > .002) ajustarCamera(I, vw / vh);

            I.hover += (I.alvoHover - I.hover) * .1;
            const livre = !I.regiao.bloqueada;
            const bob = reduzir || !livre ? 0 : Math.sin(t * 1.15 + I.fase) * .12;
            I.raiz.position.y = bob;
            I.raiz.rotation.y = reduzir ? 0
                : Math.sin(t * .35 + I.fase) * (livre ? .16 + I.hover * .2 : .06) + mx * .12;
            I.raiz.rotation.x = reduzir ? 0 : my * .03;
            I.raiz.scale.setScalar(1 + I.hover * .06);
            I.ilha.sombra.scale.setScalar(1 - bob * .35);
            if (!reduzir) I.ilha.animacoes.forEach(fn => fn(t));

            renderer.setViewport(vx, vy, vw, vh);
            renderer.setScissor(vx, vy, vw, vh);
            renderer.clearDepth();
            renderer.render(I.cena, I.camera);
        }

        if (!pronto) { pronto = true; palco.classList.add("cena-pronta"); }
    }

    requestAnimationFrame(quadro);
}

// =====================================================================
// Inicialização
// =====================================================================

if (palco && regioes.length) {
    iniciarModal();
    iniciarCena().catch(erro => {
        console.warn("[PIXEL QUEST] Cena 3D indisponível; usando o visual simplificado.", erro);
        document.body.classList.add("sem-webgl");
    });
}