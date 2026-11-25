# Arquitetura do Sistema — PIXEL QUEST

## 1. Visão geral

O PIXEL QUEST será uma plataforma educacional gamificada desenvolvida para ensinar lógica de programação de maneira interativa, utilizando aulas, exercícios e missões.

O sistema será organizado em três partes principais: frontend, backend e banco de dados.

## 2. Frontend

Responsável pela parte visual e pela interação com os usuários.

Tecnologias utilizadas:
- HTML: estrutura das páginas.
- CSS: aparência e organização visual.
- JavaScript: interações e funcionalidades das telas.

## 3. Backend

Responsável pelo processamento das informações e pelas regras do sistema.

Tecnologia utilizada:
- PHP: processamento de cadastros, login, exercícios, missões e comunicação com o banco de dados.

## 4. Banco de dados

Será utilizado o MySQL para armazenar e organizar as informações da plataforma.

Entre os dados armazenados estarão:
- Usuários;
- Regiões;
- Aulas;
- Exercícios;
- Missões;
- Progresso dos usuários;
- Conquistas.

## 5. Comunicação entre as partes

O usuário interage com as páginas do frontend. Quando uma informação precisa ser processada ou consultada, o JavaScript pode enviar uma requisição ao backend utilizando a Fetch API.

O PHP processa a solicitação, realiza as operações necessárias no banco de dados MySQL e retorna uma resposta, que pode ser apresentada na interface.

## 6. Fluxo básico do sistema

1. O usuário acessa a plataforma pelo navegador.
2. O frontend apresenta as telas e recebe as interações.
3. O backend PHP processa as solicitações.
4. O banco MySQL armazena ou consulta as informações.
5. O backend retorna os resultados para o frontend.
