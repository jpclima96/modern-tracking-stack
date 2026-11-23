#!/usr/bin/env node
/**
 * Gera, a partir de tracking-plan/events.yaml (fonte de verdade):
 *   - gtm/datalayer-spec.md        : a dataLayer como contrato (push por evento)
 *   - gtm/examples/sample-events.json : um payload de exemplo por evento
 *
 * Cada payload gerado é validado contra tracking-plan/schema.json (gerado na
 * Fase 1). Assim, a camada de coleta (dataLayer) não pode divergir do contrato.
 *
 * Uso:
 *   node generate-datalayer.js          # escreve os artefatos
 *   node generate-datalayer.js --check  # falha se os artefatos estiverem
 *                                        # desatualizados ou inválidos (CI)
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const Ajv2020 = require("ajv/dist/2020");

const ROOT = path.resolve(__dirname, "..");
const EVENTS_PATH = path.join(ROOT, "tracking-plan", "events.yaml");
const SCHEMA_PATH = path.join(ROOT, "tracking-plan", "schema.json");
const SPEC_PATH = path.join(ROOT, "gtm", "datalayer-spec.md");
const SAMPLES_PATH = path.join(ROOT, "gtm", "examples", "sample-events.json");

/** Valor de exemplo determinístico por nome/tipo de parâmetro. */
function exampleValue(name, type) {
  const byName = {
    page_location: "https://exemplo.com/produto/sku-123",
    page_title: "Produto · Exemplo",
    item_id: "SKU-123",
    item_name: "Camiseta Exemplo",
    currency: "BRL",
    transaction_id: "T-10001",
    method: "email",
  };
  if (name in byName) return byName[name];
  switch (type) {
    case "integer":
      return 1;
    case "number":
      return 59.9;
    case "boolean":
      return true;
    default:
      return "exemplo";
  }
}

function loadContract() {
  const doc = yaml.load(fs.readFileSync(EVENTS_PATH, "utf8"));
  if (!doc || typeof doc.events !== "object") {
    throw new Error("events.yaml inválido: chave 'events' ausente.");
  }
  return doc;
}

/** Monta { event, params } de exemplo para um evento do contrato. */
function buildSample(eventName, def) {
  const params = {};
  for (const [param, spec] of Object.entries(def.parameters || {})) {
    params[param] = exampleValue(param, spec.type);
  }
  return { event: eventName, params };
}

function buildSpecMarkdown(contract, samples) {
  const lines = [];
  lines.push("# Data Layer — especificação (GERADO)");
  lines.push("");
  lines.push(
    "> Arquivo **gerado** por `qa/generate-datalayer.js` a partir de " +
      "`tracking-plan/events.yaml`. Não editar à mão."
  );
  lines.push("");
  lines.push(
    "A dataLayer é o **único** canal entre o site e o GTM. Cada evento do " +
      "contrato corresponde a um `dataLayer.push`. Os parâmetros, tipos e " +
      "obrigatoriedade vêm do Tracking Plan e são validados pelo " +
      "`schema.json`."
  );
  lines.push("");
  for (const [name, def] of Object.entries(contract.events)) {
    const sample = samples.find((s) => s.event === name);
    lines.push(`## \`${name}\``);
    lines.push("");
    if (def.description) lines.push(def.description);
    lines.push("");
    lines.push("| Parâmetro | Tipo | Obrigatório |");
    lines.push("|-----------|------|-------------|");
    for (const [param, spec] of Object.entries(def.parameters || {})) {
      lines.push(
        `| \`${param}\` | ${spec.type} | ${spec.required ? "sim" : "não"} |`
      );
    }
    lines.push("");
    lines.push("```js");
    lines.push("window.dataLayer = window.dataLayer || [];");
    lines.push(
      "window.dataLayer.push(" + JSON.stringify(sample, null, 2) + ");"
    );
    lines.push("```");
    lines.push("");
  }
  return lines.join("\n");
}

function main() {
  const check = process.argv.includes("--check");
  const contract = loadContract();
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  const samples = Object.entries(contract.events).map(([name, def]) =>
    buildSample(name, def)
  );

  // Gate: todo payload de exemplo precisa ser válido contra o contrato.
  for (const sample of samples) {
    if (!validate(sample)) {
      console.error(
        `Payload de exemplo inválido para '${sample.event}':`,
        validate.errors
      );
      process.exit(1);
    }
  }

  const specOut = buildSpecMarkdown(contract, samples) + "\n";
  const samplesOut = JSON.stringify(samples, null, 2) + "\n";

  if (check) {
    const specCur = fs.existsSync(SPEC_PATH)
      ? fs.readFileSync(SPEC_PATH, "utf8")
      : "";
    const samplesCur = fs.existsSync(SAMPLES_PATH)
      ? fs.readFileSync(SAMPLES_PATH, "utf8")
      : "";
    if (specCur !== specOut || samplesCur !== samplesOut) {
      console.error(
        "Artefatos da dataLayer desatualizados. Rode: npm run generate-datalayer"
      );
      process.exit(1);
    }
    console.log(
      `OK: dataLayer consistente com o contrato (${samples.length} eventos, ` +
        `payloads válidos).`
    );
    return;
  }

  fs.mkdirSync(path.dirname(SAMPLES_PATH), { recursive: true });
  fs.writeFileSync(SPEC_PATH, specOut);
  fs.writeFileSync(SAMPLES_PATH, samplesOut);
  console.log(
    `dataLayer gerada: datalayer-spec.md + sample-events.json ` +
      `(${samples.length} eventos, payloads válidos).`
  );
}

main();
