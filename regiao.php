<?php
session_start();
require_once "conexao.php";

if (!isset($_SESSION["usuario_id"])) {
    header("Location: login.php");
    exit;
}

$uid = (int) $_SESSION["usuario_id"];

// Recebe o ID da região pela URL
$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);
if (!$id) {
    header("Location: regioes.php");
    exit;
}

/* ---------- Funções auxiliares ---------- */

function e(?string $texto): string
{
    return htmlspecialchars($texto ?? "", ENT_QUOTES, "UTF-8");
}

// Versão do arquivo (data de modificação): força o Chrome a recarregar CSS/JS quando mudarem
function versao_arquivo(string $caminho): int
{
    $t = @filemtime(__DIR__ . "/" . $caminho);
    return $t ?: 1;
}

// Mesma regra usada em regioes.php: o tema vem do nome da região (ou da ordem)
function tema_da_regiao(string $nome, int $ordem): string
{
    $n = mb_strtolower($nome);
    foreach (["floresta" => "floresta", "vale" => "vale", "montanha" => "montanhas", "caverna" => "cavernas"] as $chave => $tema) {
        if (str_contains($n, $chave)) return $tema;
    }
    return ["floresta", "vale", "montanhas", "cavernas"][max(0, $ordem - 1) % 4];
}

// Imagem de cada tema (arquivos que você já tem em /imagens); null se o arquivo não existir
function imagem_do_tema(string $tema): ?string
{
    $mapa = [
        "floresta"  => "imagens/floresta-sequencia.png",
        "vale"      => "imagens/vale-variaveis.png",
        "montanhas" => "imagens/montanhas-decisoes.png",
        "cavernas"  => "imagens/cavernas-repeticao.png",
    ];
    $arquivo = $mapa[$tema] ?? null;
    return ($arquivo && is_file(__DIR__ . "/" . $arquivo)) ? $arquivo : null;
}

// Cores de destaque de cada região
const CORES_TEMA = [
    "floresta"  => ["#4ade80", "#facc15"],
    "vale"      => ["#38bdf8", "#a3e635"],
    "montanhas" => ["#c4b5fd", "#e0f2fe"],
    "cavernas"  => ["#a855f7", "#22d3ee"],
];

function estado_aula(array $a): string
{
    if ($a["total"] === 0) return "vazia";
    if ($a["feitos"] >= $a["total"]) return "feita";
    return $a["feitos"] > 0 ? "andamento" : "nova";
}

const ROTULO_AULA = [
    "feita" => "Concluída", "andamento" => "Em andamento",
    "nova" => "Nova", "vazia" => "Sem exercícios",
];

/* ---------- Dados (mesmas consultas e regra de desbloqueio de regioes.php) ---------- */

$lista = $conexao->query(
    "SELECT id, nome, descricao, ordem FROM regioes WHERE ativa = 1 ORDER BY ordem"
)->fetchAll();

$st = $conexao->prepare(
    "SELECT a.id, a.regiao_id, a.titulo,
        (SELECT COUNT(*) FROM exercicios e WHERE e.aula_id = a.id AND e.ativo = 1) AS total,
        (SELECT COUNT(*) FROM progresso p
           INNER JOIN exercicios e ON e.id = p.exercicio_id
           WHERE e.aula_id = a.id AND e.ativo = 1 AND p.usuario_id = ? AND p.concluido = 1) AS feitos
     FROM aulas a WHERE a.publicada = 1 ORDER BY a.regiao_id, a.ordem"
);
$st->execute([$uid]);

$aulas = [];
foreach ($st->fetchAll() as $a) {
    $aulas[$a["regiao_id"]][] = [
        "id" => (int) $a["id"], "titulo" => $a["titulo"],
        "total" => (int) $a["total"], "feitos" => (int) $a["feitos"],
    ];
}

// Percorre todas as regiões: só abre quando a anterior estiver concluída
$infos = [];
$anterior_ok = true;

