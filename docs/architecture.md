# Arquitetura

> Documento **vivo**. Atualize-o sempre que a arquitetura mudar, no mesmo PR.
> Decisões relevantes são registradas em [`decisions/`](./decisions/).

## Visão de camadas

```
[ Coleta ]        Site exemplo → GTM → GA4              Tracking Engineering
     │            dataLayer padronizado (contract-first)
     ▼
[ Ingestão ]      GA4 → BigQuery (export nativo)         Marketing Data Eng.
     │            Airbyte → BigQuery (fontes extras)
     ▼
[ Transformação ] dbt sobre BigQuery                     Analytics Engineering
     │            staging → intermediate → marts
     ▼
[ Qualidade ]     dbt tests + contratos + QA (Node.js)   Data Quality
     │
     ▼
[ Medição ]       Marts + dicionário de métricas          Measurement
```

## Papel de cada camada

| Camada        | Entrada                | Saída                     | Ferramenta      |
|---------------|------------------------|---------------------------|-----------------|
| Coleta        | Interação do usuário   | Eventos no dataLayer/GA4  | GTM, GA4, JS    |
| Ingestão      | GA4 + fontes externas  | Tabelas cruas no BigQuery | GA4 export, Airbyte |
| Transformação | Tabelas cruas          | Models limpos e de negócio| dbt, SQL        |
| Qualidade     | Eventos e models       | Aprovação/bloqueio        | dbt tests, Node.js |
| Medição       | Marts                  | KPIs documentados         | dbt, Markdown   |

## Fluxo do dado (contract-first)

1. Um evento nasce em `tracking-plan/events.yaml` (o contrato).
2. O contrato dirige a implementação no **GTM/dataLayer**.
3. O **QA (Node.js)** valida eventos capturados contra `tracking-plan/schema.json`.
4. Eventos aprovados chegam ao **BigQuery** (GA4 export / Airbyte).
5. O **dbt** transforma: `staging` (limpeza 1:1) → `intermediate` (lógica) → `marts` (negócio).
6. **Testes dbt** e contratos garantem qualidade antes de cada avanço de camada.
7. **Marts** e o **dicionário de métricas** entregam KPIs confiáveis.

## Princípios arquiteturais fixos

Não podem ser substituídos sem um novo ADR justificando o motivo:

- **BigQuery é a única fonte de verdade** (warehouse central).
- **dbt é a única ferramenta de transformação** — nenhum SQL de produção fora dele.
- **Contract-first**: `tracking-plan/` é a fonte de verdade da coleta.
- **Offline por padrão**: modelagem sobre *seeds*; conexões reais são passos documentados.
- **Sem aplicação web** além de um HTML estático mínimo para demonstrar o GTM.
- **Sem Python**: QA/utilitários em Node.js; transformação em SQL/dbt.
- **Qualidade é gate**: dados que falham em testes não avançam de camada.

## Modo offline vs. produção

| Aspecto        | Offline (padrão do repo)      | Produção (documentada)          |
|----------------|-------------------------------|---------------------------------|
| Fonte de dados | `dbt/seeds/` (CSV de exemplo) | GA4 export + Airbyte no BigQuery|
| Execução dbt   | Compila/roda contra seeds     | Roda contra datasets reais      |
| Credenciais    | Nenhuma necessária            | Service account GCP             |

Ver [ADR 0003](./decisions/0003-ambiente-offline.md) e
[ADR 0004](./decisions/0004-airbyte-real.md).
