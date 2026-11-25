<?php
session_start();
require_once "conexao.php";

if (!isset($_SESSION["usuario_id"])) {
    header("Location: login.php");
    exit;
}

$uid = (int) $_SESSION["usuario_id"];

// Versão do arquivo (data de modificação): obriga o Chrome a recarregar CSS/JS quando mudarem
function versao_arquivo(string $caminho): int
{
    $t = @filemtime(__DIR__ . "/" . $caminho);
    return $t ?: 1;
}

// Define o visual da ilha pelo nome da região (ou pela ordem, se o nome não bater)
function tema_da_regiao(string $nome, int $ordem): string
{
    $n = mb_strtolower($nome);
    foreach (["floresta" => "floresta", "vale" => "vale", "montanha" => "montanhas", "caverna" => "cavernas"] as $chave => $tema) {
        if (str_contains($n, $chave)) return $tema;
    }
    return ["floresta", "vale", "montanhas", "cavernas"][max(0, $ordem - 1) % 4];
}

// Regiões ativas
$lista = $conexao->query(
    "SELECT id, nome, descricao, ordem FROM regioes WHERE ativa = 1 ORDER BY ordem"
)->fetchAll();

// Aulas publicadas com o progresso do aluno em cada uma
$st = $conexao->prepare(
    "SELECT a.id, a.regiao_id, a.titulo,
        ((SELECT COUNT(*) FROM exercicios e WHERE e.aula_id=a.id AND e.ativo=1) +
         (SELECT COUNT(*) FROM questoes q WHERE q.aula_id=a.id AND q.ativa=1)) AS total,
        ((SELECT COUNT(*) FROM progresso p INNER JOIN exercicios e ON e.id=p.exercicio_id
          WHERE e.aula_id=a.id AND e.ativo=1 AND p.usuario_id=? AND p.concluido=1) +
         (SELECT COUNT(*) FROM progresso_questoes pq INNER JOIN questoes q ON q.id=pq.questao_id
          WHERE q.aula_id=a.id AND q.ativa=1 AND pq.usuario_id=?)) AS feitos
     FROM aulas a WHERE a.publicada=1 ORDER BY a.regiao_id,a.ordem"
);
$st->execute([$uid, $uid]);

$aulas = [];
foreach ($st->fetchAll() as $a) {
    $aulas[$a["regiao_id"]][] = [
        "id" => (int) $a["id"], "titulo" => $a["titulo"],
        "total" => (int) $a["total"], "feitos" => (int) $a["feitos"],
    ];
}

// Missão ativa de cada região
$st = $conexao->prepare(
    "SELECT m.regiao_id, m.titulo,
        (SELECT COUNT(*) FROM progresso p WHERE p.missao_id = m.id AND p.usuario_id = ? AND p.concluido = 1) AS ok
     FROM missoes m WHERE m.ativa = 1"
);
$st->execute([$uid]);
$missoes = [];
foreach ($st->fetchAll() as $m) $missoes[$m["regiao_id"]] = $m;

// Monta os dados de cada região (mesma regra de desbloqueio: concluir a anterior)
$regioes = [];
$anterior_ok = true;
$nome_anterior = "";

foreach ($lista as $r) {
    $rid = (int) $r["id"];
    $as = $aulas[$rid] ?? [];
    $total = array_sum(array_column($as, "total"));
    $feitos = array_sum(array_column($as, "feitos"));

    $bloqueada = !$anterior_ok;
    $completa = !$bloqueada && $total > 0 && $feitos >= $total;

    $m = $missoes[$rid] ?? null;
    if (!$m) $missao = "nenhuma";
    elseif ($bloqueada || $feitos < $total) $missao = "trancada";
    elseif ((int) $m["ok"] > 0) $missao = "feita";
    else $missao = "aberta";

    $regioes[] = [
        "id" => $rid,
        "nome" => $r["nome"],
        "descricao" => $r["descricao"] ?? "",
        "tema" => tema_da_regiao($r["nome"], (int) $r["ordem"]),
        "total" => $total, "feitos" => $feitos,
        "bloqueada" => $bloqueada, "completa" => $completa,
        "missao" => $missao, "missaoTitulo" => $m["titulo"] ?? "",
        "anterior" => $nome_anterior,
        "aulas" => $as,
    ];

    $anterior_ok = $completa;
    $nome_anterior = $r["nome"];
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PIXEL QUEST | Regiões</title>
    <link rel="stylesheet" href="css/selecao-regioes.css?v=<?= versao_arquivo("css/selecao-regioes.css") ?>">
</head>
<body class="tela-ilhas">

<main class="tabuleiro">

    <header class="topo-ilhas">
        <p class="subtitulo">EXPLORE NOVOS TERRITÓRIOS</p>
        <h1>Regiões do reino</h1>
    </header>

    <a href="dashboard.php" class="fechar" aria-label="Voltar ao mapa">✕</a>

    <?php if ($regioes): ?>
        <div class="ilhas">
            <?php foreach ($regioes as $r): ?>
                <button type="button"
                        class="ilha <?= $r["bloqueada"] ? "bloqueada" : "livre" ?>"
                        data-id="<?= $r["id"] ?>"
                        aria-haspopup="dialog"
                        aria-label="<?= htmlspecialchars($r["nome"]) ?>: ver informações">

                    <span class="ilha-arte" data-ilha data-tema="<?= htmlspecialchars($r["tema"]) ?>"></span>
                    <?php if ($r["bloqueada"]): ?><span class="cadeado" aria-hidden="true">🔒</span><?php endif; ?>

                    <span class="placa"><?= htmlspecialchars($r["nome"]) ?></span>

                    <span class="contadores">
                        <span class="pilula <?= $r["completa"] && $r["total"] > 0 ? "feita" : "" ?>">
                            <span>Atividades</span>
                            <span><?= $r["bloqueada"] ? "🔒" : "✦ " . $r["feitos"] . "/" . $r["total"] ?></span>
                        </span>
                        <?php if ($r["missao"] !== "nenhuma"): ?>
                            <span class="pilula missao <?= $r["missao"] === "trancada" ? "trancada" : "" ?>">
                                <span>Missão</span>
                                <span><?= $r["missao"] === "trancada" ? "🔒" : ($r["missao"] === "feita" ? "✓" : "✦") ?></span>
                            </span>
                        <?php endif; ?>
                    </span>
                </button>
            <?php endforeach; ?>
        </div>
    <?php else: ?>
        <p class="vazio">Nenhuma região disponível por enquanto. Volte em breve!</p>
    <?php endif; ?>

</main>

<dialog id="painel" aria-labelledby="painel-titulo">
    <div class="p-corpo"></div>
    <form method="dialog"><button class="p-fechar" aria-label="Fechar">✕</button></form>
</dialog>

<script id="dados" type="application/json"><?= json_encode($regioes, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE) ?></script>
<script type="module" src="js/selecao-regioes.js?v=<?= versao_arquivo("js/selecao-regioes.js") ?>"></script>
</body>
</html>