foreach ($lista as $r) {
    $rid = (int) $r["id"];
    $as = $aulas[$rid] ?? [];
    $total = array_sum(array_column($as, "total"));
    $feitos = array_sum(array_column($as, "feitos"));

    $bloqueada = !$anterior_ok;
    $completa = !$bloqueada && $feitos >= $total;   // 0 de 0 conta como concluída

    $infos[] = [
        "id" => $rid, "nome" => $r["nome"], "descricao" => $r["descricao"] ?? "",
        "tema" => tema_da_regiao($r["nome"], (int) $r["ordem"]),
        "aulas" => $as, "total" => $total, "feitos" => $feitos,
        "bloqueada" => $bloqueada, "completa" => $completa,
    ];

    $anterior_ok = $completa;
}

$pos = null;
foreach ($infos as $i => $inf) {
    if ($inf["id"] === $id) { $pos = $i; break; }
}

// Região inexistente, inativa ou bloqueada: não deixa entrar digitando a URL
if ($pos === null || $infos[$pos]["bloqueada"]) {
    header("Location: regioes.php");
    exit;
}

$regiao = $infos[$pos];
$anterior = $infos[$pos - 1] ?? null;
$proxima = $infos[$pos + 1] ?? null;
$total_regioes = count($infos);

// Missão da região
$st = $conexao->prepare(
    "SELECT m.titulo,
        (SELECT COUNT(*) FROM progresso p WHERE p.missao_id = m.id AND p.usuario_id = ? AND p.concluido = 1) AS ok
     FROM missoes m WHERE m.ativa = 1 AND m.regiao_id = ? ORDER BY m.id DESC LIMIT 1"
);
$st->execute([$uid, $id]);
$m = $st->fetch();

if (!$m) $missao = "nenhuma";
elseif ($regiao["feitos"] < $regiao["total"]) $missao = "trancada";
elseif ((int) $m["ok"] > 0) $missao = "feita";
else $missao = "aberta";

$missao_texto = [
    "trancada" => "Conclua todos os exercícios da região para abrir a missão.",
    "aberta"   => "Missão disponível. Você já pode enfrentar este desafio!",
    "feita"    => "Missão concluída. Bom trabalho, aventureiro!",
];
$missao_rotulo = ["trancada" => "Trancada", "aberta" => "Disponível", "feita" => "Concluída"];

// Números da página
$pct = $regiao["total"] ? (int) round($regiao["feitos"] / $regiao["total"] * 100) : 0;
$tema = $regiao["tema"];
[$cor1, $cor2] = CORES_TEMA[$tema] ?? CORES_TEMA["floresta"];
$imagem = imagem_do_tema($tema);

// Próxima aula a fazer: a primeira com exercícios pendentes (ou a primeira sem exercícios)
$proxima_aula = null;
foreach ($regiao["aulas"] as $a) {
    if ($a["total"] > 0 && $a["feitos"] < $a["total"]) { $proxima_aula = $a; break; }
}
if (!$proxima_aula) {
    foreach ($regiao["aulas"] as $a) {
        if ($a["total"] === 0) { $proxima_aula = $a; break; }
    }
}
$total_aulas = count($regiao["aulas"]);
$aulas_feitas = count(array_filter($regiao["aulas"], fn($a) => estado_aula($a) === "feita"));
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#050817">

    <title>PIXEL QUEST | <?= e($regiao["nome"]) ?></title>

    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/regiao.css?v=<?= versao_arquivo("css/regiao.css") ?>">
</head>

