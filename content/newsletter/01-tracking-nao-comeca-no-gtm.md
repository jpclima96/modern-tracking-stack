# Building a Modern Tracking Stack #01 — Tracking não deveria começar no GTM

A maioria dos projetos de tracking começa errado. Alguém abre o Google Tag
Manager, cria uma tag, dispara um evento e declara vitória. Meses depois, ninguém
sabe ao certo o que `purchase` significa, dois eventos medem a mesma coisa com
nomes diferentes, e a área de dados não confia em nenhum número.

Antes de criar qualquer tag, decidi construir a **fundação** do projeto Modern
Tracking Stack. Esta primeira edição é sobre isso: por que a primeira decisão de
um projeto de tracking não é técnica de coleta, e sim de arquitetura.

## O problema

Tracking é frequentemente tratado como uma tarefa de implementação, não de
engenharia. O sintoma clássico é começar pelo GTM. O GTM é excelente no que faz —
gerenciar e disparar tags — mas ele é o **fim** de uma cadeia de decisões, não o
começo.

Quando o projeto nasce dentro do GTM, alguns problemas se tornam quase
inevitáveis:

- **Não existe fonte de verdade.** A definição de cada evento vive na cabeça de
  quem configurou a tag. Não há como revisar, versionar ou auditar.
- **Nomes divergem.** `add_to_cart`, `AddToCart` e `cart_add` acabam coexistindo,
  porque nada impõe um padrão.
- **A modelagem herda o caos.** O time de Analytics Engineering recebe dados
  inconsistentes no warehouse e precisa "limpar" o que nunca deveria ter chegado
  sujo.
- **Não há governança.** Decisões importantes (onde os dados moram, como são
  transformados, o que é PII) nunca foram escritas, então são retomadas do zero a
  cada discussão.

Isso importa porque tracking ruim não é um problema de coleta — é um problema de
confiança. Um número em que ninguém confia não gera decisão de negócio. E
confiança se constrói na fundação, não na última tag.

## O conceito

Três ideias sustentam a fundação deste projeto.

**Martech Architecture antes de implementação.** Antes de coletar, você decide as
camadas do sistema e o papel de cada uma: coleta, ingestão, transformação,
qualidade e medição. Essa separação define quem é responsável por quê e evita que
uma camada conserte o erro de outra.

**Architecture Decision Records (ADRs).** Uma decisão arquitetural que não está
escrita não existe — ela vira folclore. Um ADR registra o contexto, a decisão, as
consequências e as alternativas descartadas. Isso torna a decisão revisável e,
principalmente, difícil de reverter por acidente.

**Contract-first.** A coleta deve nascer de um contrato versionado — o Tracking
Plan — e não de uma tag avulsa. É a diferença entre projetar uma API e sair
escrevendo endpoints soltos. (O contrato em si é o tema da Fase 1; aqui a decisão
é apenas fixar que ele será a fonte de verdade.)

## Como implementei no Modern Tracking Stack

A Fase 0 não entregou nenhuma linha de tracking. Ela entregou a fundação
documental e estrutural que governa todo o resto.

O centro é o arquivo `CLAUDE.md`, que funciona como manual permanente do
repositório. Ele fixa objetivo, cenário de negócio, convenções de SQL e dbt,
nomenclatura, requisitos de testes e uma Definition of Done. Também define um
fluxo obrigatório que toda fase segue:

```
PLANEJAR → IMPLEMENTAR → TESTAR → AUDITAR → DOCUMENTAR → CRIAR CONTEÚDO
```

A arquitetura em cinco camadas ficou registrada em `docs/architecture.md`:

```
[ Coleta ]        Site → GTM → GA4              Tracking Engineering
[ Ingestão ]      GA4 / Airbyte → BigQuery      Marketing Data Engineering
[ Transformação ] dbt (staging → intermediate → marts)  Analytics Engineering
[ Qualidade ]     dbt tests + QA (Node.js)      Data Quality
[ Medição ]       Marts + dicionário de métricas Measurement
```

Repare onde o GTM está: dentro da **primeira** camada, subordinado a um contrato
que ainda vem por cima dele. O GTM implementa o contrato; ele não o define.

## Arquitetura

O que a fundação estabelece não é o dado fluindo, mas a **ordem das decisões**:

```
tracking-plan/  →  GTM / dataLayer  →  BigQuery  →  dbt  →  métricas
  (contrato)        (implementa)        (armazena)   (modela)  (mede)
      ▲
   fonte de verdade da coleta
```

