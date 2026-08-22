# Building a Modern Tracking Stack #02 — Seu Tracking Plan deveria ser um contrato de dados

Na edição anterior, defendi que tracking não começa no GTM — começa numa decisão
de arquitetura e num contrato. Ficou faltando o contrato. Nesta fase eu o
escrevi: um Tracking Plan versionado em YAML, com um JSON Schema gerado
automaticamente para validar eventos. Esta edição é sobre por que um Tracking
Plan deveria ser tratado como um **contrato de dados** — com tipos,
obrigatoriedade e uma fonte de verdade única — e não como uma planilha que
envelhece.

## O problema

O Tracking Plan mais comum é uma planilha. Alguém lista eventos, parâmetros e uma
coluna de "descrição", compartilha o link, e a partir dali a planilha e a
realidade começam a divergir. O problema não é a planilha em si — é que ela não
tem **poder de imposição**. Nada garante que o evento implementado no GTM
corresponde ao que está escrito. Nada valida que `value` é um número e não uma
string. Nada impede que um parâmetro novo apareça sem aviso.

O resultado é conhecido: o time de dados recebe eventos com tipos inconsistentes,
parâmetros faltando e nomes que quase batem com a especificação. A planilha vira
documentação histórica de uma intenção, não um contrato que a coleta é obrigada a
cumprir.

## O conceito

Um **contrato de dados** é uma especificação que as duas pontas — quem produz e
quem consome — se comprometem a respeitar, e que pode ser **verificada por
máquina**. Três propriedades o distinguem de uma planilha:

- **Tipos.** Cada campo tem um tipo declarado. `quantity` é `integer`, `value` é
  `number`. Isso é validável.
- **Obrigatoriedade.** O contrato distingue o que é obrigatório do que é
  opcional. Um `purchase` sem `transaction_id` é inválido, não incompleto.
- **Fonte de verdade única.** Existe um artefato canônico. Todo o resto — schema
  de validação, tags, modelagem — deriva dele.

**JSON Schema** é o mecanismo que torna isso executável: uma linguagem para
descrever a forma de um dado e validar instâncias contra essa forma.

## Como implementei no Modern Tracking Stack

O contrato vive em `tracking-plan/events.yaml`. Escolhi YAML por ser legível e
fácil de revisar — inclusive numa tela de celular. Cada evento declara descrição
e parâmetros tipados:

```yaml
add_to_cart:
  description: Usuário adiciona um item ao carrinho.
  parameters:
    item_id:  { type: string,  required: true }
    quantity: { type: integer, required: true }
    value:    { type: number,  required: true }
    currency: { type: string,  required: true }
```

A Fase 1 declarou seis eventos que cobrem a jornada de conversão: `page_view`,
`view_item`, `add_to_cart`, `begin_checkout`, `purchase` e `sign_up`. Seis, e não
sessenta — um contrato pequeno é revisável e honesto sobre o que o projeto
realmente mede.

O `schema.json` **não é escrito à mão**. Ele é gerado a partir do YAML por um
script Node.js (`qa/generate-schema.js`). O script lê o contrato e produz um JSON
Schema (draft 2020-12) em que cada evento tem seus parâmetros, tipos e
obrigatórios — usando `if/then` por evento e `additionalProperties: false` para
rejeitar qualquer parâmetro fora do contrato.

O schema gerado valida de verdade. Testei os quatro casos que importam:

```
evento válido            -> aceito
faltando 'value'         -> rejeitado (required)
'quantity' como string   -> rejeitado (tipo)
evento inexistente       -> rejeitado (enum)
```

Além do contrato, escrevi um **Measurement Plan** (`docs/metrics/`) que liga cada
evento a uma pergunta de negócio — por exemplo, `purchase` responde "quantas
conversões e qual receita?". É a regra que evita evento órfão: se não responde a
uma pergunta, não entra no contrato.

## Arquitetura

A decisão central é a direção da geração. O YAML é a origem; o schema é derivado:

```
events.yaml  ──(qa/generate-schema.js)──►  schema.json
 (fonte de                                   (artefato gerado,
  verdade)                                    não editar à mão)
```

