# ADR 0003 — Ambiente offline por padrão

- **Status:** Aceito
- **Data:** 2026-08-22

## Contexto

O projeto é um portfólio conduzido pelo celular e precisa ser reproduzível por
qualquer pessoa (ex.: recrutadores) sem acesso a um projeto GCP, credenciais ou
GA4 real.

## Decisão

O repositório é **offline por padrão**:

- A modelagem dbt roda sobre **seeds** (CSV em `dbt/seeds/`) que imitam o schema
  do export GA4→BigQuery.
- Conexões reais (GA4 export, service account BigQuery) ficam **documentadas**
  como "passo de produção", não executadas no repositório.

## Consequências

- Qualquer pessoa clona e roda a transformação sem credenciais.
- Os seeds precisam representar fielmente o schema real para ter valor.
- Um caminho "produção" documentado mostra que a solução escala além do demo.

## Alternativas consideradas

- **Exigir BigQuery real**: bloqueia reprodução e revisão pelo celular.
- **Somente mocks sem dbt rodando**: perderia a demonstração de Analytics Eng.
