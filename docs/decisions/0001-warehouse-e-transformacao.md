# ADR 0001 — Warehouse (BigQuery) e transformação (dbt)

- **Status:** Aceito
- **Data:** 2026-08-22

## Contexto

O projeto precisa de um warehouse central e de uma forma única, versionável e
testável de transformar dados. Ter transformações espalhadas (SQL solto,
scripts) prejudica governança, linhagem e qualidade.

## Decisão

- **BigQuery** é o único warehouse e a fonte de verdade dos dados analíticos.
- **dbt** é a única ferramenta de transformação. Nenhum SQL de produção existe
  fora do dbt (models, tests, macros).

## Consequências

- Linhagem e documentação automáticas via dbt.
- Testes de dados como cidadãos de primeira classe.
- Todo SQL passa por revisão de código e versionamento.
- Curva: exige disciplina de manter camadas `staging → intermediate → marts`.

## Alternativas consideradas

- **SQL manual / views no BigQuery**: sem versionamento nem testes integrados.
- **Outro warehouse (Snowflake/Redshift)**: fora do foco GA4/GCP do projeto.
