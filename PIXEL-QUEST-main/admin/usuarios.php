<?php
require_once __DIR__ . "/_base.php";

$meu_id = (int) $_SESSION["usuario_id"];
$q = trim($_GET["q"] ?? "");

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    csrf_validar();

    $acao = $_POST["acao"] ?? "";
    $id = post_int("id");

    try {

        if ($id === $meu_id) {
            throw new InvalidArgumentException("Você não pode alterar a sua própria conta por aqui.");
        }

        if ($acao === "tipo") {

            $conexao->prepare(
                "UPDATE usuarios SET tipo = IF(tipo = 'admin', 'aluno', 'admin') WHERE id = ?"
            )->execute([$id]);
            flash("ok", "Tipo de conta alterado.");

        } elseif ($acao === "excluir") {

            // O progresso e as conquistas do usuário são apagados junto (ON DELETE CASCADE)
            $conexao->prepare("DELETE FROM usuarios WHERE id = ?")->execute([$id]);
            flash("ok", "Usuário excluído.");
        }

    } catch (PDOException $e) {

        error_log($e->getMessage());
        flash("erro", "Erro ao gravar no banco de dados.");

    } catch (InvalidArgumentException $e) {

        flash("erro", $e->getMessage());
    }

    redirecionar("usuarios.php" . ($q !== "" ? "?q=" . urlencode($q) : ""));
}

$sql = "SELECT u.id, u.nome, u.usuario, u.email, u.tipo, u.xp, u.criado_em,
               (SELECT COUNT(*) FROM progresso p WHERE p.usuario_id = u.id AND p.concluido = 1) AS concluidos
        FROM usuarios u"
     . ($q !== "" ? " WHERE u.nome LIKE ? OR u.usuario LIKE ? OR u.email LIKE ?" : "")
     . " ORDER BY u.tipo, u.nome";

$st = $conexao->prepare($sql);
$st->execute($q !== "" ? ["%$q%", "%$q%", "%$q%"] : []);
$usuarios = $st->fetchAll();

admin_topo("Usuários", "usuarios");
?>

<div class="barra">
    <form method="get" class="filtros">
        <label>Buscar
            <input type="search" name="q" value="<?= h($q) ?>" placeholder="Nome, usuário ou e-mail">
        </label>
        <button type="submit" class="btn btn-sec">Buscar</button>
    </form>
</div>

<?php if ($usuarios): ?>
<div class="tabela-wrap">
<table class="tabela">
    <thead>
        <tr><th>Nome</th><th>Usuário</th><th>E-mail</th><th>Tipo</th><th>XP</th><th>Concluídos</th><th>Cadastro</th><th>Ações</th></tr>
    </thead>
    <tbody>
    <?php foreach ($usuarios as $u): ?>
        <tr>
            <td><?= h($u["nome"]) ?></td>
            <td><?= h($u["usuario"]) ?></td>
            <td><?= h($u["email"]) ?></td>
            <td><span class="badge <?= $u["tipo"] === "admin" ? "alerta" : "ok" ?>"><?= $u["tipo"] === "admin" ? "Admin" : "Aluno" ?></span></td>
            <td><?= (int) $u["xp"] ?></td>
            <td><?= (int) $u["concluidos"] ?></td>
            <td><?= h(date("d/m/Y", strtotime($u["criado_em"]))) ?></td>
            <td class="acoes">
                <?php if ((int) $u["id"] === $meu_id): ?>
                    <span class="dica">Você</span>
                <?php else: ?>
                    <?php botao_post("tipo", (int) $u["id"], $u["tipo"] === "admin" ? "Tornar aluno" : "Tornar admin", "btn btn-peq", [],
                        $u["tipo"] === "admin" ? null : "Dar acesso de administrador a {$u["nome"]}?"); ?>
                    <?php botao_post("excluir", (int) $u["id"], "Excluir", "btn btn-peq btn-perigo", [],
                        "Excluir {$u["nome"]}? O progresso e as conquistas dessa conta também serão apagados."); ?>
                <?php endif; ?>
            </td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>
</div>
<?php else: ?>
    <p class="vazio">Nenhum usuário encontrado.</p>
<?php endif; ?>

<?php admin_rodape();