A seta que mais importa é a que aponta para trás, do contrato para a
implementação. Enquanto o `tracking-plan/` for a origem, o GTM nunca vira a fonte
de verdade — ele vira um consumidor dela.

## Decisões e trade-offs

Quatro decisões foram registradas como ADRs nesta fase:

- **ADR 0001 — BigQuery + dbt.** BigQuery é o único warehouse; dbt é a única
  ferramenta de transformação. Nenhum SQL de produção vive fora do dbt.
  *Trade-off:* exige disciplina de manter as camadas `staging → intermediate →
  marts`. A alternativa (views manuais no BigQuery) seria mais rápida no início e
  ingovernável no médio prazo — sem versionamento nem testes integrados.

- **ADR 0002 — Contract-first.** O `tracking-plan/` é a fonte de verdade da
  coleta. *Trade-off:* mais cerimônia antes do primeiro evento. A alternativa
  (implementar direto no GTM) é mais ágil no dia um e cara em todo dia seguinte.

- **ADR 0003 — Offline por padrão.** A modelagem roda sobre *seeds* (CSV de
  exemplo), sem exigir credenciais de GCP. *Trade-off:* os seeds precisam imitar
  fielmente o schema real do export GA4→BigQuery para terem valor. Em troca,
  qualquer pessoa clona e roda o projeto sem acesso à nuvem — essencial para um
  portfólio.

- **ADR 0004 — Airbyte real.** A ingestão via Airbyte é definida como
  configuração real e versionada. Aqui houve uma **tensão explícita** com o ADR
  0003: o destino real do Airbyte é o BigQuery, que o repositório não conecta por
  padrão. A reconciliação foi manter a configuração versionada e válida, deixando
  a aplicação do destination BigQuery como passo documentado. Preferi registrar a
  tensão a escondê-la — um ADR honesto vale mais que um limpo.

Uma restrição transversal também foi fixada: **sem Python** e **sem aplicação
web** além de um HTML estático mínimo, se necessário. Não por preconceito, mas
para manter o escopo colado ao objetivo e revisável pelo celular.

## O que aprendi

- **A ordem das decisões é a arquitetura.** Nesta fase não houve dado nenhum
  fluindo, e ainda assim a decisão mais importante do projeto já foi tomada:
  quem manda na coleta é o contrato, não a ferramenta.
- **Escrever a tensão é melhor do que resolvê-la no papel.** O conflito entre
  "offline por padrão" e "Airbyte real" não sumiu; ficou documentado no ADR 0004.
  Isso é mais útil para quem lê do que uma decisão sem cicatrizes.
- **Fundação é pequena de propósito.** A Fase 0 é só documentação e esqueleto de
  pastas. Manter cada entrega pequena e revisável é o que torna viável construir
  um projeto inteiro pelo celular.

## Conclusão

Tracking maduro não começa no GTM — começa numa decisão de arquitetura e num
contrato. O GTM continua indispensável, mas no lugar certo: como executor de uma
especificação, não como origem dela. Investir na fundação antes da primeira tag é
o que separa um projeto de tracking de um amontoado de tags.

## Próxima parte

Na próxima edição, saímos da fundação e escrevemos o contrato: o **Tracking
Plan** como um contrato de dados versionado em YAML, com um JSON Schema que
permite validar eventos automaticamente. O tema: por que seu Tracking Plan
deveria ser tratado como um contrato de dados, e não como uma planilha.

---

### Descrição curta para o LinkedIn

Todo projeto de tracking que começa no GTM herda o mesmo problema: nenhuma fonte
de verdade. Na primeira edição da série "Building a Modern Tracking Stack", mostro
por que a primeira decisão de tracking é de arquitetura — e como montei a
fundação do projeto com ADRs, uma arquitetura em cinco camadas e uma abordagem
contract-first, antes de criar qualquer tag.

### Sugestão de imagem de capa

Uma pirâmide invertida de decisões: no topo largo, "Contrato / Arquitetura"; no
meio, "GTM / dataLayer"; na base estreita, "Tag". A mensagem visual é que a tag é
a menor e última decisão, não a primeira.

### Sugestão de diagrama técnico

O fluxo de ordem das decisões, com a seta de "fonte de verdade" apontando do
`tracking-plan/` para o GTM:
`tracking-plan (contrato) → GTM/dataLayer → BigQuery → dbt → métricas`.

### 3 títulos alternativos

1. Por que seu projeto de tracking não deveria começar no GTM
2. A primeira decisão de tracking é de arquitetura, não de coleta
3. Fundação antes da tag: como começar um Modern Tracking Stack
