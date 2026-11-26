<?php
// missao.php?id=<ID DA REGIÃO>
// Cada região tem uma missão final (tabela missoes, uma por região).
// A correção é feita por monaco/executar.php (agora aceita missao_id).

session_start();
require_once __DIR__ . "/conexao.php";
require_once __DIR__ . "/includes/missao_status.php";

if (!isset($_SESSION["usuario_id"])) {
    header("Location: login.php");
    exit;
}

$uid = (int) $_SESSION["usuario_id"];
$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);
if (!$id) {
    header("Location: regioes.php");
    exit;
}

if (empty($_SESSION["csrf_aluno"])) {
    $_SESSION["csrf_aluno"] = bin2hex(random_bytes(32));
}

function e(?string $texto): string
{
    return htmlspecialchars($texto ?? "", ENT_QUOTES, "UTF-8");
}

// Mesma regra de tema usada em regiao.php / regioes.php
function tema_da_regiao(string $nome, int $ordem): string
{
    $n = mb_strtolower($nome);
    foreach (["floresta" => "floresta", "vale" => "vale", "montanha" => "montanhas", "caverna" => "cavernas"] as $chave => $tema) {
        if (str_contains($n, $chave)) return $tema;
    }
    return ["floresta", "vale", "montanhas", "cavernas"][max(0, $ordem - 1) % 4];
}

const CORES_TEMA = [
    "floresta"  => ["#4ade80", "#facc15"],
    "vale"      => ["#38bdf8", "#a3e635"],
    "montanhas" => ["#c4b5fd", "#e0f2fe"],
    "cavernas"  => ["#a855f7", "#22d3ee"],
];

const IMAGENS_TEMA = [
    "floresta"  => "imagens/floresta-sequencia.png",
    "vale"      => "imagens/vale-variaveis.png",
    "montanhas" => "imagens/montanhas-decisoes.png",
    "cavernas"  => "imagens/cavernas-repeticao.png",
];

/* ---------- Dados ---------- */

$info = status_missao($conexao, $uid, $id);

// Região inexistente/inativa ou ainda bloqueada: não deixa entrar digitando a URL
if (!$info || $info["regiao_bloqueada"]) {
    header("Location: regioes.php");
    exit;
}
// Região sem missão ativa: volta para a região
if (!$info["missao"]) {
    header("Location: regiao.php?id=" . $id);
    exit;
}

$m = $info["missao"];
$regiao = $info["regiao"];

$tema = tema_da_regiao($regiao["nome"], (int) $regiao["ordem"]);
[$cor1, $cor2] = CORES_TEMA[$tema];
$imagem = IMAGENS_TEMA[$tema];
if (!is_file(__DIR__ . "/" . $imagem)) {
    $imagem = null;
}

$configurada = trim((string) $m["saida_esperada"]) !== "";

// trancada | preparo | feita | aberta
if (!$info["liberada"]) {
    $estado = "trancada";
} elseif (!$configurada) {
    $estado = "preparo";
} elseif ($info["concluida"]) {
    $estado = "feita";
} else {
    $estado = "aberta";
}

// O enunciado é o "pergaminho"; se estiver vazio (ou for o texto padrão), usa a descrição
$enunciado = trim((string) $m["enunciado"]);
if ($enunciado === "" || $enunciado === "Missão a ser configurada.") {
    $enunciado = trim((string) $m["descricao"]);
}

$pct = $info["total"] > 0 ? (int) floor($info["feitos"] * 100 / $info["total"]) : 0;
$rotulo_estado = ["trancada" => "Trancada", "preparo" => "Em preparação", "aberta" => "Em andamento", "feita" => "Concluída"][$estado];
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PIXEL QUEST | Missão: <?= e($m["titulo"]) ?></title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/missao.css">
</head>

