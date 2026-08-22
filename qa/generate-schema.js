#!/usr/bin/env node
/**
 * Gera tracking-plan/schema.json a partir de tracking-plan/events.yaml.
 *
 * O events.yaml é a única fonte de verdade (ADR 0002). Este script deriva um
 * JSON Schema (draft 2020-12) que valida um evento capturado: nome do evento +
 * parâmetros com tipos e obrigatoriedade.
 *
 * Uso:
 *   node generate-schema.js          # escreve schema.json
 *   node generate-schema.js --check  # falha se o schema no disco estiver
 *                                     # desatualizado (para CI); não escreve
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const Ajv2020 = require("ajv/dist/2020");

const ROOT = path.resolve(__dirname, "..");
const EVENTS_PATH = path.join(ROOT, "tracking-plan", "events.yaml");
const SCHEMA_PATH = path.join(ROOT, "tracking-plan", "schema.json");

const VALID_TYPES = new Set(["string", "integer", "number", "boolean"]);

function loadContract() {
  const raw = fs.readFileSync(EVENTS_PATH, "utf8");
  const doc = yaml.load(raw);
  if (!doc || typeof doc.events !== "object") {
    throw new Error("events.yaml inválido: chave 'events' ausente.");
  }
  return doc;
}

/** Constrói o subschema de parâmetros de um evento. */
function buildParamsSchema(eventName, params) {
  const properties = {};
  const required = [];
  for (const [param, spec] of Object.entries(params || {})) {
    if (!spec || !VALID_TYPES.has(spec.type)) {
      throw new Error(
        `Evento '${eventName}', parâmetro '${param}': tipo inválido ` +
          `(${spec && spec.type}). Válidos: ${[...VALID_TYPES].join(", ")}.`
      );
    }
    properties[param] = { type: spec.type };
    if (spec.description) properties[param].description = spec.description;
    if (spec.required === true) required.push(param);
  }
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

/** Deriva o JSON Schema completo a partir do contrato. */
function buildSchema(contract) {
  const eventNames = Object.keys(contract.events);
  const paramsByEvent = {};
  for (const [name, def] of Object.entries(contract.events)) {
    paramsByEvent[name] = buildParamsSchema(name, def.parameters);
  }

  // Um evento capturado tem { event: <nome>, params: {...} }. O schema exige
  // que o nome seja um dos eventos do contrato e que params respeite o
  // subschema daquele evento (via allOf + if/then).
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://modern-tracking-stack/tracking-plan/schema.json",
    title: "Modern Tracking Stack — evento capturado",
    description:
      "Schema GERADO a partir de tracking-plan/events.yaml. Não editar à mão.",
    type: "object",
    properties: {
      event: { type: "string", enum: eventNames },
      params: { type: "object" },
    },
    required: ["event", "params"],
    additionalProperties: false,
    allOf: eventNames.map((name) => ({
      if: { properties: { event: { const: name } } },
      then: { properties: { params: paramsByEvent[name] } },
    })),
  };
}

function main() {
  const check = process.argv.includes("--check");
  const contract = loadContract();
  const schema = buildSchema(contract);

  // Garante que o schema gerado é, ele mesmo, um JSON Schema válido/compilável.
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.compile(schema);

  const serialized = JSON.stringify(schema, null, 2) + "\n";

  if (check) {
    const current = fs.existsSync(SCHEMA_PATH)
      ? fs.readFileSync(SCHEMA_PATH, "utf8")
      : "";
    if (current !== serialized) {
      console.error(
        "schema.json está desatualizado. Rode: npm run generate-schema"
      );
      process.exit(1);
    }
    console.log(
      `OK: schema.json consistente com events.yaml ` +
        `(${Object.keys(contract.events).length} eventos).`
    );
    return;
  }

  fs.writeFileSync(SCHEMA_PATH, serialized);
  console.log(
    `schema.json gerado a partir de events.yaml ` +
      `(${Object.keys(contract.events).length} eventos).`
  );
}

main();