<body class="pagina-dashboard pagina-regiao"
      data-tema="<?= e($tema) ?>"
      style="--c1: <?= e($cor1) ?>; --c2: <?= e($cor2) ?>;">

    <header class="cabecalho-dashboard">

        <h2>PIXEL QUEST</h2>

        <nav>
            <a href="dashboard.php">Início</a>
            <a href="regioes.php">Regiões</a>
            <a href="logout.php">Sair</a>
        </nav>

    </header>

    <main class="reg">

        <!-- ============ HERO ============ -->
        <section class="reg-hero" aria-labelledby="reg-titulo">
            <div class="reg-hero-img"
                 <?php if ($imagem): ?>style="background-image: url('<?= e($imagem) ?>')"<?php endif; ?>></div>
            <canvas class="reg-particulas" aria-hidden="true"></canvas>

            <div class="reg-hero-conteudo">
                <nav class="reg-caminho" aria-label="Você está em">
                    <a href="regioes.php">Regiões</a>
                    <span aria-hidden="true">/</span>
                    <span><?= e($regiao["nome"]) ?></span>
                </nav>

                <p class="reg-selo">Região <?= $pos + 1 ?> de <?= $total_regioes ?></p>

                <h1 id="reg-titulo"><?= e($regiao["nome"]) ?></h1>

                <?php if ($regiao["descricao"] !== ""): ?>
                    <p class="reg-descricao"><?= e($regiao["descricao"]) ?></p>
                <?php endif; ?>

                <div class="reg-acoes">
                    <?php if ($proxima_aula): ?>
                        <a class="reg-btn reg-btn-principal" href="aula.php?id=<?= (int) $proxima_aula["id"] ?>">
                            <?= $regiao["feitos"] > 0 ? "Continuar aventura" : "Começar aventura" ?>
                        </a>
                    <?php endif; ?>
                    <a class="reg-btn reg-btn-sec" href="aulas.php?id=<?= (int) $regiao["id"] ?>">
                        <?= $proxima_aula ? "Ver todas as aulas" : "Rever as aulas" ?>
                    </a>
                </div>
            </div>

            <div class="reg-anel" style="--pct: <?= $pct ?>">
                <svg viewBox="0 0 120 120" role="img" aria-label="<?= $pct ?>% da região concluído">
                    <defs>
                        <linearGradient id="reg-grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" style="stop-color: var(--c1)"/>
                            <stop offset="1" style="stop-color: var(--c2)"/>
                        </linearGradient>
                    </defs>
                    <circle class="trilho" cx="60" cy="60" r="52"/>
                    <circle class="valor" cx="60" cy="60" r="52" transform="rotate(-90 60 60)"/>
                </svg>
                <div class="reg-anel-texto">
                    <strong><?= $pct ?>%</strong>
                    <span>concluído</span>
                </div>
            </div>
        </section>

        <!-- ============ NÚMEROS ============ -->
        <section class="reg-numeros" aria-label="Resumo da região">
            <div class="reg-numero">
                <span class="reg-icone" aria-hidden="true">✦</span>
                <div>
                    <small>Aulas</small>
                    <strong><?= $aulas_feitas ?> de <?= $total_aulas ?></strong>
                </div>
            </div>
            <div class="reg-numero">
                <span class="reg-icone" aria-hidden="true">⌘</span>
                <div>
                    <small>Exercícios</small>
                    <strong><?= $regiao["total"] ? $regiao["feitos"] . " de " . $regiao["total"] : "ainda não publicados" ?></strong>
                </div>
            </div>
            <div class="reg-numero">
                <span class="reg-icone" aria-hidden="true">⚑</span>
                <div>
                    <small>Missão</small>
                    <strong><?= $missao === "nenhuma" ? "sem missão" : $missao_rotulo[$missao] ?></strong>
                </div>
            </div>
        </section>

        <!-- ============ JORNADA ============ -->
        <section class="reg-jornada" aria-labelledby="jornada-titulo">
            <h2 id="jornada-titulo" class="reg-secao-titulo">Jornada da região</h2>
            <p class="reg-secao-texto">
                Siga a trilha na ordem. Cada aula concluída leva você mais perto da missão final.
            </p>

            <?php if ($regiao["aulas"]): ?>
                <ol class="reg-nos">
                    <?php foreach ($regiao["aulas"] as $i => $a):
                        $estado = estado_aula($a);
                        $atual = $proxima_aula && $proxima_aula["id"] === $a["id"];
                        $pa = $a["total"] ? (int) round($a["feitos"] / $a["total"] * 100) : 0; ?>
                        <li class="reg-no <?= $estado ?> <?= $atual ? "atual" : "" ?>">
                            <span class="reg-marco" aria-hidden="true"><?= $estado === "feita" ? "✓" : $i + 1 ?></span>
                            <a class="reg-cartao" href="aula.php?id=<?= (int) $a["id"] ?>">
                                <?php if ($atual): ?><span class="reg-aqui">Você está aqui</span><?php endif; ?>
                                <h3><?= e($a["titulo"]) ?></h3>
                                <div class="reg-meta">
                                    <span class="reg-chip <?= $estado ?>"><?= ROTULO_AULA[$estado] ?></span>
                                    <small><?= $a["total"] ? $a["feitos"] . "/" . $a["total"] . " exercícios" : "teoria" ?></small>
                                </div>
                                <?php if ($a["total"]): ?>
                                    <div class="reg-mini" role="progressbar" aria-valuemin="0" aria-valuemax="100"
                                         aria-valuenow="<?= $pa ?>"><div style="width: <?= $pa ?>%"></div></div>
                                <?php endif; ?>
                            </a>
                        </li>
                    <?php endforeach; ?>
                </ol>
            <?php else: ?>
                <p class="reg-vazio">As aulas desta região ainda não foram publicadas. Volte em breve!</p>
            <?php endif; ?>
        </section>

        <!-- ============ MISSÃO ============ -->
        <?php if ($missao !== "nenhuma"): ?>
            <section class="reg-missao <?= $missao ?>" aria-labelledby="missao-titulo">
                <span class="reg-missao-icone" aria-hidden="true"><?= $missao === "trancada" ? "🔒" : ($missao === "feita" ? "✓" : "⚑") ?></span>
                <div class="reg-missao-texto">
                    <h2 id="missao-titulo"><?= e($m["titulo"] ?: "Missão da região") ?></h2>
                    <p><?= e($missao_texto[$missao]) ?></p>
                </div>
                <span class="reg-chip <?= $missao === "feita" ? "feita" : ($missao === "aberta" ? "andamento" : "vazia") ?>">
                    <?= $missao_rotulo[$missao] ?>
                </span>
            </section>
        <?php endif; ?>

        <!-- ============ PRÓXIMOS PASSOS ============ -->
        <nav class="reg-vizinhas" aria-label="Outras regiões">
            <?php if ($anterior): ?>
                <a class="reg-vizinha anterior" href="regiao.php?id=<?= (int) $anterior["id"] ?>">
                    <small>Região anterior</small>
                    <strong><?= e($anterior["nome"]) ?></strong>
                </a>
            <?php else: ?>
                <span></span>
            <?php endif; ?>

            <?php if ($proxima): ?>
                <?php if ($proxima["bloqueada"]): ?>
                    <div class="reg-vizinha proxima trancada" aria-disabled="true">
                        <small>Próxima região</small>
                        <strong>🔒 <?= e($proxima["nome"]) ?></strong>
                        <span>Conclua esta região para desbloquear</span>
                    </div>
                <?php else: ?>
                    <a class="reg-vizinha proxima" href="regiao.php?id=<?= (int) $proxima["id"] ?>">
                        <small>Próxima região</small>
                        <strong><?= e($proxima["nome"]) ?></strong>
                    </a>
                <?php endif; ?>
            <?php endif; ?>
        </nav>

        <a href="regioes.php" class="botao-voltar-regioes">
            ← VOLTAR PARA AS REGIÕES
        </a>

    </main>

    <script src="js/regiao.js?v=<?= versao_arquivo("js/regiao.js") ?>" defer></script>
</body>
</html>