Isso tem uma consequência prática importante: o script roda em dois modos. O modo
padrão gera o schema; o modo `--check` **falha** se o schema no disco estiver
diferente do que o contrato geraria. É o gancho para o CI (Fase 8) recusar um
commit em que alguém mexeu no YAML e esqueceu de regenerar o schema — ou, pior,
editou o schema à mão.

## Decisões e trade-offs

**Gerar o schema em vez de escrevê-lo à mão.** A alternativa — manter YAML e JSON
Schema em paralelo — é mais simples no primeiro dia e garante divergência no
médio prazo. Ao gerar, pago o custo de um script Node.js (com `js-yaml` e `ajv`)
em troca de eliminar por construção a possibilidade de os dois divergirem. Para um
contrato que é a fonte de verdade da coleta, essa troca compensa.

**YAML como fonte, JSON Schema como alvo.** YAML é melhor para humanos revisarem;
JSON Schema é o padrão para máquinas validarem. Usar cada um onde é forte, com
geração automática entre eles, evita escolher.

**Um detalhe honesto sobre YAML.** A primeira geração falhou. Eu tinha descrições
como `Moeda ISO-4217 (ex.: BRL)`, e o `: ` dentro de um texto não-citado faz o
YAML interpretar aquilo como um mapeamento — erro de indentação no parser. A
correção foi trivial (removi o `:` do `ex.:`), mas o episódio é ilustrativo: YAML
é confortável de ler e cheio de armadilhas de sintaxe. É exatamente por isso que
o contrato precisa de validação automática, e não de confiança no olho humano.

## O que aprendi

- **Contrato é o que a máquina consegue impor.** A diferença entre uma planilha e
  um contrato de dados não é o formato — é existir um schema que rejeita o que
  viola a especificação.
- **Geração mata divergência.** Ter uma fonte de verdade só resolve o problema se
  os artefatos derivados forem realmente derivados. O modo `--check` transforma
  "lembre de regenerar" em uma verificação, não em disciplina.
- **A ergonomia de revisão importa quando se trabalha pelo celular.** YAML venceu
  o JSON como fonte porque é mais fácil de ler e editar numa tela pequena — e a
  validação automática cobre justamente as armadilhas que essa escolha traz.

## Conclusão

Um Tracking Plan que é só documentação envelhece contra a realidade. Um Tracking
Plan que é um contrato de dados — tipado, com obrigatoriedade e fonte de verdade
única — vira um portão: o que não cumpre o contrato pode ser rejeitado antes de
sujar o warehouse. O schema gerado nesta fase é a base desse portão.

## Próxima parte

Já temos o contrato. Falta o portão em si. Na próxima edição, construo o **QA de
eventos em Node.js** que valida eventos capturados contra este `schema.json` — e
discuto por que a Data Layer deveria ser tratada como uma API, com validação na
fronteira entre o site e o resto da stack.

---

### Descrição curta para o LinkedIn

A maioria dos Tracking Plans é uma planilha que envelhece contra a realidade. Na
edição #02 da série "Building a Modern Tracking Stack", mostro como transformei o
Tracking Plan num contrato de dados: eventos tipados em YAML como fonte de
verdade, um JSON Schema gerado automaticamente por um script Node.js, e um modo
de verificação que impede o schema de divergir do contrato.

### Sugestão de imagem de capa

Dois documentos lado a lado com uma seta de geração entre eles: à esquerda,
`events.yaml` (rótulo "fonte de verdade"); à direita, `schema.json` (rótulo
"gerado"). Um carimbo de "válido/inválido" sobre um evento à direita reforça a
ideia de portão.

### Sugestão de diagrama técnico

O fluxo de geração e verificação:
`events.yaml → generate-schema.js → schema.json`, com um ramo `--check` que
compara o schema em disco com o gerado e falha no CI se divergirem.

### 3 títulos alternativos

1. Seu Tracking Plan deveria ser um contrato de dados, não uma planilha
2. De planilha a contrato: tipando e validando o Tracking Plan
3. Gere seu JSON Schema: uma fonte de verdade para a coleta
