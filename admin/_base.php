<?php
// admin/_base.php
// Incluído no topo de TODA página do admin: login, permissão, CSRF e layout.

session_start();
require_once __DIR__ . "/../conexao.php";

// 1) Precisa estar logado
if (!isset($_SESSION["usuario_id"])) {
    header("Location: ../login.php");
    exit;
}

// 2) Confere no banco se ainda é admin (não confia só na sessão)
$stmt = $conexao->prepare("SELECT tipo FROM usuarios WHERE id = ?");
$stmt->execute([$_SESSION["usuario_id"]]);

if ($stmt->fetchColumn() !== "admin") {
    header("Location: ../dashboard.php");
    exit;
}

// 3) Token CSRF
if (empty($_SESSION["csrf"])) {
    $_SESSION["csrf"] = bin2hex(random_bytes(32));
}

/* ---------- Funções auxiliares ---------- */

function h($valor): string
{
    return htmlspecialchars((string) $valor, ENT_QUOTES, "UTF-8");
}

function csrf_campo(): string
{
    return '<input type="hidden" name="csrf" value="' . h($_SESSION["csrf"]) . '">';
}

function csrf_validar(): void
{
    if (!hash_equals($_SESSION["csrf"], $_POST["csrf"] ?? "")) {
        http_response_code(400);
        exit("Requisição inválida. Volte e tente novamente.");
    }
}

function flash(string $tipo, string $mensagem): void
{
    $_SESSION["flash"][] = [$tipo, $mensagem];
}

function redirecionar(string $url): void
{
    header("Location: " . $url);
    exit;
}

// Lê um inteiro do POST (0 se vier vazio ou inválido)
function post_int(string $campo): int
{
    return (int) filter_input(INPUT_POST, $campo, FILTER_VALIDATE_INT);
}

// Botão que envia um POST com token CSRF (usado em ativar, mover, excluir...)
function botao_post(
    string $acao,
    int $id,
    string $rotulo,
    string $classe = "btn btn-peq",
    array $extra = [],
    ?string $confirmar = null
): void {
    $onsubmit = $confirmar
        ? ' onsubmit="return confirm(' . h(json_encode($confirmar)) . ')"'
        : "";

    echo '<form method="post" class="inline"' . $onsubmit . '>';
    echo csrf_campo();
    echo '<input type="hidden" name="acao" value="' . h($acao) . '">';
    echo '<input type="hidden" name="id" value="' . $id . '">';

    foreach ($extra as $nome => $valor) {
        echo '<input type="hidden" name="' . h($nome) . '" value="' . h($valor) . '">';
    }

    echo '<button type="submit" class="' . h($classe) . '">' . h($rotulo) . '</button>';
    echo '</form>';
}

// Troca a posição de um item com o vizinho (ordem é UNIQUE no banco)
function mover_ordem(PDO $c, string $tabela, ?string $pai, int $id, string $direcao): void
{
    if (!in_array($tabela, ["regioes", "aulas", "exercicios", "questoes"], true)) return;
    if ($pai !== null && !in_array($pai, ["regiao_id", "aula_id"], true)) return;

    $st = $c->prepare("SELECT ordem" . ($pai ? ", $pai" : "") . " FROM $tabela WHERE id = ?");
    $st->execute([$id]);
    $atual = $st->fetch();
    if (!$atual) return;

    $op = $direcao === "subir" ? "<" : ">";
    $ord = $direcao === "subir" ? "DESC" : "ASC";

    $sql = "SELECT id, ordem FROM $tabela WHERE ordem $op ?"
        . ($pai ? " AND $pai = ?" : "")
        . " ORDER BY ordem $ord LIMIT 1";

    $par = [$atual["ordem"]];
    if ($pai) $par[] = $atual[$pai];

    $st = $c->prepare($sql);
    $st->execute($par);
    $vizinho = $st->fetch();
    if (!$vizinho) return;

    try {
        $c->beginTransaction();
        // 255 é um valor temporário para não violar o índice UNIQUE
        $c->prepare("UPDATE $tabela SET ordem = 255 WHERE id = ?")->execute([$id]);
        $c->prepare("UPDATE $tabela SET ordem = ? WHERE id = ?")->execute([$atual["ordem"], $vizinho["id"]]);
        $c->prepare("UPDATE $tabela SET ordem = ? WHERE id = ?")->execute([$vizinho["ordem"], $id]);
        $c->commit();
    } catch (Throwable $e) {
        $c->rollBack();
        throw $e;
    }
}

// Upload seguro de imagem. Retorna o nome do arquivo ou null se nada foi enviado.
function enviar_imagem(string $campo): ?string
{
    if (empty($_FILES[$campo]) || $_FILES[$campo]["error"] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $f = $_FILES[$campo];

    if ($f["error"] !== UPLOAD_ERR_OK || $f["size"] > 3 * 1024 * 1024) {
        throw new InvalidArgumentException("Não foi possível enviar a imagem (máximo de 3 MB).");
    }

    $permitidos = ["image/png" => "png", "image/jpeg" => "jpg", "image/webp" => "webp"];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f["tmp_name"]);

    if (!isset($permitidos[$mime])) {
        throw new InvalidArgumentException("A imagem precisa ser PNG, JPG ou WEBP.");
    }

    $nome = "regiao-" . bin2hex(random_bytes(6)) . "." . $permitidos[$mime];

    if (!move_uploaded_file($f["tmp_name"], __DIR__ . "/../imagens/" . $nome)) {
        throw new InvalidArgumentException("Não foi possível salvar a imagem na pasta imagens/.");
    }

    return $nome;
}

/* ---------- Layout ---------- */

function admin_topo(string $titulo, string $ativo = ""): void
{
    $menu = [
        "index"      => ["Painel", "index.php"],
        "regioes"    => ["Regiões", "regioes.php"],
        "aulas"      => ["Aulas", "aulas.php"],
        "exercicios" => ["Exercícios", "exercicios.php"],
        "questoes"   => ["Questões", "questoes.php"],
        "missoes"    => ["Missões", "missoes.php"],
        "usuarios"   => ["Usuários", "usuarios.php"],
    ];
?>
    <!DOCTYPE html>
    <html lang="pt-br">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title><?= h($titulo) ?> | Admin PIXEL QUEST</title>
        <link rel="stylesheet" href="../css/admin.css">
    </head>

    <body class="admin">

        <header class="admin-topo">
            <span class="admin-marca">PIXEL QUEST <small>admin</small></span>

            <nav>
                <?php foreach ($menu as $chave => [$rotulo, $link]): ?>
                    <a href="<?= $link ?>" class="<?= $chave === $ativo ? 'ativo' : '' ?>"><?= $rotulo ?></a>
                <?php endforeach; ?>
            </nav>

            <nav class="admin-conta">
                <a href="../dashboard.php">Ver o site</a>
                <a href="../logout.php">Sair</a>
            </nav>
        </header>

        <main class="admin-main">

            <?php foreach ($_SESSION["flash"] ?? [] as [$tipo, $mensagem]): ?>
                <div class="flash <?= h($tipo) ?>"><?= h($mensagem) ?></div>
            <?php endforeach;
            unset($_SESSION["flash"]); ?>

            <h1><?= h($titulo) ?></h1>
        <?php
    }

    function admin_rodape(): void
    {
        echo "</main>\n</body>\n</html>";
    }
