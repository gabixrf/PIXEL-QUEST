-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 13-Nov-2026 às 18:54
-- Versão do servidor: 10.4.27-MariaDB
-- versão do PHP: 8.1.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `pixel-quest`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `aulas`
--

CREATE TABLE `aulas` (
  `id` int(10) UNSIGNED NOT NULL,
  `regiao_id` int(10) UNSIGNED NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `resumo` text DEFAULT NULL,
  `conteudo` longtext DEFAULT NULL,
  `ordem` tinyint(3) UNSIGNED NOT NULL,
  `publicada` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `aulas`
--

INSERT INTO `aulas` (`id`, `regiao_id`, `titulo`, `resumo`, `conteudo`, `ordem`, `publicada`, `criado_em`) VALUES
(1, 1, 'O que é lógica de programação?', 'Introdução à lógica e à resolução de problemas.', NULL, 1, 1, '2026-11-11 16:17:59'),
(2, 1, 'Algoritmos e sequência', 'Organização de instruções em uma sequência lógica.', NULL, 2, 1, '2026-11-11 16:17:59'),
(3, 2, 'Conhecendo as variáveis', 'Como armazenar e utilizar informações.', NULL, 1, 1, '2026-11-11 16:17:59'),
(4, 2, 'Tipos de dados e operadores', 'Números, textos, valores lógicos e operações.', NULL, 2, 1, '2026-11-11 16:17:59'),
(5, 3, 'Comparações', 'Como comparar valores em um programa.', NULL, 1, 1, '2026-11-11 16:17:59'),
(6, 3, 'Tomando decisões', 'Introdução às estruturas condicionais.', NULL, 2, 1, '2026-11-11 16:17:59'),
(7, 4, 'Repetindo instruções', 'Por que e quando utilizar repetições.', NULL, 1, 1, '2026-11-11 16:17:59'),
(8, 4, 'Laços de repetição', 'Introdução aos principais tipos de loop.', NULL, 2, 1, '2026-11-11 16:17:59');

-- --------------------------------------------------------

--
-- Estrutura da tabela `conquistas`
--

CREATE TABLE `conquistas` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text NOT NULL,
  `icone` varchar(255) DEFAULT NULL,
  `criterio` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `conquistas`
--

INSERT INTO `conquistas` (`id`, `nome`, `descricao`, `icone`, `criterio`) VALUES
(1, 'Primeiro Pergaminho', 'Conclua seu primeiro exercício.', 'primeiro-pergaminho.png', 'primeiro_exercicio'),
(2, 'Mente Lógica', 'Conclua todos os exercícios de uma aula.', 'mente-logica.png', 'aula_completa'),
(3, 'Desbravador', 'Conclua uma missão regional.', 'desbravador.png', 'primeira_missao'),
(4, 'Guardião da Lógica', 'Conclua as quatro regiões.', 'guardiao-logica.png', 'todas_regioes');

-- --------------------------------------------------------

--
-- Estrutura da tabela `exercicios`
--

CREATE TABLE `exercicios` (
  `id` int(10) UNSIGNED NOT NULL,
  `aula_id` int(10) UNSIGNED NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `enunciado` text NOT NULL,
  `codigo_inicial` longtext DEFAULT NULL,
  `codigo_solucao` longtext DEFAULT NULL,
  `saida_esperada` text DEFAULT NULL,
  `ordem` tinyint(3) UNSIGNED NOT NULL,
  `xp` int(10) UNSIGNED DEFAULT 10,
  `ativo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `missoes`
--

CREATE TABLE `missoes` (
  `id` int(10) UNSIGNED NOT NULL,
  `regiao_id` int(10) UNSIGNED NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descricao` text NOT NULL,
  `enunciado` longtext DEFAULT NULL,
  `codigo_inicial` longtext DEFAULT NULL,
  `codigo_solucao` longtext DEFAULT NULL,
  `saida_esperada` text DEFAULT NULL,
  `xp` int(10) UNSIGNED DEFAULT 50,
  `ativa` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `missoes`
--

INSERT INTO `missoes` (`id`, `regiao_id`, `titulo`, `descricao`, `enunciado`, `codigo_inicial`, `codigo_solucao`, `saida_esperada`, `xp`, `ativa`) VALUES
(1, 1, 'O caminho da sequência', 'Organize os passos para restaurar a floresta.', 'Missão a ser configurada.', NULL, NULL, NULL, 50, 1),
(2, 2, 'O segredo das variáveis', 'Use variáveis para recuperar os dados do vale.', 'Missão a ser configurada.', NULL, NULL, NULL, 50, 1),
(3, 3, 'A escolha das montanhas', 'Resolva desafios usando condições.', 'Missão a ser configurada.', NULL, NULL, NULL, 50, 1),
(4, 4, 'O ciclo das cavernas', 'Utilize repetições para concluir o desafio.', 'Missão a ser configurada.', NULL, NULL, NULL, 50, 1);

-- --------------------------------------------------------

--
-- Estrutura da tabela `progresso`
--

CREATE TABLE `progresso` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `exercicio_id` int(10) UNSIGNED DEFAULT NULL,
  `missao_id` int(10) UNSIGNED DEFAULT NULL,
  `regiao_id` int(10) UNSIGNED DEFAULT NULL,
  `concluido` tinyint(1) DEFAULT 0,
  `tentativas` int(10) UNSIGNED DEFAULT 0,
  `xp_concedido` int(10) UNSIGNED DEFAULT 0,
  `concluido_em` datetime DEFAULT NULL,
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Estrutura da tabela `regioes`
--

CREATE TABLE `regioes` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  `ordem` tinyint(3) UNSIGNED NOT NULL,
  `imagem` varchar(255) DEFAULT NULL,
  `ativa` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `regioes`
--

INSERT INTO `regioes` (`id`, `nome`, `descricao`, `ordem`, `imagem`, `ativa`) VALUES
(1, 'Floresta da Sequência', 'Aprenda lógica, algoritmos e organização de passos.', 1, 'region-floresta.png', 1),
(2, 'Vale das Variáveis', 'Conheça variáveis, constantes, tipos de dados e operadores.', 2, 'region-vale.png', 1),
(3, 'Montanhas das Decisões', 'Aprenda comparações e estruturas condicionais.', 3, 'region-montanhas.png', 1),
(4, 'Cavernas da Repetição', 'Explore estruturas de repetição e loops.', 4, 'region-cavernas.png', 1);

-- --------------------------------------------------------

--
-- Estrutura da tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo` enum('aluno','admin') DEFAULT 'aluno',
  `xp` int(10) UNSIGNED DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `usuario`, `senha`, `tipo`, `xp`, `criado_em`) VALUES
(2, 'kess', 'kessily@gmail.com', 'kess', '$2y$10$CF7rM7fbn14L6f4S4zI/n.vbCjJGqYQxSEXrY3OPNaI6ZBBPwl1nS', 'aluno', 0, '2026-11-11 19:32:18');

-- --------------------------------------------------------

--
-- Estrutura da tabela `usuario_conquistas`
--

CREATE TABLE `usuario_conquistas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `conquista_id` int(10) UNSIGNED NOT NULL,
  `desbloqueada_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `aulas`
--
ALTER TABLE `aulas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_aula_ordem_regiao` (`regiao_id`,`ordem`);

--
-- Índices para tabela `conquistas`
--
ALTER TABLE `conquistas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);

--
-- Índices para tabela `exercicios`
--
ALTER TABLE `exercicios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_exercicio_ordem_aula` (`aula_id`,`ordem`);

--
-- Índices para tabela `missoes`
--
ALTER TABLE `missoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_missao_regiao` (`regiao_id`);

--
-- Índices para tabela `progresso`
--
ALTER TABLE `progresso`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_progresso_exercicio` (`usuario_id`,`exercicio_id`),
  ADD UNIQUE KEY `uq_progresso_missao` (`usuario_id`,`missao_id`),
  ADD UNIQUE KEY `uq_progresso_regiao` (`usuario_id`,`regiao_id`),
  ADD KEY `exercicio_id` (`exercicio_id`),
  ADD KEY `missao_id` (`missao_id`),
  ADD KEY `regiao_id` (`regiao_id`);

--
-- Índices para tabela `regioes`
--
ALTER TABLE `regioes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ordem` (`ordem`);

--
-- Índices para tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- Índices para tabela `usuario_conquistas`
--
ALTER TABLE `usuario_conquistas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuario_conquista` (`usuario_id`,`conquista_id`),
  ADD KEY `conquista_id` (`conquista_id`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `aulas`
--
ALTER TABLE `aulas`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `conquistas`
--
ALTER TABLE `conquistas`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `exercicios`
--
ALTER TABLE `exercicios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `missoes`
--
ALTER TABLE `missoes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `progresso`
--
ALTER TABLE `progresso`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `regioes`
--
ALTER TABLE `regioes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `usuario_conquistas`
--
ALTER TABLE `usuario_conquistas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `aulas`
--
ALTER TABLE `aulas`
  ADD CONSTRAINT `aulas_ibfk_1` FOREIGN KEY (`regiao_id`) REFERENCES `regioes` (`id`) ON UPDATE CASCADE;

--
-- Limitadores para a tabela `exercicios`
--
ALTER TABLE `exercicios`
  ADD CONSTRAINT `exercicios_ibfk_1` FOREIGN KEY (`aula_id`) REFERENCES `aulas` (`id`) ON UPDATE CASCADE;

--
-- Limitadores para a tabela `missoes`
--
ALTER TABLE `missoes`
  ADD CONSTRAINT `missoes_ibfk_1` FOREIGN KEY (`regiao_id`) REFERENCES `regioes` (`id`) ON UPDATE CASCADE;

--
-- Limitadores para a tabela `progresso`
--
ALTER TABLE `progresso`
  ADD CONSTRAINT `progresso_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `progresso_ibfk_2` FOREIGN KEY (`exercicio_id`) REFERENCES `exercicios` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `progresso_ibfk_3` FOREIGN KEY (`missao_id`) REFERENCES `missoes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `progresso_ibfk_4` FOREIGN KEY (`regiao_id`) REFERENCES `regioes` (`id`) ON UPDATE CASCADE;

--
-- Limitadores para a tabela `usuario_conquistas`
--
ALTER TABLE `usuario_conquistas`
  ADD CONSTRAINT `usuario_conquistas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `usuario_conquistas_ibfk_2` FOREIGN KEY (`conquista_id`) REFERENCES `conquistas` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
