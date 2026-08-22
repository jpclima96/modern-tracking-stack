# CLAUDE.md — Manual de Operação do Repositório

> Este arquivo é o **manual permanente** do projeto **Modern Tracking Stack**.
> Ele governa como o trabalho é feito neste repositório. Toda alteração deve
> respeitar as regras aqui descritas. Quando uma regra mudar, atualize este
> arquivo **no mesmo PR** e registre o motivo em `docs/decisions/`.

---

## 1. Objetivo do projeto

Construir um **portfólio de engenharia de tracking e analytics** que demonstre,
de ponta a ponta, como dados de comportamento digital são coletados,
ingeridos, transformados e validados até virarem métricas confiáveis.

O projeto é **inspirado em produção**, mas **demonstrável offline**: qualquer
pessoa consegue clonar e entender a arquitetura sem precisar de credenciais.

Competências que o projeto deve evidenciar:

- Tracking Engineering
- Digital Analytics
- Martech Architecture
- Analytics Engineering
- Data Quality
- Measurement
- Marketing Data Engineering

## 2. Cenário de negócio

Empresa digital fictícia (e-commerce/SaaS) que precisa medir a jornada do
usuário — da visita ao evento de conversão — com **dados confiáveis e
governados**. O time de dados precisa de:

- Um **plano de medição** claro (o que é medido e por quê).
- Coleta **padronizada e versionada** via GTM/GA4.
- Ingestão dos dados no warehouse (BigQuery) com fontes complementares.
- Modelagem analítica confiável (dbt) e um **dicionário de métricas**.
- **Qualidade de dados** garantida por testes e contratos.

## 3. Arquitetura

```
[ Coleta ]        Site exemplo → GTM → GA4          (Tracking Engineering)
     │            dataLayer padronizado
     ▼
[ Ingestão ]      GA4 → BigQuery (export nativo)    (Marketing Data Eng.)
     │            Airbyte → BigQuery (fontes extras)
     ▼
[ Transformação ] dbt sobre BigQuery                (Analytics Engineering)
     │            staging → intermediate → marts
     ▼
[ Qualidade ]     dbt tests + contratos + QA Node.js (Data Quality)
     │
     ▼
[ Medição ]       Marts + dicionário de métricas     (Measurement / Analytics)
```

Princípios arquiteturais fixos (não alterar sem ADR em `docs/decisions/`):

- **BigQuery é a única fonte de verdade** (warehouse central).
- **dbt é a única ferramenta de transformação** — nenhum SQL de produção fora do dbt.
- **Contract-first no tracking**: `tracking-plan/` é a fonte de verdade da coleta.
- **Offline por padrão**: modelagem sobre *seeds*; conexões reais são passos documentados.
- **Sem aplicação web** — no máximo um HTML estático para demonstrar o GTM.
- **Sem Python** — QA/utilitários em Node.js; transformação em SQL/dbt.

## 4. Tecnologias escolhidas

| Camada          | Tecnologia            | Papel                                    |
|-----------------|-----------------------|------------------------------------------|
| Coleta          | GTM, GA4, JavaScript  | Tags, dataLayer, eventos                 |
| Contrato        | YAML, JSON Schema     | Plano de tracking versionado             |
| Ingestão        | Airbyte, GA4 export   | Trazer dados ao BigQuery                 |
| Warehouse       | BigQuery, SQL         | Armazenamento e consulta                 |
| Transformação   | dbt                   | Staging → intermediate → marts           |
| QA              | Node.js               | Validação de eventos contra o schema     |
| Documentação    | Markdown              | Docs, ADRs, dicionário de métricas       |

**Evitar:** Python; frameworks web; qualquer ferramenta fora desta lista sem ADR.

## 5. Estrutura do repositório

```
modern-tracking-stack/
├── CLAUDE.md                 # este manual
├── README.md                 # visão geral + índice de fases
├── docs/
│   ├── architecture.md       # arquitetura viva
│   ├── decisions/            # ADRs (Architecture Decision Records)
│   └── metrics/              # dicionário de métricas / KPIs
├── tracking-plan/            # CONTRATO de coleta (fonte de verdade)
│   ├── events.yaml           # eventos, params, tipos, obrigatoriedade
│   └── schema.json           # JSON Schema para validação
├── gtm/                      # config exportada do GTM + notas
├── ingestion/
│   └── airbyte/              # definição de fontes/conexões (YAML/JSON)
├── dbt/                      # projeto dbt (BigQuery)
│   ├── models/{staging,intermediate,marts}/
│   ├── seeds/                # dados de exemplo (modo offline)
│   ├── tests/
│   └── dbt_project.yml
├── qa/                       # QA em Node.js
└── .github/workflows/        # CI: lint, QA, dbt build
```

## 6. Princípios de tracking

