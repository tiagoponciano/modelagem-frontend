# Decision Matrix - Sistema de Apoio à Decisão Multicritério

Sistema web para tomada de decisões utilizando o método AHP (Analytic Hierarchy Process). Permite comparar múltiplas alternativas considerando diversos critérios de forma estruturada e matemática.

## Sobre o Projeto

O Decision Matrix é uma aplicação desenvolvida para facilitar processos de decisão complexos onde múltiplos fatores precisam ser considerados. Através do método AHP, o sistema calcula pesos relativos para cada critério e gera um ranking das alternativas avaliadas.

### Funcionalidades

- Criação e gerenciamento de projetos de análise
- Definição de alternativas e critérios de avaliação
- Comparação pareada de critérios (matriz de julgamento AHP)
- Avaliação de alternativas por critério
- Cálculo automático de pesos e ranking final
- Histórico de análises realizadas
- Edição de projetos existentes
- Interface responsiva com suporte a tema claro/escuro

## Tecnologias

- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Zustand** - Gerenciamento de estado
- **TanStack Query** - Gerenciamento de dados e cache
- **next-themes** - Suporte a temas

## Pré-requisitos

- Node.js 18+ 
- npm, yarn, pnpm ou bun
- Backend da aplicação rodando (consulte a documentação do backend)

## Instalação

1. Clone o repositório e navegue até a pasta do frontend:

```bash
cd frontend
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto:

```env
NEXT_PUBLIC_USER=tpa
NEXT_PUBLIC_PASSWORD=admin
```

Essas credenciais são utilizadas para autenticação na exclusão de projetos.

4. Verifique se o backend está configurado e rodando. Por padrão, o frontend espera o backend em `http://localhost:3001`. Para alterar, edite o arquivo `lib/constants.ts`.

## Executando o Projeto

### Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

### Produção

```bash
npm run build
npm start
```

## Estrutura do Projeto

```
frontend/
├── app/                    # Rotas e páginas (App Router)
│   ├── page.tsx           # Página inicial (listagem de projetos)
│   ├── setup/              # Definição de título e alternativas
│   ├── criteria/           # Definição de critérios
│   ├── matrix/             # Comparação pareada de critérios
│   ├── evaluation/         # Avaliação de alternativas
│   └── results/[id]/       # Visualização de resultados
├── components/             # Componentes reutilizáveis
│   ├── DeleteProjectModal.tsx
│   └── ThemeToggle.tsx
├── hooks/                  # Custom hooks
│   ├── useForm.ts
│   ├── useNavigation.ts
│   └── useProjects.ts
├── lib/                    # Utilitários e configurações
│   ├── api.ts             # Cliente HTTP e funções de API
│   └── constants.ts       # Constantes e endpoints
├── store/                  # Estado global (Zustand)
│   └── useDecisionStore.ts
└── types/                  # Definições TypeScript
    ├── api.ts
    └── index.ts
```

## Fluxo de Uso

1. **Início**: Na página principal, visualize projetos existentes ou crie uma nova análise
2. **Setup**: Defina o título da decisão e adicione as alternativas a serem comparadas
3. **Critérios**: Adicione os critérios que serão considerados na avaliação
4. **Matriz**: Compare os critérios em pares, indicando a importância relativa entre eles
5. **Avaliação**: Para cada alternativa, atribua valores numéricos em cada critério e defina se o critério é de benefício (maior é melhor) ou custo (menor é melhor)
6. **Resultados**: Visualize o ranking final calculado pelo método AHP

## Edição de Projetos

Projetos existentes podem ser editados através do botão de edição na página principal. Ao editar, você pode:

- Modificar o título
- Adicionar ou remover alternativas
- Adicionar ou remover critérios
- Atualizar comparações e avaliações

As alterações são salvas e os resultados são recalculados automaticamente.

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a build de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## Configuração do Backend

O frontend espera que o backend esteja rodando e expondo os seguintes endpoints:

- `GET /projects` - Lista todos os projetos
- `GET /projects/:id` - Obtém um projeto específico
- `POST /projects` - Cria um novo projeto
- `PATCH /projects/:id` - Atualiza um projeto existente
- `DELETE /projects/:id` - Remove um projeto (requer autenticação)

Consulte a documentação do backend para mais detalhes sobre a API.

## Contribuindo

Este é um projeto acadêmico desenvolvido para a disciplina de Modelagem. Para sugestões ou melhorias, entre em contato com a equipe de desenvolvimento.

## Licença

Este projeto é de uso acadêmico.

Desenvolvido por Tiago de Andrade Ponciano.
