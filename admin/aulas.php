<?php
require_once __DIR__ . "/_base.php";

$filtro = filter_input(INPUT_GET, "regiao", FILTER_VALIDATE_INT) ?: 0;
$base = "aulas.php" . ($filtro ? "?regiao=$filtro" : "");

$dados = null;
$editar_id = 0;

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    csrf_validar();

    $acao = $_POST["acao"] ?? "";
    $id = post_int("id");

    try {

        if ($acao === "salvar") {

            $titulo = trim($_POST["titulo"] ?? "");
            $resumo = trim($_POST["resumo"] ?? "");
            $conteudo = trim($_POST["conteudo"] ?? "");
            $publicada = isset($_POST["publicada"]) ? 1 : 0;

            if ($titulo === "" || mb_strlen($titulo) > 150) {
                throw new InvalidArgumentException("Informe um título de até 150 caracteres.");
            }

            if ($id) {
                $conexao->prepare(
                    "UPDATE aulas SET titulo = ?, resumo = ?, conteudo = ?, publicada = ? WHERE id = ?"
                )->execute([$titulo, $resumo, $conteudo, $publicada, $id]);

                flash("ok", "Aula atualizada.");

            } else {
                $regiao_id = post_int("regiao_id");

                $st = $conexao->prepare("SELECT id FROM regioes WHERE id = ?");
                $st->execute([$regiao_id]);
                if (!$st->fetch()) {
                    throw new InvalidArgumentException("Escolha a região da aula.");
                }

                $st = $conexao->prepare("SELECT COALESCE(MAX(ordem), 0) + 1 FROM aulas WHERE regiao_id = ?");
                $st->execute([$regiao_id]);
                $ordem = (int) $st->fetchColumn();

                $conexao->prepare(
                    "INSERT INTO aulas (regiao_id, titulo, resumo, conteudo, ordem, publicada)
                     VALUES (?, ?, ?, ?, ?, ?)"
                )->execute([$regiao_id, $titulo, $resumo, $conteudo, $ordem, $publicada]);

                flash("ok", "Aula criada.");
                redirecionar("aulas.php?regiao=$regiao_id");
            }

        } elseif ($acao === "alternar") {

            $conexao->prepare("UPDATE aulas SET publicada = IF(publicada = 1, 0, 1) WHERE id = ?")->execute([$id]);
            flash("ok", "Status da aula alterado.");

        } elseif ($acao === "mover") {

            mover_ordem($conexao, "aulas", "regiao_id", $id, ($_POST["dir"] ?? "") === "subir" ? "subir" : "descer");

        } elseif ($acao === "excluir") {

            $conexao->prepare("DELETE FROM aulas WHERE id = ?")->execute([$id]);
            flash("ok", "Aula excluída.");
        }

        redirecionar($base);

    } catch (PDOException $e) {

        if ($e->getCode() === "23000" && $acao === "excluir") {
            flash("erro", "Não é possível excluir: a aula tem exercícios vinculados. Despublique-a.");
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

/* ---------- Formulário ---------- */

$d = ["titulo" => "", "resumo" => "", "conteudo" => "", "publicada" => 1, "regiao_id" => $filtro];
$modo_form = $dados !== null || isset($_GET["novo"]) || isset($_GET["editar"]);

if ($dados !== null) {
    $d = [
        "titulo" => $dados["titulo"] ?? "",
        "resumo" => $dados["resumo"] ?? "",
        "conteudo" => $dados["conteudo"] ?? "",
        "publicada" => isset($dados["publicada"]) ? 1 : 0,
        "regiao_id" => (int) ($dados["regiao_id"] ?? 0),
    ];
} elseif (isset($_GET["editar"])) {
    $editar_id = (int) $_GET["editar"];
    $st = $conexao->prepare("SELECT * FROM aulas WHERE id = ?");
    $st->execute([$editar_id]);
    $d = $st->fetch();

    if (!$d) {
        flash("erro", "Aula não encontrada.");
        redirecionar($base);
    }
}

$regioes = $conexao->query("SELECT id, nome FROM regioes ORDER BY ordem")->fetchAll();

/* ---------- Lista ---------- */

$sql = "SELECT a.*, r.nome AS regiao,
               (SELECT COUNT(*) FROM exercicios e WHERE e.aula_id = a.id) AS n_ex
        FROM aulas a
        INNER JOIN regioes r ON r.id = a.regiao_id"
     . ($filtro ? " WHERE a.regiao_id = ?" : "")
     . " ORDER BY r.ordem, a.ordem";

$st = $conexao->prepare($sql);
$st->execute($filtro ? [$filtro] : []);
$aulas = $st->fetchAll();

admin_topo($modo_form ? ($editar_id ? "Editar aula" : "Nova aula") : "Aulas", "aulas");

if ($modo_form): ?>

    <form method="post" action="<?= h($base) ?>" class="form-admin">
        <?= csrf_campo() ?>
        <input type="hidden" name="acao" value="salvar">
        <input type="hidden" name="id" value="<?= $editar_id ?>">

        <?php if (!$editar_id): ?>
            <label>Região
                <select name="regiao_id" required>
                    <option value="">Escolha a região</option>
                    <?php foreach ($regioes as $r): ?>
                        <option value="<?= (int) $r["id"] ?>" <?= (int) $d["regiao_id"] === (int) $r["id"] ? "selected" : "" ?>>
                            <?= h($r["nome"]) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </label>
        <?php endif; ?>

        <label>Título
            <input type="text" name="titulo" maxlength="150" value="<?= h($d["titulo"]) ?>" required>
        </label>

        <label>Resumo (aparece no card da aula)
            <textarea name="resumo" rows="2"><?= h($d["resumo"]) ?></textarea>
        </label>

        <label>Conteúdo da aula
            <textarea name="conteudo" rows="16"><?= h($d["conteudo"]) ?></textarea>
        </label>
        <p class="dica">Texto simples: as quebras de linha são mantidas na página do aluno. HTML não é interpretado.</p>

        <label class="check">
            <input type="checkbox" name="publicada" <?= $d["publicada"] ? "checked" : "" ?>>
            Aula publicada (visível para os alunos)
        </label>

        <div class="acoes-form">
            <button type="submit" class="btn">Salvar aula</button>
            <a href="<?= h($base) ?>" class="btn btn-sec">Cancelar</a>
        </div>
    </form>

<?php else: ?>

    <div class="barra">
        <form method="get" class="filtros">
            <label>Região
                <select name="regiao" onchange="this.form.submit()">
                    <option value="0">Todas</option>
                    <?php foreach ($regioes as $r): ?>
                        <option value="<?= (int) $r["id"] ?>" <?= $filtro === (int) $r["id"] ? "selected" : "" ?>>
                            <?= h($r["nome"]) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </label>
        </form>

        <a href="<?= h($base . ($filtro ? "&" : "?")) ?>novo=1" class="btn">Nova aula</a>
    </div>

    <?php if ($aulas): ?>
    <div class="tabela-wrap">
    <table class="tabela">
        <thead>
            <tr><th>Ordem</th><th>Título</th><th>Região</th><th>Conteúdo</th><th>Exercícios</th><th>Status</th><th>Ações</th></tr>
        </thead>
        <tbody>
        <?php foreach ($aulas as $a): ?>
            <tr>
                <td class="ordem">
                    <?= (int) $a["ordem"] ?>
                    <?php botao_post("mover", (int) $a["id"], "↑", "btn btn-peq btn-sec", ["dir" => "subir"]); ?>
                    <?php botao_post("mover", (int) $a["id"], "↓", "btn btn-peq btn-sec", ["dir" => "descer"]); ?>
                </td>
                <td><?= h($a["titulo"]) ?></td>
                <td><?= h($a["regiao"]) ?></td>
                <td>
                    <span class="badge <?= trim((string) $a["conteudo"]) !== "" ? "ok" : "alerta" ?>">
                        <?= trim((string) $a["conteudo"]) !== "" ? "Preenchido" : "Vazio" ?>
                    </span>
                </td>
                <td><a href="exercicios.php?aula=<?= (int) $a["id"] ?>"><?= (int) $a["n_ex"] ?></a></td>
                <td><span class="badge <?= $a["publicada"] ? "ok" : "off" ?>"><?= $a["publicada"] ? "Publicada" : "Rascunho" ?></span></td>
                <td class="acoes">
                    <a class="btn btn-peq btn-sec" href="<?= h($base . ($filtro ? "&" : "?")) ?>editar=<?= (int) $a["id"] ?>">Editar</a>
                    <?php botao_post("alternar", (int) $a["id"], $a["publicada"] ? "Despublicar" : "Publicar"); ?>
                    <?php botao_post("excluir", (int) $a["id"], "Excluir", "btn btn-peq btn-perigo", [],
                        "Excluir a aula \"{$a["titulo"]}\"? Só funciona se ela não tiver exercícios."); ?>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    </div>
    <?php else: ?>
        <p class="vazio">Nenhuma aula encontrada. Crie a primeira.</p>
    <?php endif; ?>

<?php endif;

admin_rodape();