- **Contract-first**: nenhum evento existe sem estar em `tracking-plan/events.yaml`.
- **Nomes de eventos** em `snake_case`, orientados a ação (`add_to_cart`, `sign_up`).
- **Parâmetros** tipados e documentados; marcar obrigatórios vs. opcionais.
- **dataLayer é o único mecanismo** de comunicação site → GTM.
- Um evento só entra em produção após passar no **QA** contra o schema.
- **Sem PII** no tracking (sem e-mail, nome, telefone em claro).

## 7. Princípios de governança de dados

- **Fonte de verdade única** por domínio; nada de lógica duplicada.
- **Versionamento** de todo contrato e schema (git é o histórico).
- **Rastreabilidade**: cada métrica final referencia sua origem via linhagem dbt.
- **Qualidade como gate**: dados que falham em testes não avançam de camada.
- **Decisões arquiteturais** registradas como ADR; nunca substituir uma decisão
  existente sem explicar o motivo em `docs/decisions/`.
- **Privacidade por padrão**: minimização de dados, sem PII desnecessária.

## 8. Convenções de SQL

- SQL só existe **dentro do dbt** (models/tests/macros). Nada solto.
- Palavras-chave em **minúsculas**; um campo por linha em `SELECT`.
- **CTEs** com nomes descritivos; evitar subqueries aninhadas.
- Sem `SELECT *` em models finais; colunas explícitas.
- Referências sempre via `{{ ref() }}` e `{{ source() }}` — nunca tabela crua.
- Comentar apenas o "porquê" não óbvio, não o "o quê".

## 9. Convenções de dbt

- Camadas: `staging` (limpeza 1:1 com a fonte) → `intermediate` (lógica
  reutilizável) → `marts` (modelos de negócio prontos para consumo).
- **staging**: prefixo `stg_`, materializado como `view`.
- **intermediate**: prefixo `int_`, materializado conforme necessidade.
- **marts**: nome de negócio (`fct_`, `dim_`), materializado como `table`.
- Todo model tem um `.yml` com `description` e ao menos um teste.
- `sources` declaradas em `_sources.yml` por domínio.
- Modo offline: `seeds/` alimentam os models; conexão real fica documentada.

## 10. Convenções de nomenclatura

| Item                | Convenção                | Exemplo                     |
|---------------------|--------------------------|-----------------------------|
| Eventos de tracking | `snake_case`, ação       | `add_to_cart`               |
| Model staging       | `stg_<fonte>__<entidade>`| `stg_ga4__events`           |
| Model intermediate  | `int_<descrição>`        | `int_sessions_enriched`     |
| Fato                | `fct_<processo>`         | `fct_orders`                |
| Dimensão            | `dim_<entidade>`         | `dim_users`                 |
| Colunas             | `snake_case`             | `event_timestamp`           |
| Arquivos ADR        | `NNNN-titulo-kebab.md`   | `0001-warehouse.md`         |
| Branches            | conforme instrução da tarefa | `claude/...`            |

## 11. Requisitos de documentação

