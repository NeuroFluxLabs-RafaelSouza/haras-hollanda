Haras Hollanda

Sistema web de gestão para haras, desenvolvido para centralizar a operação diária em uma única aplicação: cadastro de cavalos e clientes, controle de baias, alimentação, agenda, estoque e acompanhamento financeiro.

O projeto foi construído como uma aplicação real de gestão, com foco em reduzir retrabalho administrativo, evitar cadastros duplicados e tornar as rotinas do haras mais simples para quem opera o sistema no dia a dia.

Visão geral

O Haras Hollanda organiza informações que normalmente ficam espalhadas entre planilhas, anotações e controles separados.

A aplicação reúne em um único fluxo:

gestão de cavalos;

cadastro de clientes e responsáveis;

controle de baias;

planos e confirmações de alimentação;

agenda de atendimentos e profissionais;

estoque, compras e movimentações;

financeiro, cobranças e transações;

operações comerciais relacionadas aos animais;

configurações administrativas do haras.

A interface foi desenvolvida para desktop, tablet e celular, mantendo a navegação e os principais cards acessíveis também em telas menores.

Funcionalidades

Cavalos

Cadastro de cavalos com informações de identificação e manejo.

Vínculo do animal com cliente ou com o próprio haras.

Controle de baia e mensalidade.

Registro de linhagem.

Plano individual de alimentação.

Acompanhamento da alimentação diária.

Fluxos comerciais de compra e venda.

Clientes

Cadastro de clientes.

Associação entre clientes e cavalos.

Reutilização dos dados já cadastrados para reduzir preenchimentos repetidos.

Baias

Cadastro e gerenciamento de baias.

Associação de animais às baias.

Controle da estrutura disponível para operação.

Alimentação

Definição de planos de alimentação por animal.

Registro das refeições planejadas.

Confirmação das alimentações realizadas no dia.

Agenda

Cadastro de compromissos.

Gestão de profissionais.

Associação de atendimentos a cavalos e clientes.

Integração do fluxo da agenda com informações financeiras quando aplicável.

Estoque

Cadastro de produtos e insumos.

Registro de compras.

Entradas e saídas de estoque.

Histórico de movimentações.

Acompanhamento de itens com baixo estoque.

Financeiro

Controle de cobranças.

Registro de receitas e despesas.

Histórico de transações.

Acompanhamento de valores recebidos, pendentes e a pagar.

Stack

Front-end

React 19

TypeScript

Vite

React Router

Lucide React

CSS responsivo

Back-end e dados

Supabase

PostgreSQL

Supabase Authentication

Row Level Security (RLS)

Supabase JavaScript Client

Infraestrutura

Docker

Nginx

AWS S3

AWS CloudFront

Arquitetura

A aplicação utiliza uma arquitetura de front-end React conectada ao Supabase para autenticação e persistência de dados.

Usuário
   |
   v
React + TypeScript
   |
   v
Supabase Client
   |
   +--> Authentication
   |
   +--> PostgreSQL

Na homologação, o front-end é compilado pelo Vite e distribuído de forma estática utilizando Amazon S3 e CloudFront.

Código fonte
   |
   v
Vite build
   |
   v
dist/
   |
   v
Amazon S3
   |
   v
Amazon CloudFront

O projeto também possui uma imagem Docker multi-stage com Node.js para build e Nginx para servir os arquivos estáticos.

Integração com Supabase

O cliente Supabase é inicializado através de variáveis de ambiente:

VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

Nenhuma chave service_role deve ser utilizada no front-end.

Entre as entidades atualmente utilizadas pelo sistema estão:

app_settings
appointments
clients
feeding_confirmations
feeding_plan_meals
feeding_plans
financial_charges
financial_transactions
horse_lineages
horse_trades
horses
inventory_items
inventory_movements
professionals
stalls

Executando localmente

Pré-requisitos

Node.js 22+

npm

projeto Supabase configurado

Clone o repositório:

git clone https://github.com/NeuroFluxLabs-RafaelSouza/haras-hollanda.git
cd haras-hollanda

Instale as dependências:

npm install

Crie um arquivo .env.local:

VITE_SUPABASE_URL=seu_projeto_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_publishable_key

Inicie o ambiente de desenvolvimento:

npm run dev

Por padrão, o Vite disponibiliza a aplicação localmente em:

http://localhost:5173

Build de produção

npm run build

O build executa a validação TypeScript e gera os arquivos de produção em:

dist/

Para visualizar o build localmente:

npm run preview

Docker

O projeto possui build multi-stage.

Para gerar a imagem:

docker build \
  --build-arg PUBLIC_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg PUBLIC_SUPABASE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
  -t haras-hollanda .

Para executar:

docker run --rm -p 8081:8080 haras-hollanda

A aplicação ficará disponível em:

http://localhost:8081

Deploy de homologação

A versão de homologação está publicada utilizando AWS S3 + CloudFront:

https://dclbd1hp5zqg4.cloudfront.net

A aplicação é protegida por autenticação. Não existem credenciais públicas de acesso no repositório.

Qualidade e validação

Os comandos disponíveis atualmente são:

npm run dev
npm run build
npm run lint
npm run preview

O comando de build executa:

TypeScript compiler -> Vite build

Testes automatizados ainda não foram adicionados ao projeto. A inclusão de testes unitários e de integração faz parte das próximas evoluções técnicas.

Estrutura do projeto

src/
├── components/
│   └── layout/
├── features/
│   ├── agenda/
│   ├── auth/
│   ├── clients/
│   ├── dashboard/
│   ├── feeding/
│   ├── finance/
│   ├── horses/
│   ├── inventory/
│   ├── settings/
│   └── stalls/
├── lib/
│   └── supabase.ts
├── styles/
├── App.tsx
└── main.tsx

A organização por features mantém as regras e interfaces de cada área do sistema agrupadas por domínio.

Decisões de produto

O sistema foi desenvolvido com alguns princípios práticos:

cadastrar uma informação uma única vez e reutilizá-la;

evitar digitação repetitiva de dados já existentes;

automatizar preenchimentos quando existe informação suficiente;

reduzir a quantidade de cliques necessários para tarefas recorrentes;

manter as regras de negócio fora dos componentes visuais sempre que possível;

oferecer experiência consistente entre desktop, tablet e celular.

Status

O sistema está em fase de homologação com usuário real.

As principais áreas operacionais já estão implementadas e o ambiente de homologação está disponível para testes.

Próximas evoluções técnicas planejadas:

testes automatizados;

ampliação da cobertura de validações;

revisão contínua de segurança e políticas RLS;

automação do processo de deploy;

evolução da experiência de uso a partir do feedback da homologação.

Autor

Desenvolvido por Rafael de Souza Almeida.

Projeto criado como uma solução real de gestão para o Haras Hollanda, envolvendo desenvolvimento front-end, integração com banco de dados, autenticação, regras de negócio, responsividade, Docker e infraestrutura de deploy.