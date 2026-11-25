# PIXEL QUEST 

O PIXEL QUEST é um projeto desenvolvido como Trabalho de Conclusão de Curso do curso Técnico em Desenvolvimento de Sistemas.

A ideia do projeto é criar uma plataforma para ensinar lógica de programação de uma forma mais interativa, utilizando elementos de jogos para tornar o aprendizado mais interessante.

## Sobre o projeto

Na plataforma, o usuário poderá aprender conceitos de programação por meio de aulas, exercícios e missões. O conteúdo será dividido em quatro regiões, cada uma abordando um conjunto de assuntos.

### Regiões

- **Floresta da Sequência:** introdução à lógica de programação, algoritmos e sequência de instruções.
- **Vale das Variáveis:** variáveis, constantes, tipos de dados e operadores.
- **Montanhas das Decisões:** comparações e estruturas condicionais.
- **Cavernas da Repetição:** estruturas de repetição.

## Funcionalidades

O sistema contará com:

- Cadastro e login de usuários;
- Aulas e exercícios de lógica de programação;
- Missões e desafios;
- Pontuação e níveis;
- Conquistas e medalhas;
- Acompanhamento do progresso;
- Área administrativa para gerenciamento dos conteúdos.

## Tecnologias utilizadas

- HTML
- CSS
- JavaScript
- PHP
- MySQL

## Desenvolvedoras

- Kessily Isabelle Alves Santos
- Gabrielle Vitória Rocha Fernandes

Projeto desenvolvido como Trabalho de Conclusão de Curso do curso Técnico em Desenvolvimento de Sistemas.

---

**PIXEL QUEST — A jornada começa com uma lógica.**


## Preparação do ambiente de conteúdo

1. Importe o banco original `DADOS-SQL/pixel-quest (1).sql` apenas se ainda não tiver o banco criado.
2. Faça backup do banco atual e execute `DADOS-SQL/atualizacao-questoes-progresso.sql` no banco `pixel-quest`. O arquivo usa `CREATE TABLE IF NOT EXISTS` para preservar as tabelas de questões que já existirem e acrescenta o controle de conclusão das questões.
3. No admin, cadastre uma aula como rascunho, depois adicione questões em **Questões** e desafios Python em **Exercícios**. Publique somente quando o conteúdo e as atividades estiverem revisados.
4. Questões corretas concedem 5 XP uma única vez por aluno; exercícios concedem o XP configurado no cadastro, também uma única vez.

A página de aula aceita conteúdo teórico, questões de múltipla escolha e exercícios Python na mesma aula. O progresso das regiões considera as questões e os exercícios ativos.