- **README.md** sempre reflete o estado atual e o índice de fases.
- **docs/architecture.md** é atualizado quando a arquitetura muda.
- Toda decisão arquitetural relevante vira um **ADR** em `docs/decisions/`.
- Toda métrica de negócio é definida em **docs/metrics/**.
- Documentação é atualizada **no mesmo PR** da mudança de código.
- Nenhuma fase é considerada concluída sem docs correspondentes.

## 12. Requisitos de testes

- **Tracking**: eventos validados por QA (Node.js) contra `schema.json`.
- **dbt**: todo model tem testes (`not_null`, `unique`, `relationships`,
  `accepted_values` conforme aplicável) + testes customizados quando preciso.
- **YAML/JSON**: validados por lint no CI.
- Um teste que falha **bloqueia** o avanço — nunca desabilitar teste para passar.
- Testes rodam localmente e no CI antes do merge.

## 13. Definition of Done

Uma fase/PR só está "pronta" quando **todos** os itens abaixo são verdadeiros:

- [ ] Código/config implementado e pequeno o suficiente para revisão fácil.
- [ ] Testes escritos e passando (QA / dbt / lint conforme a fase).
- [ ] Auto-auditoria realizada e registrada na descrição do PR.
- [ ] Documentação atualizada (README + docs relevantes) no mesmo PR.
- [ ] Nenhuma decisão arquitetural substituída sem ADR justificando.
- [ ] Sem PII, sem Python, sem web app não justificada.
- [ ] Conteúdo de portfólio criado/atualizado quando a fase agrega narrativa.
- [ ] **Edição da newsletter do LinkedIn criada em `content/newsletter/`** para a
      fase (ver seção 16). Nenhuma fase é concluída sem o artigo correspondente.

## 14. Regras específicas para trabalhar pelo celular

O trabalho é conduzido **inteiramente pelo celular via Claude Code**. Portanto:

- **Claude cria e edita os arquivos diretamente** — minimizar edição manual.
- **Mudanças pequenas** e fáceis de revisar numa tela pequena.
- **Uma fase por vez** — nunca implementar múltiplas fases de uma só vez.
- **Antes de uma fase importante, apresentar um plano** e aguardar aprovação.
- **Após implementar, auditar o próprio trabalho** antes de encerrar.
- Preferir **soluções simples** a complexidade desnecessária.
- Não implementar nada sem relação clara com o objetivo do projeto.
- Diffs objetivos; mensagens de commit claras e curtas.

## 15. Fluxo obrigatório de todas as fases

Toda fase segue **estritamente** esta sequência:

```
PLANEJAR   → apresentar plano da fase e aguardar aprovação
IMPLEMENTAR→ criar/editar arquivos, mudanças pequenas
TESTAR     → rodar QA / dbt / lint conforme a fase
AUDITAR    → auto-revisão contra a Definition of Done
DOCUMENTAR → atualizar README, docs, ADRs, dicionário
CRIAR CONTEÚDO → escrever a edição da newsletter do LinkedIn da fase (seção 16)
```

Nenhuma etapa é pulada. Se uma etapa não se aplica, isso é dito explicitamente
na descrição do PR, com justificativa. A etapa **CRIAR CONTEÚDO** só se dá por
cumprida com a edição da newsletter escrita em `content/newsletter/`.

## 16. Newsletter do LinkedIn

Toda fase do projeto deve gerar **obrigatoriamente** uma edição da newsletter do
LinkedIn. Nenhuma fase pode ser considerada concluída sem que exista um artigo
correspondente em:

```
content/newsletter/
```

A newsletter documenta a construção do projeto "Modern Tracking Stack" fase por
fase.

### Objetivo editorial

A newsletter deve transformar cada etapa técnica do projeto em um conteúdo
educacional aprofundado sobre: Tracking Engineering, Digital Analytics, Martech,
Measurement, Analytics Engineering, Marketing Data Engineering e Data Quality.

O conteúdo **não** deve ser apenas um resumo do que foi implementado. Cada edição
deve:

1. Apresentar um problema real de Tracking/Martech.
2. Explicar por que esse problema importa.
3. Apresentar os conceitos técnicos necessários.
4. Mostrar como o problema foi abordado no projeto.
5. Explicar as decisões arquiteturais tomadas.
6. Mostrar exemplos concretos do repositório.
7. Discutir trade-offs e alternativas.
8. Apresentar os principais aprendizados da fase.

### Fonte de verdade

A newsletter é escrita **somente depois** da implementação da fase. Fontes
primárias: código criado, documentação, arquitetura, testes executados, decisões
tomadas, problemas encontrados e trade-offs identificados.

**Nunca inventar:** resultados, métricas, incidentes, ganhos de performance,
problemas ou aprendizados. Se uma afirmação não puder ser sustentada pelo
projeto, ela não é apresentada como algo observado.

### Idioma

Todo o conteúdo é escrito em **português**. Termos técnicos consolidados podem
permanecer em inglês quando isso melhorar a clareza — por exemplo: Data Layer,
Tracking Plan, Measurement Plan, Data Quality, staging, marts, server-side,
Analytics Engineering.

### Estilo

Técnica mas acessível, didática, aprofundada, prática, profissional, opinativa
quando houver argumentos técnicos, e baseada no projeto.

Evitar: linguagem genérica de IA, excesso de emojis, clickbait, frases
motivacionais, listas superficiais, afirmações exageradas e transformar
hipóteses em fatos.

### Estrutura recomendada

```
# Título
Abertura apresentando o problema.

## O problema
Explique o problema de negócio ou técnico.

## O conceito
Explique os conceitos necessários para entender a solução.

## Como implementei no Modern Tracking Stack
Use exemplos reais do projeto.

## Arquitetura
Apresente a arquitetura ou fluxo relevante.

## Decisões e trade-offs
Explique por que determinadas decisões foram tomadas e quais alternativas existiam.

## O que aprendi
Apresente os principais aprendizados da implementação.

## Conclusão
Conecte o aprendizado ao contexto mais amplo de Tracking e Martech.

## Próxima parte
Apresente brevemente o tema da próxima edição.
```

### Elementos adicionais

Ao final do arquivo, incluir:

- descrição curta da edição para publicação no LinkedIn;
- sugestão de imagem de capa;
- sugestão de diagrama técnico;
- 3 títulos alternativos.

### Série

Todas as edições fazem parte da série **"Building a Modern Tracking Stack"**.
Cada edição indica sua posição na série. Exemplos:

```
Building a Modern Tracking Stack #01
Tracking não deveria começar no GTM

Building a Modern Tracking Stack #02
Seu Tracking Plan deveria ser um contrato de dados

Building a Modern Tracking Stack #03
Sua Data Layer deveria ser tratada como uma API
```

### Convenção de arquivo

Um arquivo Markdown por edição, nomeado por número da série e slug:
`content/newsletter/NN-slug.md` (ex.: `01-tracking-nao-comeca-no-gtm.md`).

---

_Este é o manual da fundação. A stack é implementada fase a fase, seguindo o
fluxo acima, com uma edição da newsletter por fase._
