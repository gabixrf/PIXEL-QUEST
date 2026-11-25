-- PIXEL QUEST: suporte a questões teóricas e progresso por questão.
-- Execute este arquivo UMA vez no banco pixel-quest pelo phpMyAdmin.
-- CREATE TABLE IF NOT EXISTS preserva questoes/tentativas_questoes caso já existam.

CREATE TABLE IF NOT EXISTS questoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    aula_id INT UNSIGNED NOT NULL,
    enunciado TEXT NOT NULL,
    alternativa_a VARCHAR(500) NOT NULL,
    alternativa_b VARCHAR(500) NOT NULL,
    alternativa_c VARCHAR(500) NOT NULL,
    alternativa_d VARCHAR(500) NOT NULL,
    resposta_correta CHAR(1) NOT NULL,
    explicacao TEXT NOT NULL,
    ordem TINYINT UNSIGNED NOT NULL,
    ativa TINYINT(1) DEFAULT 1,
    UNIQUE KEY uq_questao_ordem (aula_id, ordem),
    CONSTRAINT fk_questoes_aula FOREIGN KEY (aula_id) REFERENCES aulas(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tentativas_questoes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    questao_id INT UNSIGNED NOT NULL,
    alternativa_marcada CHAR(1) NOT NULL,
    correta TINYINT(1) NOT NULL DEFAULT 0,
    respondida_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario_questao (usuario_id, questao_id),
    CONSTRAINT fk_tentativas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tentativas_questao FOREIGN KEY (questao_id) REFERENCES questoes(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS progresso_questoes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    questao_id INT UNSIGNED NOT NULL,
    xp_concedido INT UNSIGNED NOT NULL DEFAULT 0,
    concluido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_progresso_questao (usuario_id, questao_id),
    CONSTRAINT fk_progresso_questao_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_progresso_questao_questao FOREIGN KEY (questao_id) REFERENCES questoes(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
