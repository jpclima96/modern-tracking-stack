# Modern Tracking Stack

Um portfólio **inspirado em produção** que demonstra, de ponta a ponta, como
dados de comportamento digital são **coletados, ingeridos, transformados e
validados** até virarem métricas confiáveis.

O projeto é **demonstrável offline**: clone, leia e entenda a arquitetura sem
precisar de credenciais de nuvem.

> Manual de operação do repositório: [`CLAUDE.md`](./CLAUDE.md)

## Competências demonstradas

Tracking Engineering · Digital Analytics · Martech Architecture ·
Analytics Engineering · Data Quality · Measurement · Marketing Data Engineering

## Arquitetura (resumo)

```
Coleta → Ingestão → Transformação → Qualidade → Medição
 GTM/GA4   Airbyte/     dbt sobre      dbt tests   Marts +
 dataLayer BigQuery     BigQuery       + QA        métricas
```

Detalhes em [`docs/architecture.md`](./docs/architecture.md).

## Stack

SQL · BigQuery · dbt · GA4 · Google Tag Manager · Airbyte · JavaScript (tracking)
· Node.js (QA) · Markdown · YAML · JSON. **Sem Python. Sem web app.**

## Fases do projeto

| Fase | Nome | Foco | Status |
|------|------|------|--------|
| 0 | Fundação & Docs | Martech Architecture | ✅ concluída |
| 1 | Tracking Plan (contrato) | Measurement | ✅ concluída |
| 2 | GTM + dataLayer | Tracking Engineering | ⬜ planejada |
| 3 | QA de eventos (Node.js) | Data Quality | ⬜ planejada |
| 4 | Ingestão (Airbyte + GA4→BQ) | Marketing Data Engineering | ⬜ planejada |
| 5 | dbt: staging | Analytics Engineering | ⬜ planejada |
| 6 | dbt: marts + métricas | Analytics Eng. / Measurement | ⬜ planejada |
| 7 | Data Quality avançada | Data Quality | ⬜ planejada |
| 8 | CI/CD | Martech Architecture | ⬜ planejada |

Cada fase segue o fluxo obrigatório:
**PLANEJAR → IMPLEMENTAR → TESTAR → AUDITAR → DOCUMENTAR → CRIAR CONTEÚDO.**

## Estrutura do repositório

```
├── CLAUDE.md              # manual de operação
├── README.md             # este arquivo
├── docs/                 # arquitetura, ADRs, dicionário de métricas
├── tracking-plan/        # contrato de coleta (fonte de verdade)
├── gtm/                  # config do Google Tag Manager
├── ingestion/airbyte/    # fontes e conexões de ingestão
├── dbt/                  # projeto dbt (staging → intermediate → marts)
├── qa/                   # validação de eventos em Node.js
└── .github/workflows/    # CI
```

## Decisões arquiteturais

Registradas como ADRs em [`docs/decisions/`](./docs/decisions/). As principais:

- **BigQuery** como único warehouse; **dbt** como única ferramenta de transformação.
- **Contract-first**: `tracking-plan/` é a fonte de verdade da coleta.
- **Offline por padrão**: modelagem sobre *seeds*; conexões reais documentadas.
- **Airbyte** definido como conexão real e versionada.
