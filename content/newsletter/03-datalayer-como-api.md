# Building a Modern Tracking Stack #03 — Sua Data Layer deveria ser tratada como uma API

Nas duas edições anteriores, defini o contrato: eventos tipados em YAML, com um
JSON Schema gerado para validá-los. Faltava conectar esse contrato ao mundo real
— ao site que produz os eventos e ao GTM que os consome. Nesta fase construí essa
ponte. A tese é direta: vale a pena tratar a **Data Layer** como uma **API**
entre dois sistemas, com contrato, formato estável e um único ponto de contato.

## O problema

No setup típico, o GTM lê a página diretamente. Uma tag pega o texto de um botão,
outra lê um atributo escondido no DOM, uma terceira faz um seletor CSS para achar
o preço. Funciona — até o time de front-end renomear uma classe, mudar o layout
ou trocar de framework. Aí o tracking quebra silenciosamente, e ninguém percebe
até a receita no relatório não bater.

O problema de fundo é **acoplamento**. Quando o GTM lê o DOM, a coleta fica
acoplada à aparência da página. Mas aparência muda o tempo todo; a semântica do
negócio (o que é um `add_to_cart`) muda muito menos. Misturar as duas coisas
significa que toda mudança visual é um risco de tracking.

## O conceito

Uma **Data Layer** é uma camada de dados estruturada — um objeto
(`window.dataLayer`) onde o site publica eventos de negócio de forma explícita,
independente de como a página é desenhada. Em vez de o GTM "adivinhar" o que
aconteceu olhando o DOM, o site **declara** o que aconteceu:

```js
window.dataLayer.push({
  event: "add_to_cart",
  params: { item_id: "SKU-123", quantity: 1, value: 59.9, currency: "BRL" }
});
```

Tratar isso como uma API significa três coisas:

- **Contrato explícito.** A forma do push é especificada, não improvisada.
- **Um único ponto de integração.** O GTM só conversa com a dataLayer, nunca com
  o DOM. O site tem uma só responsabilidade: emitir os eventos certos.
- **Estabilidade independente da UI.** Redesenhar a página não quebra o tracking,
  desde que os mesmos eventos continuem sendo empurrados.

## Como implementei no Modern Tracking Stack

A spec da dataLayer não é escrita à mão — ela é **gerada** a partir do contrato
da Fase 1. O script `qa/generate-datalayer.js` lê `tracking-plan/events.yaml` e
produz dois artefatos:

- `gtm/datalayer-spec.md` — a documentação do push de cada evento;
- `gtm/examples/sample-events.json` — um payload de exemplo por evento.

E faz mais do que gerar: **valida** cada payload de exemplo contra o
`schema.json`. Se um exemplo violasse o contrato — um tipo errado, um parâmetro
faltando — a geração falharia. A camada de coleta, por construção, não pode
divergir do contrato.

No GTM, o `container.json` (importável) materializa o fluxo. Para cada evento há:

- uma **Data Layer Variable** por parâmetro (`DLV - value` lê `params.value`);
- um **Custom Event trigger** que casa com o nome do evento;
- uma **GA4 Event tag** que mapeia os parâmetros da dataLayer para o evento GA4.

Nenhuma tag lê o DOM. Todas leem a dataLayer. Verifiquei no QA que os seis
eventos do contrato têm cobertura 1:1 em tags e triggers — nem evento sem tag,
nem tag órfã.

Por fim, uma página estática (`gtm/examples/index.html`) demonstra o mecanismo:
botões que executam o push de cada evento. Não é uma aplicação — é uma página
sem framework e sem build, o único "web" que a arquitetura permite (ADR da
fundação). Rodei a página num navegador headless e confirmei o comportamento:
seis botões renderizados; ao clicar em `add_to_cart` e `purchase`, a
`window.dataLayer` terminou com exatamente esses dois eventos, na ordem. A API
fez o que o contrato diz.

## Arquitetura

O desacoplamento fica explícito no fluxo:

```
site → dataLayer.push({event, params}) → GTM trigger → GA4 event tag → GA4
         ▲                                   │
         └── contrato (events.yaml) ─────────┘
             gera a spec e valida os exemplos
```

