# ADR 0002 — Tracking contract-first

- **Status:** Aceito
- **Data:** 2026-08-22

## Contexto

Falhas de tracking costumam vir de eventos implementados sem especificação, com
nomes inconsistentes ou parâmetros ausentes. Sem uma fonte de verdade, GTM, QA
e modelagem divergem.

## Decisão

Adotar **contract-first**: o diretório `tracking-plan/` é a fonte de verdade da
coleta.

- `events.yaml` define eventos, parâmetros, tipos e obrigatoriedade.
- `schema.json` (JSON Schema) deriva do contrato e serve à validação.
- Nenhum evento entra em produção sem estar no contrato **e** passar no QA.

## Consequências

- GTM, QA (Node.js) e staging do dbt referenciam o mesmo contrato.
- Mudança de evento começa pelo contrato, com revisão via git.
- Reduz PII e inconsistência de nomes por design.

## Alternativas consideradas

- **Implementar direto no GTM**: sem especificação versionada nem validação.
- **Planilha externa**: fora do git, sem CI, difícil de revisar no celular.
