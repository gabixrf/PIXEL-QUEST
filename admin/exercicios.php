<?php
require_once __DIR__ . "/_base.php";

$filtro = filter_input(INPUT_GET, "aula", FILTER_VALIDATE_INT) ?: 0;
$base = "exercicios.php" . ($filtro ? "?aula=$filtro" : "");

$dados = null;
$editar_id = 0;

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    csrf_validar();

    $acao = $_POST["acao"] ?? "";
    $id = post_int("id");

    try {

        if ($acao === "salvar") {

            $titulo = trim($_POST["titulo"] ?? "");
            $enunciado = trim($_POST["enunciado"] ?? "");
            $codigo_inicial = rtrim($_POST["codigo_inicial"] ?? "");
            $codigo_solucao = rtrim($_POST["codigo_solucao"] ?? "");
            $saida = trim($_POST["saida_esperada"] ?? "");
            $xp = filter_var($_POST["xp"] ?? "", FILTER_VALIDATE_INT, ["options" => ["min_range" => 0, "max_range" => 10000]]);
            $ativo = isset($_POST["ativo"]) ? 1 : 0;

            if ($titulo === "" || mb_strlen($titulo) > 150) {
                throw new InvalidArgumentException("Informe um título de até 150 caracteres.");
            }
            if ($enunciado === "") {
                throw new InvalidArgumentException("Escreva o enunciado do exercício.");
            }
            if ($saida === "") {
                throw new InvalidArgumentException("Informe a saída esperada: é com ela que o código do aluno é corrigido.");
            }
            if ($xp === false) {
                throw new InvalidArgumentException("O XP precisa ser um número entre 0 e 10000.");
            }

            if ($id) {
                $conexao->prepare(
                    "UPDATE exercicios SET titulo = ?, enunciado = ?, codigo_inicial = ?, codigo_solucao = ?,
                            saida_esperada = ?, xp = ?, ativo = ? WHERE id = ?"
                )->execute([$titulo, $enunciado, $codigo_inicial, $codigo_solucao, $saida, $xp, $ativo, $id]);

                flash("ok", "Exercício atualizado.");

            } else {
                $aula_id = post_int("aula_id");

                $st = $conexao->prepare("SELECT id FROM aulas WHERE id = ?");
                $st->execute([$aula_id]);
                if (!$st->fetch()) {
                    throw new InvalidArgumentException("Escolha a aula do exercício.");
                }

                $st = $conexao->prepare("SELECT COALESCE(MAX(ordem), 0) + 1 FROM exercicios WHERE aula_id = ?");
                $st->execute([$aula_id]);
                $ordem = (int) $st->fetchColumn();

                $conexao->prepare(
                    "INSERT INTO exercicios (aula_id, titulo, enunciado, codigo_inicial, codigo_solucao, saida_esperada, ordem, xp, ativo)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
                )->execute([$aula_id, $titulo, $enunciado, $codigo_inicial, $codigo_solucao, $saida, $ordem, $xp, $ativo]);

                flash("ok", "Exercício criado.");
                redirecionar("exercicios.php?aula=$aula_id");
            }

        } elseif ($acao === "alternar") {

            $conexao->prepare("UPDATE exercicios SET ativo = IF(ativo = 1, 0, 1) WHERE id = ?")->execute([$id]);
            flash("ok", "Status do exercício alterado.");

        } elseif ($acao === "mover") {

            mover_ordem($conexao, "exercicios", "aula_id", $id, ($_POST["dir"] ?? "") === "subir" ? "subir" : "descer");

        } elseif ($acao === "excluir") {

            $conexao->prepare("DELETE FROM exercicios WHERE id = ?")->execute([$id]);
            flash("ok", "Exercício excluído.");
        }

        redirecionar($base);

    } catch (PDOException $e) {

        if ($e->getCode() === "23000" && $acao === "excluir") {
            flash("erro", "Não é possível excluir: alunos já têm progresso neste exercício. Desative-o.");
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

$d = [
    "titulo" => "", "enunciado" => "", "codigo_inicial" => "", "codigo_solucao" => "",
    "saida_esperada" => "", "xp" => 10, "ativo" => 1, "aula_id" => $filtro,
];
$modo_form = $dados !== null || isset($_GET["novo"]) || isset($_GET["editar"]);

if ($dados !== null) {
    $d = [
        "titulo" => $dados["titulo"] ?? "",
        "enunciado" => $dados["enunciado"] ?? "",
        "codigo_inicial" => $dados["codigo_inicial"] ?? "",
        "codigo_solucao" => $dados["codigo_solucao"] ?? "",
        "saida_esperada" => $dados["saida_esperada"] ?? "",
        "xp" => $dados["xp"] ?? 10,
        "ativo" => isset($dados["ativo"]) ? 1 : 0,
        "aula_id" => (int) ($dados["aula_id"] ?? 0),
    ];
} elseif (isset($_GET["editar"])) {
    $editar_id = (int) $_GET["editar"];
    $st = $conexao->prepare("SELECT * FROM exercicios WHERE id = ?");
    $st->execute([$editar_id]);
    $d = $st->fetch();

    if (!$d) {
        flash("erro", "Exercício não encontrado.");
        redirecionar($base);
    }
}

$aulas = $conexao->query(
    "SELECT a.id, a.titulo, r.nome AS regiao
     FROM aulas a INNER JOIN regioes r ON r.id = a.regiao_id
     ORDER BY r.ordem, a.ordem"
)->fetchAll();

/* ---------- Lista ---------- */

$sql = "SELECT e.*, a.titulo AS aula
        FROM exercicios e INNER JOIN aulas a ON a.id = e.aula_id
        INNER JOIN regioes r ON r.id = a.regiao_id"
     . ($filtro ? " WHERE e.aula_id = ?" : "")
     . " ORDER BY r.ordem, a.ordem, e.ordem";

$st = $conexao->prepare($sql);
$st->execute($filtro ? [$filtro] : []);
$exercicios = $st->fetchAll();

admin_topo($modo_form ? ($editar_id ? "Editar exercício" : "Novo exercício") : "Exercícios", "exercicios");

if ($modo_form): ?>

    <form method="post" action="<?= h($base) ?>" class="form-admin">
        <?= csrf_campo() ?>
        <input type="hidden" name="acao" value="salvar">
        <input type="hidden" name="id" value="<?= $editar_id ?>">

        <?php if (!$editar_id): ?>
            <label>Aula
                <select name="aula_id" required>
                    <option value="">Escolha a aula</option>
                    <?php foreach ($aulas as $a): ?>
                        <option value="<?= (int) $a["id"] ?>" <?= (int) $d["aula_id"] === (int) $a["id"] ? "selected" : "" ?>>
                            <?= h($a["regiao"] . " › " . $a["titulo"]) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </label>
        <?php endif; ?>

        <label>Título
            <input type="text" name="titulo" maxlength="150" value="<?= h($d["titulo"]) ?>" required>
        </label>

        <label>Enunciado (o que o aluno deve fazer)
            <textarea name="enunciado" rows="5" required><?= h($d["enunciado"]) ?></textarea>
        </label>

        <label>Código inicial (já aparece no editor)
            <textarea name="codigo_inicial" rows="6" class="codigo"><?= h($d["codigo_inicial"]) ?></textarea>
        </label>

        <label>Código da solução (só para você consultar)
            <textarea name="codigo_solucao" rows="6" class="codigo"><?= h($d["codigo_solucao"]) ?></textarea>
        </label>

        <label>Saída esperada
            <textarea name="saida_esperada" rows="3" class="codigo" required><?= h($d["saida_esperada"]) ?></textarea>
        </label>
        <p class="dica">O texto exato que o programa do aluno deve imprimir. Espaços no fim das linhas são ignorados na correção.</p>

        <label>XP ao acertar pela primeira vez
            <input type="number" name="xp" min="0" max="10000" value="<?= h($d["xp"]) ?>" required>
        </label>

        <label class="check">
            <input type="checkbox" name="ativo" <?= $d["ativo"] ? "checked" : "" ?>>
            Exercício ativo (disponível para os alunos)
        </label>

        <div class="acoes-form">
            <button type="submit" class="btn">Salvar exercício</button>
            <a href="<?= h($base) ?>" class="btn btn-sec">Cancelar</a>
        </div>
    </form>

<?php else: ?>

    <div class="barra">
        <form method="get" class="filtros">
            <label>Aula
                <select name="aula" onchange="this.form.submit()">
                    <option value="0">Todas</option>
                    <?php foreach ($aulas as $a): ?>
                        <option value="<?= (int) $a["id"] ?>" <?= $filtro === (int) $a["id"] ? "selected" : "" ?>>
                            <?= h($a["regiao"] . " › " . $a["titulo"]) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </label>
        </form>

        <a href="<?= h($base . ($filtro ? "&" : "?")) ?>novo=1" class="btn">Novo exercício</a>
    </div>

    <?php if ($exercicios): ?>
    <div class="tabela-wrap">
    <table class="tabela">
        <thead>
            <tr><th>Ordem</th><th>Título</th><th>Aula</th><th>XP</th><th>Status</th><th>Ações</th></tr>
        </thead>
        <tbody>
        <?php foreach ($exercicios as $e): ?>
            <tr>
                <td class="ordem">
                    <?= (int) $e["ordem"] ?>
                    <?php botao_post("mover", (int) $e["id"], "↑", "btn btn-peq btn-sec", ["dir" => "subir"]); ?>
                    <?php botao_post("mover", (int) $e["id"], "↓", "btn btn-peq btn-sec", ["dir" => "descer"]); ?>
                </td>
                <td><?= h($e["titulo"]) ?></td>
                <td><?= h($e["aula"]) ?></td>
                <td><?= (int) $e["xp"] ?></td>
                <td><span class="badge <?= $e["ativo"] ? "ok" : "off" ?>"><?= $e["ativo"] ? "Ativo" : "Inativo" ?></span></td>
                <td class="acoes">
                    <a class="btn btn-peq btn-sec" href="<?= h($base . ($filtro ? "&" : "?")) ?>editar=<?= (int) $e["id"] ?>">Editar</a>
                    <?php botao_post("alternar", (int) $e["id"], $e["ativo"] ? "Desativar" : "Ativar"); ?>
                    <?php botao_post("excluir", (int) $e["id"], "Excluir", "btn btn-peq btn-perigo", [],
                        "Excluir o exercício \"{$e["titulo"]}\"? Só funciona se nenhum aluno tiver progresso nele."); ?>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    </div>
    <?php else: ?>
        <p class="vazio">Nenhum exercício encontrado. Crie o primeiro.</p>
    <?php endif; ?>

<?php endif;

admin_rodape();