<body class="pagina-dashboard pagina-missao" style="--c1: <?= e($cor1) ?>; --c2: <?= e($cor2) ?>;">

    <header class="cabecalho-dashboard">
        <h2>PIXEL QUEST</h2>
        <nav><a href="dashboard.php">Início</a><a href="regioes.php">Regiões</a><a href="logout.php">Sair</a></nav>
    </header>

    <main class="ms estado-<?= e($estado) ?>" id="ms-app"
        data-missao="<?= (int) $m["id"] ?>"
        data-csrf="<?= e($_SESSION["csrf_aluno"]) ?>"
        data-concluida="<?= $info["concluida"] ? 1 : 0 ?>">

        <div class="ms-caminho">
            <a href="regiao.php?id=<?= (int) $regiao["id"] ?>">← <?= e($regiao["nome"]) ?></a>
            <span>Missão final da região</span>
        </div>

        <!-- ============ BANNER DA MISSÃO ============ -->
        <section class="ms-heroi" aria-labelledby="ms-titulo">
            <?php if ($imagem): ?>
                <div class="ms-heroi-arte" style="background-image: url('<?= e($imagem) ?>');"></div>
            <?php endif; ?>
            <div class="ms-heroi-veu"></div>

            <div class="ms-heroi-conteudo">
                <p class="ms-selo"><span aria-hidden="true">⚑</span> MISSÃO FINAL · <?= e($regiao["nome"]) ?></p>
                <h1 id="ms-titulo"><?= e($m["titulo"]) ?></h1>
                <p class="ms-descricao"><?= e($m["descricao"]) ?></p>

                <ul class="ms-stats">
                    <li>
                        <small>Recompensa</small>
                        <strong class="ms-xp">+<?= (int) $m["xp"] ?> XP</strong>
                    </li>
                    <li>
                        <small>Tentativas</small>
                        <strong id="ms-tentativas"><?= (int) $info["tentativas"] ?></strong>
                    </li>
                    <li>
                        <small>Status</small>
                        <strong id="ms-estado"><?= e($rotulo_estado) ?></strong>
                    </li>
                </ul>
            </div>
        </section>

        <?php if ($estado === "trancada"): ?>

            <!-- ============ PORTÃO TRANCADO ============ -->
            <section class="ms-portao" aria-labelledby="ms-portao-titulo">
                <span class="ms-cadeado" aria-hidden="true">🔒</span>
                <h2 id="ms-portao-titulo">O portão ainda está trancado</h2>
                <p>Conclua todas as atividades desta região (exercícios e questões) para abrir a missão final.</p>

                <div class="ms-progresso" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="<?= $pct ?>">
                    <div style="width: <?= $pct ?>%"></div>
                </div>
                <p class="ms-progresso-texto"><?= (int) $info["feitos"] ?> de <?= (int) $info["total"] ?> atividades concluídas</p>

                <a class="ms-botao" href="regiao.php?id=<?= (int) $regiao["id"] ?>">Voltar para a região</a>
            </section>

        <?php elseif ($estado === "preparo"): ?>

            <!-- ============ MISSÃO AINDA NÃO CONFIGURADA ============ -->
            <section class="ms-portao" aria-labelledby="ms-preparo-titulo">
                <span class="ms-cadeado" aria-hidden="true">⚒</span>
                <h2 id="ms-preparo-titulo">A missão está sendo preparada</h2>
                <p>Os guardiões ainda estão forjando este desafio. Volte em breve!</p>
                <a class="ms-botao" href="regiao.php?id=<?= (int) $regiao["id"] ?>">Voltar para a região</a>
            </section>

        <?php else: ?>

            <!-- ============ TRILHA DA MISSÃO ============ -->
            <ol class="ms-etapas" aria-label="Etapas da missão">
                <li class="ms-etapa atual"><span>1</span><strong>Leia o pergaminho</strong></li>
                <li class="ms-etapa"><span>2</span><strong>Escreva o código</strong></li>
                <li class="ms-etapa"><span>3</span><strong>Vença o desafio</strong></li>
            </ol>

            <!-- ============ ARENA: pergaminho | forja de código ============ -->
            <div class="ms-arena">

                <section class="ms-painel ms-pergaminho" aria-labelledby="ms-perg-titulo">
                    <h2 id="ms-perg-titulo"><span aria-hidden="true">✦</span> Pergaminho da missão</h2>
                    <div class="ms-texto"><?= nl2br(e($enunciado)) ?></div>
                    <p class="ms-dica"><b>Dica:</b> use <kbd>Ctrl</kbd> + <kbd>Enter</kbd> para executar sem tirar a mão do teclado.</p>
                </section>

                <section class="ms-painel ms-forja" aria-labelledby="ms-forja-titulo">
                    <h2 id="ms-forja-titulo"><span aria-hidden="true">⌨</span> Forja de código</h2>

                    <?php if ($estado === "feita"): ?>
                        <p class="ms-aviso">✓ Você já concluiu esta missão. Pode treinar de novo, mas o XP só é dado uma vez.</p>
                    <?php endif; ?>

                    <div class="ms-editor" id="ms-editor" data-initial="<?= e((string) $m["codigo_inicial"]) ?>"></div>

                    <button class="ms-executar" id="ms-executar" type="button">⚔ Executar e corrigir</button>

                    <p class="ms-saida-label">SAÍDA</p>
                    <pre class="ms-resultado" id="ms-resultado" aria-live="polite">O resultado aparecerá aqui.</pre>
                </section>
            </div>

            <!-- ============ VITÓRIA (aparece quando o aluno acerta) ============ -->
            <section class="ms-vitoria" id="ms-vitoria" hidden aria-labelledby="ms-vit-titulo">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                <span class="ms-vitoria-icone" aria-hidden="true">★</span>
                <h2 id="ms-vit-titulo">MISSÃO CUMPRIDA!</h2>
                <p>Você restaurou a região <strong><?= e($regiao["nome"]) ?></strong>. O cristal brilha um pouquinho mais.</p>
                <p class="ms-vitoria-xp" id="ms-vitoria-xp"></p>
                <div class="ms-vitoria-botoes">
                    <a class="ms-botao" href="regioes.php">Ver o mapa de regiões</a>
                    <a class="ms-botao ms-botao-sec" href="regiao.php?id=<?= (int) $regiao["id"] ?>">Voltar para a região</a>
                </div>
            </section>

        <?php endif; ?>

    </main>

    <?php if ($estado === "aberta" || $estado === "feita"): ?>
        <!-- Se o Monaco não carregar (CDN bloqueada), o JS usa uma caixa de texto simples -->
        <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/loader.js" onerror="window.msSemMonaco = true"></script>
        <script src="js/missao.js"></script>
    <?php endif; ?>
</body>

</html>