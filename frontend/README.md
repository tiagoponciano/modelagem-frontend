# Decision Matrix - Sistema de Apoio à Decisão Multicritério

Sistema web para tomada de decisões utilizando o método AHP (Analytic Hierarchy Process). Permite comparar múltiplas alternativas considerando diversos critérios de forma estruturada e matemática.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Como Funciona o Código](#como-funciona-o-código)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Fluxo de Dados](#fluxo-de-dados)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Instalação e Configuração](#instalação-e-configuração)
- [Como Usar](#como-usar)

## 🎯 Sobre o Projeto

O Decision Matrix é uma aplicação desenvolvida para facilitar processos de decisão complexos onde múltiplos fatores precisam ser considerados. Através do método AHP, o sistema calcula pesos relativos para cada critério e gera um ranking das alternativas avaliadas.

### Funcionalidades Principais

- ✅ Criação e gerenciamento de projetos de análise
- ✅ Definição de alternativas (cidades) e critérios de avaliação
- ✅ Comparação pareada de critérios usando matriz AHP
- ✅ Avaliação detalhada de alternativas por critério
- ✅ Cálculo automático de pesos e ranking final
- ✅ Salvamento automático (auto-save) durante o preenchimento
- ✅ Histórico de análises realizadas
- ✅ Edição de projetos existentes
- ✅ Interface responsiva com suporte a tema claro/escuro

## 🔧 Como Funciona o Código

### 1. Gerenciamento de Estado (Zustand)

O estado global da aplicação é gerenciado através do **Zustand**, localizado em `store/useDecisionStore.ts`.

**O que é armazenado:**
```typescript
interface Project {
  title: string;                    // Título do projeto
  cities: Option[];                 // Lista de alternativas (cidades)
  criteria: Criterion[];            // Lista de critérios
  subCriteria: SubCriterion[];      // Subcritérios (opcional)
  criteriaMatrix: Record<string, number>;  // Matriz de comparação AHP
  evaluationValues: EvaluationValues;       // Valores de avaliação
  criteriaConfig: CriteriaConfig;           // Configuração (BENEFIT/COST)
  criterionFieldValues?: CriterionFieldValues; // Valores de campos específicos
}
```

**Principais funções do store:**
- `setProjectTitle()` - Define o título do projeto
- `addCity()` / `removeCity()` - Gerencia alternativas
- `addCriterion()` / `removeCriterion()` - Gerencia critérios
- `setCriteriaJudgment()` - Armazena comparações AHP
- `setCriterionFieldValue()` - Armazena valores de campos específicos
- `loadProject()` - Carrega um projeto existente
- `resetProject()` - Limpa o estado

**Como usar:**
```typescript
const { project, addCity, setCriteriaJudgment } = useDecisionStore();
```

### 2. Comunicação com Backend (TanStack Query)

O **TanStack Query** gerencia todas as requisições HTTP e cache de dados.

**Hooks disponíveis em `hooks/useProjects.ts`:**

- `useProjects()` - Lista todos os projetos
- `useProject(id)` - Busca um projeto específico
- `useCreateProject()` - Cria novo projeto
- `useUpdateProject()` - Atualiza projeto existente
- `useDeleteProject()` - Remove projeto
- `useSaveDraft()` - Salva rascunho (auto-save)
- `useUpdateDraft()` - Atualiza rascunho

**Exemplo de uso:**
```typescript
const { data: projects, isLoading } = useProjects();
const createProject = useCreateProject();

await createProject.mutateAsync({
  title: "Meu Projeto",
  cities: [...],
  criteria: [...]
});
```

### 3. Cliente HTTP (lib/api.ts)

Todas as chamadas HTTP são centralizadas em `lib/api.ts`, que utiliza a função `fetch` nativa do JavaScript.

**Endpoints disponíveis:**
- `GET /projects` - Lista projetos
- `GET /projects/:id` - Busca projeto
- `POST /projects` - Cria projeto
- `PATCH /projects/:id` - Atualiza projeto
- `POST /projects/draft` - Salva rascunho
- `PATCH /projects/:id/draft` - Atualiza rascunho
- `POST /projects/calculate` - Calcula resultados AHP
- `DELETE /projects/:id` - Remove projeto

**Tratamento de erros:**
O arquivo `api.ts` possui uma classe `ApiError` que padroniza os erros retornados pelo backend.

### 4. Salvamento Automático (Auto-Save)

O sistema possui salvamento automático implementado na página `app/data-entry/page.tsx`.

**Como funciona:**
1. Monitora mudanças nos dados do projeto
2. Aguarda 2 segundos de inatividade (debounce)
3. Compara com a última versão salva
4. Envia apenas se houver mudanças
5. Usa `POST /projects/draft` para novos projetos
6. Usa `PATCH /projects/:id/draft` para projetos existentes

**Implementação:**
```typescript
const autoSave = useCallback(() => {
  const timeout = setTimeout(async () => {
    if (editingProjectId) {
      await updateDraft.mutateAsync({ id, project: data });
    } else {
      await saveDraft.mutateAsync(data);
    }
  }, 2000);
}, [project, editingProjectId]);
```

### 5. Cálculo em Tempo Real

Durante o preenchimento, o sistema calcula resultados AHP em tempo real.

**Fluxo:**
1. Usuário preenche a matriz de comparação
2. Após 500ms de inatividade, dispara cálculo
3. Envia dados para `POST /projects/calculate`
4. Recebe resultados e atualiza a interface
5. Tabelas são preenchidas automaticamente

**Estrutura de resposta do backend:**
```typescript
{
  results: {
    criteriaWeights: { [criterionId]: number },  // Pesos dos critérios
    table: {
      raw: { [cityId]: { [criterionId]: number } },        // Prioridades brutas
      weighted: { [cityId]: { [criterionId]: number } },   // Valores ponderados
      finalScores: { [cityId]: number },                   // Decisão final (decimal)
      finalScoresPercent: { [cityId]: string }             // Decisão final (%)
    }
  }
}
```

### 6. Páginas e Rotas (App Router)

O Next.js 16 utiliza o **App Router**, onde cada pasta em `app/` representa uma rota.

**Estrutura de rotas:**
- `/` - Página inicial (listagem de projetos)
- `/setup` - Definição de título e alternativas
- `/criteria` - Definição de critérios
- `/data-entry?page=0` - Prioridades dos critérios (matriz AHP)
- `/data-entry?page=1` - Primeiro critério
- `/data-entry?page=N` - N-ésimo critério
- `/data-entry?page=final` - Decisão final
- `/evaluation` - Avaliação de alternativas
- `/results/[id]` - Visualização de resultados

**Navegação:**
```typescript
const { navigate } = useNavigation();
navigate("/setup");
navigate(`/data-entry?page=${pageIndex}`);
```

### 7. Tabelas Dinâmicas e Escaláveis

As tabelas são **100% dinâmicas e escaláveis**, funcionando com qualquer número de critérios e alternativas.

**Como funciona:**
```typescript
// Cabeçalho dinâmico
{project.criteria.map((criterion) => {
  const weight = criteriaWeights[criterion.id]; // Busca peso pelo ID
  return <th>{criterion.name}</th>;
})}

// Linhas dinâmicas
{project.cities.map((city) => {
  {project.criteria.map((criterion) => {
    const score = cityScores[criterion.id]; // Busca valor pelo ID
    return <td>{score}</td>;
  })}
})}
```

**Vantagens:**
- ✅ Funciona com 2 ou 20 critérios
- ✅ Funciona com 2 ou 50 alternativas
- ✅ Não há valores hardcoded
- ✅ Tudo é baseado em IDs únicos

### 8. Cálculo da Decisão Final

A decisão final é calculada multiplicando a prioridade do critério pela prioridade da alternativa.

**Fórmula:**
```
Valor Ponderado = Peso do Critério × Prioridade da Alternativa
Decisão Final = Soma de todos os Valores Ponderados
```

**Implementação:**
```typescript
const weightedValue = criterionWeight * cityPriority;
finalDecisionSum += weightedValue;
const percentage = (finalDecisionSum * 100).toFixed(2) + "%";
```

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         │ HTTP Requests
         │
┌────────▼────────┐
│   Backend       │
│   (API REST)    │
└────────┬────────┘
         │
         │ Database
         │
┌────────▼────────┐
│   Database      │
│   (Prisma)      │
└─────────────────┘
```

**Camadas do Frontend:**

1. **UI Layer** (`app/`) - Páginas e componentes React
2. **State Layer** (`store/`) - Gerenciamento de estado global
3. **Data Layer** (`hooks/`) - Hooks para comunicação com API
4. **API Layer** (`lib/api.ts`) - Cliente HTTP
5. **Types Layer** (`types/`) - Definições TypeScript

## 📊 Fluxo de Dados

### Fluxo de Criação de Projeto

```
1. Usuário preenche dados
   ↓
2. Dados são salvos no Zustand Store
   ↓
3. Auto-save dispara após 2s
   ↓
4. POST /projects/draft (rascunho)
   ↓
5. Backend salva no banco
   ↓
6. Frontend recebe ID do projeto
   ↓
7. Próximas atualizações usam PATCH /projects/:id/draft
```

### Fluxo de Cálculo

```
1. Usuário preenche matriz AHP
   ↓
2. useEffect detecta mudanças
   ↓
3. Aguarda 500ms (debounce)
   ↓
4. POST /projects/calculate
   ↓
5. Backend calcula AHP
   ↓
6. Retorna results.table
   ↓
7. Frontend atualiza tabelas
```

### Fluxo de Finalização

```
1. Usuário clica "Atualizar e Calcular"
   ↓
2. PATCH /projects/:id (não /draft)
   ↓
3. Backend recalcula e salva como "Concluído"
   ↓
4. Retorna projeto com results completo
   ↓
5. Frontend navega para /results/:id
```

## 📁 Estrutura de Pastas

```
frontend/
├── app/                          # Rotas e páginas (App Router)
│   ├── page.tsx                 # Página inicial (listagem)
│   ├── setup/                   
│   │   └── page.tsx             # Setup: título e alternativas
│   ├── criteria/
│   │   └── page.tsx             # Definição de critérios
│   ├── data-entry/
│   │   └── page.tsx             # Entrada de dados (AHP + critérios)
│   ├── evaluation/
│   │   └── page.tsx             # Avaliação de alternativas
│   ├── results/
│   │   └── [id]/
│   │       └── page.tsx         # Visualização de resultados
│   ├── layout.tsx               # Layout principal
│   └── providers.tsx            # Providers (Query, Theme)
│
├── components/                   # Componentes reutilizáveis
│   ├── DeleteProjectModal.tsx   # Modal de exclusão
│   └── ThemeToggle.tsx          # Toggle de tema
│
├── hooks/                        # Custom hooks
│   ├── useForm.ts               # Hook para formulários
│   ├── useNavigation.ts         # Hook para navegação
│   └── useProjects.ts           # Hooks de API (TanStack Query)
│
├── lib/                          # Utilitários
│   ├── api.ts                   # Cliente HTTP e funções de API
│   └── constants.ts             # Constantes e endpoints
│
├── store/                        # Estado global (Zustand)
│   └── useDecisionStore.ts      # Store principal
│
└── types/                        # Definições TypeScript
    ├── api.ts                   # Tipos da API
    └── index.ts                 # Tipos gerais
```

## 🛠️ Tecnologias Utilizadas

### Core
- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca de interface
- **TypeScript** - Tipagem estática

### Estado e Dados
- **Zustand** - Gerenciamento de estado global (leve e simples)
- **TanStack Query** - Gerenciamento de dados, cache e sincronização

### Estilização
- **Tailwind CSS** - Framework CSS utility-first
- **next-themes** - Suporte a temas claro/escuro

### Outros
- **ESLint** - Linter para qualidade de código

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18 ou superior
- npm, yarn, pnpm ou bun
- Backend da aplicação rodando

### Passo a Passo

1. **Clone o repositório e navegue até a pasta:**
```bash
cd frontend
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_USER=tpa
NEXT_PUBLIC_PASSWORD=admin
```

4. **Configure a URL do backend:**
Edite `lib/constants.ts` se necessário:
```typescript
export const API_BASE_URL = "https://modelagem-backend.vercel.app";
```

5. **Execute o projeto:**
```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

### Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa o linter

## 📖 Como Usar

### 1. Criar Nova Análise

1. Na página inicial, clique em "Criar Nova Análise"
2. Defina o título da decisão
3. Adicione as alternativas (cidades) a serem comparadas
4. Clique em "Próximo"

### 2. Definir Critérios

1. Adicione os critérios que serão considerados
2. Para cada critério, defina se é BENEFIT (maior é melhor) ou COST (menor é melhor)
3. Clique em "Próximo"

### 3. Comparar Critérios (Matriz AHP)

1. Compare os critérios em pares usando a escala Saaty (1/9 a 9)
2. O sistema calcula automaticamente os pesos
3. Navegue para a próxima página

### 4. Avaliar Alternativas por Critério

1. Para cada critério, avalie as alternativas
2. Preencha os campos específicos de cada critério
3. O sistema salva automaticamente (auto-save)

### 5. Visualizar Decisão Final

1. Na última página, visualize as tabelas:
   - **Tabela Superior**: Prioridades calculadas
   - **Tabela Inferior**: Valores ponderados e decisão final
2. Clique em "Atualizar e Calcular" para finalizar
3. Visualize o ranking final na página de resultados

### 6. Editar Projeto Existente

1. Na página inicial, clique no botão de edição do projeto
2. Faça as alterações necessárias
3. O sistema salva automaticamente
4. Clique em "Atualizar e Calcular" para recalcular

## 🔍 Conceitos Importantes

### Método AHP (Analytic Hierarchy Process)

O AHP é um método de tomada de decisão que:
1. Decompõe o problema em critérios e alternativas
2. Compara critérios em pares (matriz de julgamento)
3. Calcula pesos relativos para cada critério
4. Avalia alternativas em relação a cada critério
5. Combina os pesos e avaliações para gerar um ranking

### Escala Saaty

Usada para comparar critérios em pares:
- **1** - Igual importância
- **3** - Importância moderada
- **5** - Importância forte
- **7** - Importância muito forte
- **9** - Importância extrema
- **1/3, 1/5, 1/7, 1/9** - Valores recíprocos (quando B é mais importante que A)

### Tipos de Critérios

- **BENEFIT**: Quanto maior o valor, melhor (ex: qualidade, segurança)
- **COST**: Quanto menor o valor, melhor (ex: custo, distância)

## 🐛 Troubleshooting

### Problema: Dados não estão sendo salvos

**Solução:**
- Verifique se o backend está rodando
- Verifique a URL do backend em `lib/constants.ts`
- Abra o console do navegador para ver erros

### Problema: Tabelas não estão preenchendo

**Solução:**
- Verifique se a matriz AHP está completa
- Verifique se há pelo menos 2 critérios e 2 alternativas
- Verifique o console para erros de cálculo

### Problema: Auto-save não está funcionando

**Solução:**
- Verifique se há dados mínimos (título, cidades, critérios)
- Verifique o console para erros de rede
- Verifique se o endpoint `/projects/draft` está disponível

## 📝 Notas de Desenvolvimento

### Adicionar Novo Campo ao Projeto

1. Adicione o campo em `store/useDecisionStore.ts` (interface `Project`)
2. Adicione função setter se necessário
3. Atualize `loadProject()` para carregar o campo
4. Atualize `resetProject()` para limpar o campo

### Adicionar Novo Endpoint

1. Adicione em `lib/constants.ts` (API_ENDPOINTS)
2. Adicione função em `lib/api.ts`
3. Crie hook em `hooks/useProjects.ts` se necessário

### Modificar Tabelas

As tabelas são totalmente dinâmicas. Para modificar:
1. Edite `app/data-entry/page.tsx`
2. Use `project.criteria.map()` e `project.cities.map()`
3. Busque valores por ID: `data[criterion.id]` ou `data[city.id]`

## 📄 Licença

Este projeto é de uso acadêmico.

## 👤 Autor

Desenvolvido por **Tiago de Andrade Ponciano**.

---

**Última atualização:** Dezembro 2024
