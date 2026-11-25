<?php
require_once __DIR__ . "/_base.php";

$dados = null;     // dados para reabrir o formulário após um erro
$editar_id = 0;

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    csrf_validar();

    $acao = $_POST["acao"] ?? "";
    $id = post_int("id");

    try {

        if ($acao === "salvar") {

            $nome = trim($_POST["nome"] ?? "");
            $descricao = trim($_POST["descricao"] ?? "");
            $ativa = isset($_POST["ativa"]) ? 1 : 0;

            if ($nome === "" || mb_strlen($nome) > 100) {
                throw new InvalidArgumentException("Informe um nome de até 100 caracteres.");
            }

            $imagem = enviar_imagem("imagem");

            if ($id) {
                $sql = "UPDATE regioes SET nome = ?, descricao = ?, ativa = ?"
                     . ($imagem ? ", imagem = ?" : "") . " WHERE id = ?";
                $par = [$nome, $descricao, $ativa];
                if ($imagem) $par[] = $imagem;
                $par[] = $id;

                $conexao->prepare($sql)->execute($par);
                flash("ok", "Região atualizada.");

            } else {
                $ordem = (int) $conexao->query("SELECT COALESCE(MAX(ordem), 0) + 1 FROM regioes")->fetchColumn();

                $conexao->prepare(
                    "INSERT INTO regioes (nome, descricao, ordem, imagem, ativa) VALUES (?, ?, ?, ?, ?)"
                )->execute([$nome, $descricao, $ordem, $imagem, $ativa]);

                flash("ok", "Região criada.");
            }

        } elseif ($acao === "alternar") {

            $conexao->prepare("UPDATE regioes SET ativa = IF(ativa = 1, 0, 1) WHERE id = ?")->execute([$id]);
            flash("ok", "Status da região alterado.");

        } elseif ($acao === "mover") {

            mover_ordem($conexao, "regioes", null, $id, ($_POST["dir"] ?? "") === "subir" ? "subir" : "descer");

        } elseif ($acao === "excluir") {

            $conexao->prepare("DELETE FROM regioes WHERE id = ?")->execute([$id]);
            flash("ok", "Região excluída.");
        }

        redirecionar("regioes.php");

    } catch (PDOException $e) {

        if ($e->getCode() === "23000" && $acao === "excluir") {
            flash("erro", "Não é possível excluir: a região tem aulas, missões ou progresso vinculados. Desative-a.");
        } else {
            error_log($e->getMessage());
            flash("erro", "Erro ao gravar no banco de dados.");
        }

        if ($acao === "salvar") { $dados = $_POST; $editar_id = $id; }

    } catch (InvalidArgumentException $e) {

        flash("erro", $e->getMessage());
        $dados = $_POST;
        $editar_id = $id;
    }
}

/* ---------- Formulário (novo / editar) ---------- */

$d = ["nome" => "", "descricao" => "", "imagem" => "", "ativa" => 1];
$modo_form = $dados !== null || isset($_GET["novo"]) || isset($_GET["editar"]);

if ($dados !== null) {
    $d = [
        "nome" => $dados["nome"] ?? "",
        "descricao" => $dados["descricao"] ?? "",
        "imagem" => "",
        "ativa" => isset($dados["ativa"]) ? 1 : 0,
    ];
} elseif (isset($_GET["editar"])) {
    $editar_id = (int) $_GET["editar"];
    $st = $conexao->prepare("SELECT * FROM regioes WHERE id = ?");
    $st->execute([$editar_id]);
    $d = $st->fetch();

    if (!$d) {
        flash("erro", "Região não encontrada.");
        redirecionar("regioes.php");
    }
}

/* ---------- Lista ---------- */

$regioes = $conexao->query(
    "SELECT r.*, (SELECT COUNT(*) FROM aulas a WHERE a.regiao_id = r.id) AS n_aulas
     FROM regioes r ORDER BY r.ordem"
)->fetchAll();

admin_topo($modo_form ? ($editar_id ? "Editar região" : "Nova região") : "Regiões", "regioes");

if ($modo_form): ?>

    <form method="post" action="regioes.php" enctype="multipart/form-data" class="form-admin">
        <?= csrf_campo() ?>
        <input type="hidden" name="acao" value="salvar">
        <input type="hidden" name="id" value="<?= $editar_id ?>">

        <label>Nome
            <input type="text" name="nome" maxlength="100" value="<?= h($d["nome"]) ?>" required>
        </label>

        <label>Descrição
            <textarea name="descricao" rows="3"><?= h($d["descricao"]) ?></textarea>
        </label>

        <label>Imagem (PNG, JPG ou WEBP, até 3 MB)
            <input type="file" name="imagem" accept="image/png,image/jpeg,image/webp">
        </label>

        <?php if (!empty($d["imagem"])): ?>
            <p class="dica">Imagem atual: <?= h($d["imagem"]) ?>
                <img class="mini" src="../imagens/<?= h($d["imagem"]) ?>" alt="" onerror="this.style.display='none'">
            </p>
        <?php endif; ?>

        <label class="check">
            <input type="checkbox" name="ativa" <?= $d["ativa"] ? "checked" : "" ?>>
            Região ativa (visível para os alunos)
        </label>

        <div class="acoes-form">
            <button type="submit" class="btn">Salvar região</button>
            <a href="regioes.php" class="btn btn-sec">Cancelar</a>
        </div>
    </form>

<?php else: ?>

    <div class="barra"><a href="?novo=1" class="btn">Nova região</a></div>

    <?php if ($regioes): ?>
    <div class="tabela-wrap">
    <table class="tabela">
        <thead>
            <tr><th>Ordem</th><th>Imagem</th><th>Nome</th><th>Aulas</th><th>Status</th><th>Ações</th></tr>
        </thead>
        <tbody>
        <?php foreach ($regioes as $r): ?>
            <tr>
                <td class="ordem">
                    <?= (int) $r["ordem"] ?>
                    <?php botao_post("mover", (int) $r["id"], "↑", "btn btn-peq btn-sec", ["dir" => "subir"]); ?>
                    <?php botao_post("mover", (int) $r["id"], "↓", "btn btn-peq btn-sec", ["dir" => "descer"]); ?>
                </td>
                <td>
                    <?php if ($r["imagem"]): ?>
                        <img class="mini" src="../imagens/<?= h($r["imagem"]) ?>" alt="" onerror="this.style.visibility='hidden'">
                    <?php endif; ?>
                </td>
                <td><?= h($r["nome"]) ?></td>
                <td><a href="aulas.php?regiao=<?= (int) $r["id"] ?>"><?= (int) $r["n_aulas"] ?></a></td>
                <td><span class="badge <?= $r["ativa"] ? "ok" : "off" ?>"><?= $r["ativa"] ? "Ativa" : "Inativa" ?></span></td>
                <td class="acoes">
                    <a class="btn btn-peq btn-sec" href="?editar=<?= (int) $r["id"] ?>">Editar</a>
                    <?php botao_post("alternar", (int) $r["id"], $r["ativa"] ? "Desativar" : "Ativar"); ?>
                    <?php botao_post("excluir", (int) $r["id"], "Excluir", "btn btn-peq btn-perigo", [],
                        "Excluir a região \"{$r["nome"]}\"? Só funciona se ela não tiver aulas nem progresso."); ?>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    </div>
    <?php else: ?>
        <p class="vazio">Nenhuma região cadastrada. Crie a primeira.</p>
    <?php endif; ?>

<?php endif;

admin_rodape();