A dataLayer é a fronteira. De um lado, o site, livre para mudar de aparência. Do
outro, o GTM, que só precisa saber ler um objeto estável. O contrato governa os
dois lados a partir da mesma fonte de verdade.

Uma decisão de medição vale nota: a tag de configuração GA4 está com
`sendPageView = false`, e o `page_view` é enviado por uma tag de evento como
qualquer outro. Assim, **todos** os eventos passam pelo mesmo caminho — dataLayer
→ trigger → tag —, sem um caso especial para a visualização de página.

## Decisões e trade-offs

**Gerar a spec da dataLayer em vez de escrevê-la.** A alternativa seria manter o
contrato (YAML) e a documentação da dataLayer separados. Isso garante que um dia
eles divergem. Ao gerar a spec e validar os exemplos contra o schema, pago o
custo de um segundo script Node.js para eliminar a divergência por construção —
a mesma lógica que usei para o schema na Fase 2 do projeto.

**Container importável + README explicativo, em vez de um ou outro.** Um
`container.json` sozinho é verboso e difícil de revisar numa tela de celular; um
texto sozinho não é importável. Mantive os dois: o JSON para quem vai aplicar no
GTM, o README para quem vai entender ou revisar. O trade-off é ter duas
representações do mesmo setup — aceitável porque o README descreve, não duplica
lógica executável.

**Página estática, não aplicação.** Seria fácil montar um site real para
demonstrar. Mas isso violaria a restrição de não construir uma web app sem
necessidade. Uma página sem build prova o mecanismo da dataLayer com o mínimo de
superfície.

## O que aprendi

- **A fronteira é o produto.** O valor desta fase não está nas tags, e sim em
  fixar a dataLayer como o único ponto de contato entre site e GTM. É essa
  fronteira que protege o tracking das mudanças de UI.
- **Gerar + validar fecha o ciclo do contrato.** Na Fase 1, o contrato validava
  eventos. Agora ele também gera e valida a camada que produz esses eventos. O
  contrato deixou de ser documentação e virou a origem de código e configuração.
- **Dá para testar tracking sem GA4.** Não precisei de uma conta GA4 nem de rede
  para verificar o comportamento: um navegador headless e a `window.dataLayer`
  bastaram para provar que os eventos certos são empurrados.

## Conclusão

Tracking frágil quase sempre tem a mesma causa: a coleta acoplada à aparência da
página. Tratar a Data Layer como uma API — com contrato, um único ponto de
integração e estabilidade independente da UI — é o que torna o tracking
resiliente. O GTM, nesse arranjo, é só o consumidor bem-comportado de uma API que
o contrato define.

## Próxima parte

Temos um contrato e uma API que o implementa. Falta o guarda que verifica, em
runtime, se o que é empurrado na dataLayer realmente respeita o contrato. Na
próxima edição, construo o **QA de eventos em Node.js** — o validador que recusa
eventos fora do schema — e discuto por que Data Quality começa na fronteira da
coleta, não no warehouse.

---

### Descrição curta para o LinkedIn

Tracking quebra quando o GTM lê o DOM e o front-end muda o layout. Na edição #03
da série "Building a Modern Tracking Stack", mostro como tratar a Data Layer como
uma API: uma spec gerada a partir do contrato, exemplos validados contra o schema,
e um container GTM em que nenhuma tag lê o DOM — só a dataLayer. Inclui a
verificação headless de que os eventos certos são realmente empurrados.

### Sugestão de imagem de capa

Uma fronteira vertical no centro. À esquerda, "Site (UI que muda)"; à direita,
"GTM → GA4". No meio, uma faixa rotulada `dataLayer` como contrato/API, com uma
seta única atravessando — e um "x" sobre uma seta que tentaria ligar o GTM
direto ao DOM.

### Sugestão de diagrama técnico

O fluxo desacoplado:
`site → dataLayer.push({event, params}) → GTM trigger → GA4 event tag → GA4`,
com o contrato (`events.yaml`) abaixo, ligado por setas à geração da spec e à
validação dos exemplos.

### 3 títulos alternativos

1. Sua Data Layer deveria ser tratada como uma API
2. Pare de deixar o GTM ler o DOM: use a Data Layer como contrato
3. Desacoplando tracking da UI com uma Data Layer gerada do contrato
