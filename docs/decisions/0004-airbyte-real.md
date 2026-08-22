# ADR 0004 — Airbyte como conexão real e versionada

- **Status:** Aceito
- **Data:** 2026-08-22

## Contexto

Airbyte normalmente exige uma instância em servidor. O ambiente do repositório é
offline por padrão ([ADR 0003](./0003-ambiente-offline.md)), mas há uma
instância Airbyte disponível para uso real.

## Decisão

A ingestão via Airbyte é tratada como **configuração real e versionada**:

- Source, destination e stream config são definidos como artefatos em
  `ingestion/airbyte/` (YAML/JSON).
- A configuração é completa e válida o suficiente para ser aplicada numa
  instância Airbyte real.

## Consequências

- Demonstra Marketing Data Engineering de verdade, não um mock.
- **Tensão com o ADR 0003:** o destination real é o BigQuery, que o repositório
  não conecta por padrão. Reconciliação: a config é versionada e válida; aplicar
  o destination BigQuery é o passo acionado no ambiente do autor, documentado.
- A configuração fica sob revisão de código como o resto do projeto.

## Alternativas consideradas

- **Somente mock declarativo**: não demonstraria uma conexão Airbyte funcional.
- **Substituir Airbyte por script Node.js**: perderia a competência de ELT com
  ferramenta de mercado.
