# Measurement Plan

Liga cada evento do [Tracking Plan](../../tracking-plan/events.yaml) a uma
**pergunta de negócio**. Nenhum evento é coletado sem propósito de medição — se
não responde a uma pergunta, não entra no contrato.

## Cenário

E-commerce/SaaS fictício que precisa medir a jornada do usuário, da visita à
conversão, com dados confiáveis e governados.

## Eventos → perguntas de negócio

| Evento | Pergunta de negócio | Métrica derivada (fase de dbt) |
|--------|---------------------|--------------------------------|
| `page_view` | Quanto tráfego e quais páginas são vistas? | Pageviews, páginas por sessão |
| `view_item` | Quais produtos atraem interesse? | Product views por item |
| `add_to_cart` | O interesse vira intenção de compra? | Add-to-cart rate |
| `begin_checkout` | Quantos iniciam o checkout? | Checkout start rate |
| `purchase` | Quantas conversões e qual receita? | Conversões, receita, ticket médio |
| `sign_up` | Quantas contas novas e por qual método? | Sign-ups por método |

## Funil de conversão

A sequência de eventos desenha o funil que será modelado nas fases de dbt
(marts):

```
view_item → add_to_cart → begin_checkout → purchase
```

Cada passo permite medir uma taxa de conversão entre etapas (ex.: quantos que
adicionam ao carrinho iniciam o checkout). As métricas concretas são definidas
quando os marts forem construídos (Fase 6); aqui fica registrado **o que** cada
evento serve para medir.

## Princípios de medição

- **Uma pergunta por evento** — evita eventos órfãos e coleta sem uso.
- **Sem PII** — medimos comportamento, não identidade pessoal.
- **Rastreabilidade** — cada métrica final referencia sua origem via linhagem dbt
  (Fase 6 em diante).
