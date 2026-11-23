# Data Layer — especificação (GERADO)

> Arquivo **gerado** por `qa/generate-datalayer.js` a partir de `tracking-plan/events.yaml`. Não editar à mão.

A dataLayer é o **único** canal entre o site e o GTM. Cada evento do contrato corresponde a um `dataLayer.push`. Os parâmetros, tipos e obrigatoriedade vêm do Tracking Plan e são validados pelo `schema.json`.

## `page_view`

Visualização de qualquer página do site.

| Parâmetro | Tipo | Obrigatório |
|-----------|------|-------------|
| `page_location` | string | sim |
| `page_title` | string | sim |

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  "event": "page_view",
  "params": {
    "page_location": "https://exemplo.com/produto/sku-123",
    "page_title": "Produto · Exemplo"
  }
});
```

## `view_item`

Usuário visualiza a página de um produto.

| Parâmetro | Tipo | Obrigatório |
|-----------|------|-------------|
| `item_id` | string | sim |
| `item_name` | string | sim |
| `price` | number | sim |
| `currency` | string | sim |

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  "event": "view_item",
  "params": {
    "item_id": "SKU-123",
    "item_name": "Camiseta Exemplo",
    "price": 59.9,
    "currency": "BRL"
  }
});
```

## `add_to_cart`

Usuário adiciona um item ao carrinho.

| Parâmetro | Tipo | Obrigatório |
|-----------|------|-------------|
| `item_id` | string | sim |
| `quantity` | integer | sim |
| `value` | number | sim |
| `currency` | string | sim |

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  "event": "add_to_cart",
  "params": {
    "item_id": "SKU-123",
    "quantity": 1,
    "value": 59.9,
    "currency": "BRL"
  }
});
```

## `begin_checkout`

Usuário inicia o processo de checkout.

| Parâmetro | Tipo | Obrigatório |
|-----------|------|-------------|
| `value` | number | sim |
| `currency` | string | sim |
| `num_items` | integer | sim |

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  "event": "begin_checkout",
  "params": {
    "value": 59.9,
    "currency": "BRL",
    "num_items": 1
  }
});
```

## `purchase`

Compra concluída com sucesso.

| Parâmetro | Tipo | Obrigatório |
|-----------|------|-------------|
| `transaction_id` | string | sim |
| `value` | number | sim |
| `currency` | string | sim |
| `num_items` | integer | sim |

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  "event": "purchase",
  "params": {
    "transaction_id": "T-10001",
    "value": 59.9,
    "currency": "BRL",
    "num_items": 1
  }
});
```

## `sign_up`

Usuário cria uma conta.

| Parâmetro | Tipo | Obrigatório |
|-----------|------|-------------|
| `method` | string | sim |

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  "event": "sign_up",
  "params": {
    "method": "email"
  }
});
```

