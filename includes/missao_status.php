<?php
// includes/missao_status.php
//
// Uma única regra para saber se a missão de uma região está liberada.
// É usada por missao.php (a tela) e por monaco/executar.php (a correção),
// assim o aluno não consegue burlar o bloqueio chamando a correção direto.
//
// Regra (a mesma de regioes.php):
//  - a região só abre se a anterior estiver 100% concluída;
//  - a missão só abre quando todas as atividades (exercícios + questões)
//    das aulas publicadas da região estiverem concluídas.

function status_missao(PDO $conexao, int $uid, int $regiao_id): ?array
{
    $regioes = $conexao->query(
        "SELECT id, nome, descricao, ordem FROM regioes WHERE ativa = 1 ORDER BY ordem"
    )->fetchAll();

    $st = $conexao->prepare(
        "SELECT a.regiao_id,
            ((SELECT COUNT(*) FROM exercicios e WHERE e.aula_id = a.id AND e.ativo = 1) +
             (SELECT COUNT(*) FROM questoes q WHERE q.aula_id = a.id AND q.ativa = 1)) AS total,
            ((SELECT COUNT(*) FROM progresso p INNER JOIN exercicios e ON e.id = p.exercicio_id
               WHERE e.aula_id = a.id AND e.ativo = 1 AND p.usuario_id = ? AND p.concluido = 1) +
             (SELECT COUNT(*) FROM progresso_questoes pq INNER JOIN questoes q ON q.id = pq.questao_id
               WHERE q.aula_id = a.id AND q.ativa = 1 AND pq.usuario_id = ?)) AS feitos
         FROM aulas a WHERE a.publicada = 1"
    );
    $st->execute([$uid, $uid]);

    $totais = [];
    $feitos = [];
    foreach ($st->fetchAll() as $a) {
        $rid = (int) $a["regiao_id"];
        $totais[$rid] = ($totais[$rid] ?? 0) + (int) $a["total"];
        $feitos[$rid] = ($feitos[$rid] ?? 0) + (int) $a["feitos"];
    }

    // Percorre as regiões em ordem, como regioes.php
    $anterior_ok = true;
    $alvo = null;
    $proxima = null;

    foreach ($regioes as $r) {
        $rid = (int) $r["id"];
        $total = $totais[$rid] ?? 0;
        $ok = $feitos[$rid] ?? 0;

        $bloqueada = !$anterior_ok;
        $completa = !$bloqueada && $total > 0 && $ok >= $total;

        if ($rid === $regiao_id) {
            $alvo = [
                "regiao" => $r,
                "regiao_bloqueada" => $bloqueada,
                "total" => $total,
                "feitos" => $ok,
            ];
        } elseif ($alvo !== null && $proxima === null) {
            $proxima = $r;
        }

        $anterior_ok = $completa;
    }

    if ($alvo === null) {
        return null; // região inexistente ou inativa
    }

    // Missão ativa da região (a mais recente, como em regiao.php)
    $st = $conexao->prepare(
        "SELECT * FROM missoes WHERE regiao_id = ? AND ativa = 1 ORDER BY id DESC LIMIT 1"
    );
    $st->execute([$regiao_id]);
    $missao = $st->fetch() ?: null;

    $concluida = false;
    $tentativas = 0;

    if ($missao) {
        $st = $conexao->prepare(
            "SELECT concluido, tentativas FROM progresso WHERE usuario_id = ? AND missao_id = ?"
        );
        $st->execute([$uid, (int) $missao["id"]]);
        $p = $st->fetch();
        if ($p) {
            $concluida = (int) $p["concluido"] === 1;
            $tentativas = (int) $p["tentativas"];
        }
    }

    $alvo["missao"] = $missao;
    $alvo["proxima"] = $proxima;
    $alvo["concluida"] = $concluida;
    $alvo["tentativas"] = $tentativas;
    $alvo["liberada"] = $missao !== null
        && !$alvo["regiao_bloqueada"]
        && $alvo["feitos"] >= $alvo["total"];

    return $alvo;
}
