# GTM + dataLayer — camada de coleta

Implementa o contrato da Fase 1 (`tracking-plan/`) na coleta. A **dataLayer** é a
API entre o site e o GTM; o GTM transforma cada evento em um hit GA4.

## Fluxo

```
site  →  dataLayer.push({event, params})  →  GTM (trigger)  →  GA4 event tag  →  GA4
```

A dataLayer é o **único** canal site → GTM (CLAUDE.md, seção 6). Nenhuma tag lê
o DOM diretamente: tudo vem de um `push` padronizado.

## Arquivos

| Arquivo | O que é | Editar? |
|---------|---------|---------|
| `datalayer-spec.md` | Spec da dataLayer (push por evento) | **Não** — gerado de `events.yaml` |
| `examples/sample-events.json` | Um payload de exemplo por evento | **Não** — gerado e validado |
| `examples/index.html` | Página estática que dispara os eventos | Sim |
| `container.json` | Export do GTM, importável | Sim (manual) |

A spec e os exemplos são gerados por `qa/generate-datalayer.js` e **validados
contra `tracking-plan/schema.json`** — a coleta não pode divergir do contrato.

```bash
cd qa && npm install          # primeira vez
npm run generate-datalayer    # regenera datalayer-spec.md + sample-events.json
npm run check                 # valida schema + dataLayer (usado no CI)
```

## O container GTM

Importe `container.json` em um workspace do GTM
(Admin → Import Container). Ele contém:

**Variáveis (12)**
- `GA4 Measurement ID` — constante; troque `G-XXXXXXXXXX` pelo ID real.
- `DLV - <param>` — Data Layer Variables que leem `params.<param>` de cada push
  (ex.: `DLV - value` lê `params.value`).

**Triggers (7)**
- `Init - All Pages` — inicialização, dispara a configuração GA4.
- `CE - <evento>` — um Custom Event trigger por evento do contrato, casando com
  o nome empurrado na dataLayer.

**Tags (7)**
- `GA4 - Configuration` (`gaawc`) — carrega a configuração GA4 na inicialização.
  `sendPageView = false`: o `page_view` é enviado pela tag de evento, para passar
  pelo mesmo contrato das demais.
- `GA4 Event - <evento>` (`gaawe`) — uma por evento; mapeia os parâmetros da
  dataLayer para os parâmetros do evento GA4, via as `DLV`.

Cada tag de evento dispara apenas no seu trigger correspondente. Os seis eventos
do contrato têm cobertura 1:1 em tags e triggers (verificado no QA).

## Demonstração offline

`examples/index.html` é uma página estática (sem framework, sem build). Cada
botão executa o `dataLayer.push` do payload de exemplo e mostra no log o que o
GTM receberia. Para rodar, sirva a pasta `examples/` por HTTP (o `fetch` do
JSON não funciona via `file://`):

```bash
cd gtm/examples && npx --yes http-server -p 8080   # ou qualquer servidor estático
```

Em modo offline (ADR 0003) o container não precisa estar publicado: a página
serve para demonstrar e revisar os pushes da dataLayer.

## Fora de escopo nesta fase

- Validação de eventos capturados em runtime → **Fase 3 (QA)**.
- GA4 export / Airbyte / BigQuery → **Fase 4+**.
