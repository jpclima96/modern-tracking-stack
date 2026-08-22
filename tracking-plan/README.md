# Tracking Plan — Contrato de coleta

Este diretório é a **fonte de verdade da coleta** (ver
[ADR 0002](../docs/decisions/0002-tracking-contract-first.md)). Nenhum evento
existe no projeto sem estar declarado aqui.

## Arquivos

| Arquivo | Papel | Editar? |
|---------|-------|---------|
| `events.yaml` | Contrato: eventos, parâmetros, tipos, obrigatoriedade | **Sim** — fonte de verdade |
| `schema.json` | JSON Schema derivado, usado para validar eventos | **Não** — é gerado |

## Como funciona

`schema.json` é **gerado** a partir de `events.yaml` pelo script Node.js em
`qa/generate-schema.js`. O YAML é a única fonte de verdade; o schema é um
artefato derivado (evita divergência entre os dois).

```bash
cd qa
npm install            # primeira vez
npm run generate-schema # regenera tracking-plan/schema.json
npm run check          # falha se o schema estiver desatualizado (usado no CI)
```

Sempre que alterar `events.yaml`, rode `npm run generate-schema` e comite os dois
arquivos juntos.

## Convenções do contrato

- Eventos e parâmetros em `snake_case`, orientados a ação (`add_to_cart`).
- Tipos válidos por parâmetro: `string`, `integer`, `number`, `boolean`.
- `required: true` marca parâmetro obrigatório.
- **Sem PII** — nada de e-mail, nome ou telefone em claro.
- Valores monetários usam moeda ISO-4217 no parâmetro `currency` (ex. BRL).

## Formato de um evento capturado

O `schema.json` valida um evento no formato:

```json
{ "event": "add_to_cart", "params": { "item_id": "SKU1", "quantity": 2, "value": 59.8, "currency": "BRL" } }
```

- `event` deve ser um dos eventos declarados no contrato.
- `params` deve conter todos os parâmetros obrigatórios daquele evento, com os
  tipos corretos, e nenhum parâmetro fora do contrato (`additionalProperties: false`).

A validação de eventos reais contra este schema é o tema da **Fase 3 (QA)**.
