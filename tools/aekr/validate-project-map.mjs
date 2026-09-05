#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const STATIC_CALL = Symbol("static Project Map call");

function fail(message) {
  throw new Error(message);
}

function extractScripts(html, file) {
  const scripts = [
    ...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi),
  ]
    .filter((match) => !/\btype=["']application\/json["']/i.test(match[1]))
    .map((match) => match[2]);
  if (scripts.length === 0) fail(`${file}: no inline script found`);
  scripts.forEach((source, index) => {
    new vm.Script(source, { filename: `${file}#script-${index + 1}` });
  });
  return scripts;
}

function extractIndex(html, file) {
  const match = html.match(
    /<script\b(?=[^>]*\bid=["']project-map-index["'])[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match) fail(`${file}: missing non-executable project-map-index`);
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    fail(`${file}: invalid project-map-index JSON: ${error.message}`);
  }
}

class StaticLiteralParser {
  constructor(source, offset, file) {
    this.source = source;
    this.offset = offset;
    this.file = file;
  }

  error(message) {
    fail(
      `${this.file}: invalid static Project Map data at offset ${this.offset}: ${message}`,
    );
  }

  skipTrivia() {
    while (this.offset < this.source.length) {
      if (/\s/.test(this.source[this.offset])) {
        this.offset += 1;
      } else if (this.source.startsWith("//", this.offset)) {
        const newline = this.source.indexOf("\n", this.offset + 2);
        this.offset = newline === -1 ? this.source.length : newline + 1;
      } else if (this.source.startsWith("/*", this.offset)) {
        const end = this.source.indexOf("*/", this.offset + 2);
        if (end === -1) this.error("unterminated block comment");
        this.offset = end + 2;
      } else {
        break;
      }
    }
  }

  expect(character) {
    this.skipTrivia();
    if (this.source[this.offset] !== character) {
      this.error(`expected ${JSON.stringify(character)}`);
    }
    this.offset += 1;
  }

  parseValue() {
    this.skipTrivia();
    const character = this.source[this.offset];
    if (character === '"' || character === "'") return this.parseString();
    if (character === "[") return this.parseArray();
    if (character === "{") return this.parseObject();
    if (character === "-" || /[0-9]/.test(character ?? "")) {
      return this.parseNumber();
    }
    if (/[A-Za-z_$]/.test(character ?? "")) return this.parseIdentifierValue();
    this.error(`unsupported token ${JSON.stringify(character)}`);
  }

  parseString() {
    const quote = this.source[this.offset];
    this.offset += 1;
    let value = "";
    while (this.offset < this.source.length) {
      const character = this.source[this.offset];
      this.offset += 1;
      if (character === quote) return value;
      if (character === "\n" || character === "\r") {
        this.error("unescaped newline in string");
      }
      if (character !== "\\") {
        value += character;
        continue;
      }

      if (this.offset >= this.source.length) this.error("unterminated escape");
      const escape = this.source[this.offset];
      this.offset += 1;
      const simple = {
        "'": "'",
        '"': '"',
        "\\": "\\",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
        v: "\v",
        0: "\0",
      };
      if (Object.hasOwn(simple, escape)) {
        value += simple[escape];
      } else if (escape === "x") {
        const digits = this.source.slice(this.offset, this.offset + 2);
        if (!/^[0-9A-Fa-f]{2}$/.test(digits)) this.error("invalid hex escape");
        value += String.fromCharCode(Number.parseInt(digits, 16));
        this.offset += 2;
      } else if (escape === "u") {
        if (this.source[this.offset] === "{") {
          const end = this.source.indexOf("}", this.offset + 1);
          if (end === -1) this.error("unterminated Unicode escape");
          const digits = this.source.slice(this.offset + 1, end);
          if (!/^[0-9A-Fa-f]{1,6}$/.test(digits)) this.error("invalid Unicode escape");
          const codePoint = Number.parseInt(digits, 16);
          if (codePoint > 0x10ffff) this.error("Unicode escape out of range");
          value += String.fromCodePoint(codePoint);
          this.offset = end + 1;
        } else {
          const digits = this.source.slice(this.offset, this.offset + 4);
          if (!/^[0-9A-Fa-f]{4}$/.test(digits)) this.error("invalid Unicode escape");
          value += String.fromCharCode(Number.parseInt(digits, 16));
          this.offset += 4;
        }
      } else if (escape === "\n") {
        // JavaScript line continuation contributes no character.
      } else if (escape === "\r") {
        if (this.source[this.offset] === "\n") this.offset += 1;
      } else if (/[1-9]/.test(escape)) {
        this.error("legacy octal escapes are unsupported");
      } else {
        value += escape;
      }
    }
    this.error("unterminated string");
  }

  parseNumber() {
    const match = this.source
      .slice(this.offset)
      .match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[Ee][+-]?[0-9]+)?/);
    if (!match) this.error("invalid number");
    this.offset += match[0].length;
    return Number(match[0]);
  }

  parseIdentifier() {
    const match = this.source.slice(this.offset).match(/^[A-Za-z_$][\w$]*/);
    if (!match) this.error("expected identifier");
    this.offset += match[0].length;
    return match[0];
  }

  parseIdentifierValue() {
    const identifier = this.parseIdentifier();
    this.skipTrivia();
    if (this.source[this.offset] === "(") return this.parseCall(identifier);
    if (identifier === "true") return true;
    if (identifier === "false") return false;
    if (identifier === "null") return null;
    this.error(`unsupported identifier ${identifier}`);
  }

  parseArray() {
    this.expect("[");
    const values = [];
    this.skipTrivia();
    if (this.source[this.offset] === "]") {
      this.offset += 1;
      return values;
    }
    while (true) {
      values.push(this.parseValue());
      this.skipTrivia();
      if (this.source[this.offset] === "]") {
        this.offset += 1;
        return values;
      }
      this.expect(",");
      this.skipTrivia();
      if (this.source[this.offset] === "]") {
        this.offset += 1;
        return values;
      }
    }
  }

  parseObject() {
    this.expect("{");
    const value = Object.create(null);
    this.skipTrivia();
    if (this.source[this.offset] === "}") {
      this.offset += 1;
      return value;
    }
    while (true) {
      this.skipTrivia();
      const key =
        this.source[this.offset] === '"' || this.source[this.offset] === "'"
          ? this.parseString()
          : this.parseIdentifier();
      if (Object.hasOwn(value, key)) this.error(`duplicate object key ${key}`);
      this.expect(":");
      value[key] = this.parseValue();
      this.skipTrivia();
      if (this.source[this.offset] === "}") {
        this.offset += 1;
        return value;
      }
      this.expect(",");
      this.skipTrivia();
      if (this.source[this.offset] === "}") {
        this.offset += 1;
        return value;
      }
    }
  }

  parseCall(identifier) {
    if (identifier !== "N" && identifier !== "R") {
      this.error(`unsupported call ${identifier}()`);
    }
    this.expect("(");
    const argumentsList = [];
    this.skipTrivia();
    if (this.source[this.offset] !== ")") {
      while (true) {
        argumentsList.push(this.parseValue());
        this.skipTrivia();
        if (this.source[this.offset] === ")") break;
        this.expect(",");
      }
    }
    this.expect(")");

    if (identifier === "R") {
      return {
        [STATIC_CALL]: "R",
        __argumentCount: argumentsList.length,
        target: argumentsList[0],
        label: argumentsList[1],
      };
    }
    return {
      [STATIC_CALL]: "N",
      __argumentCount: argumentsList.length,
      id: argumentsList[0],
      path: argumentsList[2],
      routes: argumentsList[9] ?? [],
    };
  }
}

function parseDeclaration(source, name, file) {
  const pattern = new RegExp(`\\bconst\\s+${name}\\s*=`, "g");
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1) {
    fail(`${file}: expected exactly one static ${name} declaration`);
  }
  const parser = new StaticLiteralParser(
    source,
    matches[0].index + matches[0][0].length,
    file,
  );
  const value = parser.parseValue();
  parser.skipTrivia();
  if (parser.source[parser.offset] !== ";") {
    fail(`${file}: static ${name} declaration must end after its literal value`);
  }
  return value;
}

function extractRichSnapshot(scripts, file) {
  const candidates = scripts.filter((source) =>
    /\bconst\s+structuralIndex\s*=/.test(source),
  );
  if (candidates.length !== 1) {
    fail(`${file}: expected exactly one rich Project Map snapshot`);
  }

  const source = candidates[0];
  const marker = source.search(/\bconst\s+structuralIndex\s*=/);
  const dataSource = source.slice(0, marker);
  if (
    /\bconst\s+N\s*=/.test(source) &&
    /\bconst\s+R\s*=/.test(source) &&
    /\bconst\s+root\s*=/.test(source) &&
    /\bconst\s+clusters\s*=/.test(source)
  ) {
    const root = parseDeclaration(dataSource, "root", file);
    const clusters = parseDeclaration(dataSource, "clusters", file);
    if (root?.[STATIC_CALL] !== "N") {
      fail(`${file}: rich snapshot root must be declared with N()`);
    }
    if (!Array.isArray(clusters)) {
      fail(`${file}: rich snapshot clusters must be a static array`);
    }
    for (const cluster of clusters) {
      if (!Array.isArray(cluster?.nodes)) {
        fail(`${file}: rich snapshot cluster nodes must be a static array`);
      }
      for (const node of cluster.nodes) {
        if (node?.[STATIC_CALL] !== "N") {
          fail(`${file}: rich snapshot nodes must be declared with N()`);
        }
      }
    }
    return { data: { root, clusters }, routeMode: "id-targets" };
  }
  if (/\bconst\s+PROJECT_MAP_DATA\s*=/.test(source)) {
    return {
      data: parseDeclaration(dataSource, "PROJECT_MAP_DATA", file),
      routeMode: "legacy-paths",
    };
  }
  fail(`${file}: unsupported rich Project Map snapshot declaration`);
}

function decodeHtmlCharacterReferences(html) {
  const named = new Map([
    ["amp", "&"],
    ["apos", "'"],
    ["bsol", "\\"],
    ["colon", ":"],
    ["gt", ">"],
    ["lt", "<"],
    ["num", "#"],
    ["period", "."],
    ["quest", "?"],
    ["quot", '"'],
    ["sol", "/"],
  ]);
  return html.replace(
    /&(?:#x([0-9a-f]+);?|#([0-9]+);?|([a-z][a-z0-9]+);)/gi,
    (reference, hexadecimal, decimal, entityName) => {
      if (decimal !== undefined || hexadecimal !== undefined) {
        const codePoint = Number.parseInt(decimal ?? hexadecimal, hexadecimal ? 16 : 10);
        if (!Number.isInteger(codePoint) || codePoint > 0x10ffff) return reference;
        try {
          return String.fromCodePoint(codePoint);
        } catch {
          return reference;
        }
      }
      return named.get(entityName.toLowerCase()) ?? reference;
    },
  );
}

function executableScriptSources(html) {
  return [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\btype=["']application\/json["']/i.test(match[1]))
    .map((match) => match[2]);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function staticStringValue(expression) {
  const parts = expression
    .trim()
    .replace(/^\((.*)\)$/s, "$1")
    .split("+")
    .map((part) => part.trim());
  if (parts.length === 0) return null;
  let value = "";
  for (const part of parts) {
    const match = part.match(/^(?:"([^"\\]*)"|'([^'\\]*)')$/s);
    if (!match) return null;
    value += match[1] ?? match[2];
  }
  return value;
}

function collectSimpleAliases(source, seeds) {
  const aliases = new Set(seeds);
  const declarations = [
    ...source.matchAll(
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*(?:;|,|\n|$)/g,
    ),
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const match of declarations) {
      if (aliases.has(match[2]) && !aliases.has(match[1])) {
        aliases.add(match[1]);
        changed = true;
      }
    }
  }
  return aliases;
}

function collectStaticStringBindings(source) {
  const bindings = new Map();
  for (const match of source.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\r\n]+)/g,
  )) {
    const value = staticStringValue(match[2]);
    if (value !== null) bindings.set(match[1], value);
  }
  return bindings;
}

function computedPropertyAccesses(source, objectName) {
  const pattern = new RegExp(
    `\\b${escapeRegExp(objectName)}\\s*(?:\\?\\.)?\\s*\\[\\s*([^\\]]+)\\]`,
    "g",
  );
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

function propertyExpressionValue(expression, stringBindings) {
  const literal = staticStringValue(expression);
  if (literal !== null) return literal;
  const identifier = expression.trim();
  return /^[A-Za-z_$][\w$]*$/.test(identifier)
    ? stringBindings.get(identifier) ?? null
    : null;
}

function analyzeScriptDependencies(source) {
  const labels = new Set();
  const stringBindings = collectStaticStringBindings(source);
  const globalAliases = collectSimpleAliases(source, [
    "globalThis",
    "window",
    "self",
    "top",
    "parent",
  ]);

  for (const alias of globalAliases) {
    const escaped = escapeRegExp(alias);
    if (new RegExp(`\\b${escaped}\\s*(?:\\?\\.|\\.)\\s*fetch\\b`).test(source)) {
      labels.add("fetch alias access");
    }
    for (const expression of computedPropertyAccesses(source, alias)) {
      const property = propertyExpressionValue(expression, stringBindings);
      if (property === "fetch") labels.add("computed fetch access");
      if (property === "location") labels.add("computed scripted navigation");
      if (property === "open") labels.add("scripted navigation");
    }
    const destructuring = new RegExp(
      `\\{([^{}]*)\\}\\s*=\\s*${escaped}\\b`,
      "g",
    );
    for (const match of source.matchAll(destructuring)) {
      if (
        /\bfetch\b/.test(match[1]) ||
        /["']fe["']\s*\+\s*["']tch["']/.test(match[1])
      ) {
        labels.add("destructured fetch access");
      }
      if (/\bopen\b/.test(match[1])) labels.add("destructured navigation access");
    }
    const reflectGet = new RegExp(
      `\\bReflect\\s*\\.\\s*get\\s*\\(\\s*${escaped}\\s*,\\s*([^,)]+)`,
      "g",
    );
    for (const match of source.matchAll(reflectGet)) {
      const property = propertyExpressionValue(match[1], stringBindings);
      if (property === "fetch") labels.add("reflected fetch access");
      if (property === "location" || property === "open") {
        labels.add("reflected navigation access");
      }
    }
  }

  const navigationObjects = collectSimpleAliases(source, ["location", "navigation"]);
  const navigationCallables = new Set();
  const assignments = [
    ...source.matchAll(
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*(?:\.\s*|\?\.\s*)(assign|replace|navigate)\b/g,
    ),
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const match of assignments) {
      if (navigationObjects.has(match[2]) && !navigationCallables.has(match[1])) {
        navigationCallables.add(match[1]);
        changed = true;
      }
    }
    for (const match of source.matchAll(
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*(?:;|,|\n|$)/g,
    )) {
      if (navigationCallables.has(match[2]) && !navigationCallables.has(match[1])) {
        navigationCallables.add(match[1]);
        changed = true;
      }
    }
  }
  for (const callable of navigationCallables) {
    if (new RegExp(`\\b${escapeRegExp(callable)}\\s*\\(`).test(source)) {
      labels.add("aliased scripted navigation");
    }
  }

  const imageAliases = new Set();
  for (const match of source.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+Image\s*\([^)]*\)/g,
  )) {
    imageAliases.add(match[1]);
  }
  for (const alias of imageAliases) {
    if (
      new RegExp(
        `\\b${escapeRegExp(alias)}\\s*\\.\\s*src\\s*=\\s*["']\\s*(?:https?:)?//`,
        "i",
      ).test(source)
    ) {
      labels.add("dynamic image network load");
    }
  }
  if (
    /new\s+Image\s*\([^)]*\)\s*\.\s*src\s*=\s*["']\s*(?:https?:)?\/\//i.test(
      source,
    )
  ) {
    labels.add("dynamic image network load");
  }

  return labels;
}

function assertAutonomous(html, file) {
  const decodedHtml = decodeHtmlCharacterReferences(html);
  const forbidden = [
    [/\bfetch\s*(?:\(|\.|\[)/, "fetch access"],
    [/\b(?:globalThis|window|self)\s*\[\s*["']fetch["']\s*\]/, "computed fetch access"],
    [/\b(?:globalThis|window|self)\s*\.\s*fetch\b/, "fetch alias access"],
    [/\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:fetch\b|\(\s*(?:0|void\s+0)\s*,\s*fetch\s*\))/, "fetch alias access"],
    [/\(\s*(?:0|void\s+0)\s*,\s*fetch\s*\)\s*\(/, "indirect fetch access"],
    [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
    [/\b(?:EventSource|WebSocket|WebTransport)\b/, "network socket or event stream"],
    [/\b(?:SharedWorker|Worker|importScripts)\b/, "external worker"],
    [/\bnavigator\s*(?:\.\s*sendBeacon\b|\[\s*["']sendBeacon["']\s*\])/, "sendBeacon"],
    [/\bimport\s*\(/, "dynamic import"],
    [/(?:https?|wss?):\/\//i, "external URL"],
    [/<input[^>]+type=["']file/i, "file picker"],
    [/addEventListener\(["'](?:dragover|drop)/, "drag/drop loader"],
    [/<script\b[^>]*\bsrc\s*=/i, "external script"],
    [/\bdocument\s*\.\s*createElement\s*\(\s*["'](?:script|iframe|object|embed)["']\s*\)/i, "dynamic script or resource loader"],
    [/<[a-z][^>]*\b(?:href|src|srcset|data|xlink:href|poster|action|formaction|background|cite)\s*=\s*(?:["']\s*)?(?:https?:)?\/\//i, "external resource navigation URL-bearing attribute"],
    [/<meta\b(?=[^>]*\bhttp-equiv\s*=\s*(?:["']\s*)?refresh\b)[^>]*>/i, "meta-refresh navigation"],
    [/\b(?:location|(?:window|document|top|parent|self)\s*\.\s*location)\s*(?:\.\s*(?:href|assign|replace))?\s*(?:=|\()/, "scripted navigation"],
    [/\b(?:location|(?:window|document|top|parent|self)\s*\.\s*location)\s*\[\s*["'](?:href|assign|replace)["']\s*\]\s*(?:=|\()/, "computed scripted navigation"],
    [/\blocation\s*\?\.\s*(?:assign|replace)\s*\(/, "optional-chain scripted navigation"],
    [/\b(?:top|parent|window|self|globalThis)\s*\[\s*["']location["']\s*\]\s*=/, "computed scripted navigation"],
    [/\bopen\s*\(\s*["']\s*\/\//, "scripted navigation"],
    [/\bwindow\s*\.\s*open\s*\(/, "scripted navigation"],
    [/\b(?:window\s*\.\s*)?navigation\s*\.\s*navigate\s*\(/, "scripted navigation"],
    [/<iframe\b/i, "iframe dependency"],
    [/@import\b/i, "CSS import"],
    [/url\(\s*["']?(?:https?:)?\/\//i, "external CSS URL"],
  ];
  const found = new Set(
    forbidden
      .filter(([pattern]) => pattern.test(decodedHtml))
      .map(([, label]) => label),
  );
  for (const source of executableScriptSources(decodedHtml)) {
    for (const label of analyzeScriptDependencies(source)) found.add(label);
  }
  if (found.size) {
    fail(`${file}: forbidden runtime dependency: ${[...found].join(", ")}`);
  }
}

function entryMap(root, clusters, label) {
  if (!root || typeof root !== "object") fail(`${label}: missing root`);
  if (!Array.isArray(clusters)) fail(`${label}: clusters must be an array`);

  const values = [
    { id: root.id, path: root.path, kind: "root", cluster: null },
    ...clusters.flatMap((cluster) => {
      if (!cluster || typeof cluster !== "object") {
        fail(`${label}: malformed cluster`);
      }
      if (!Array.isArray(cluster.nodes)) {
        fail(`${label}: cluster ${cluster.id ?? "<unknown>"} nodes must be an array`);
      }
      return [
        { id: cluster.id, path: null, kind: "cluster", cluster: null },
        ...cluster.nodes.map((node) => ({
          id: node?.id,
          path: node?.path,
          kind: "node",
          cluster: cluster.id,
        })),
      ];
    }),
  ];
  const result = new Map();
  for (const entry of values) {
    const { id } = entry;
    if (typeof id !== "string" || id.length === 0) fail(`${label}: empty ID`);
    if (result.has(id)) fail(`${label}: duplicate ID ${id}`);
    if (
      entry.kind !== "cluster" &&
      (typeof entry.path !== "string" || entry.path.length === 0)
    ) {
      fail(`${label}: empty path for ${id}`);
    }
    result.set(id, entry);
  }
  return result;
}

function compareRepresentations(representations) {
  const ids = new Set(
    representations.flatMap(([, values]) => [...values.keys()]),
  );
  for (const id of ids) {
    const missing = representations
      .filter(([, values]) => !values.has(id))
      .map(([label]) => label);
    if (missing.length) {
      fail(`three-way parity: ID ${id} missing from ${missing.join(", ")}`);
    }

    for (const field of ["kind", "cluster", "path"]) {
      const values = representations.map(([label, entriesById]) => [
        label,
        entriesById.get(id)[field],
      ]);
      if (values.some(([, value]) => value !== values[0][1])) {
        fail(
          `three-way parity: ${field} mismatch for ${id}: ${values
            .map(([label, value]) => `${label}=${JSON.stringify(value)}`)
            .join(", ")}`,
        );
      }
    }
  }
  return ids;
}

function isSafeRelativePath(value) {
  if (typeof value !== "string" || value.length === 0) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("/") || value.startsWith("\\")) return false;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return false;
  if (/%(?:25)*(?:2e|2f|5c|00)/i.test(value)) return false;
  return !value.split("#", 1)[0].split("?", 1)[0].split("/").includes("..");
}

function repositoryPathPart(value) {
  return value
    .split("#", 1)[0]
    .split("?", 1)[0]
    .replace(/\/+$/, "");
}

function realPath(value, label) {
  try {
    return fs.realpathSync.native(value);
  } catch (error) {
    fail(`${label}: cannot resolve realpath (${error.code ?? error.message})`);
  }
}

function isWithinRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`))
  );
}

function validateRepositoryPath(repoRoot, sourcePath, label) {
  const relativePath = repositoryPathPart(sourcePath);
  const rootRealPath = realPath(repoRoot, "repository root");
  let candidate = repoRoot;

  for (const component of relativePath.split("/")) {
    if (component === "" || component === ".") continue;
    let names;
    try {
      names = fs.readdirSync(candidate);
    } catch (error) {
      fail(
        `${label}: missing repository path ${sourcePath} (${error.code ?? error.message})`,
      );
    }
    if (!names.includes(component)) {
      const foldedMatches = names.filter(
        (name) => name.toLowerCase() === component.toLowerCase(),
      );
      if (foldedMatches.length > 0) {
        fail(
          `${label}: repository path case mismatch at ${component}; actual ${foldedMatches.join(", ")} in ${sourcePath}`,
        );
      }
      fail(`${label}: missing repository path ${sourcePath}`);
    }
    candidate = path.join(candidate, component);
    const componentRealPath = realPath(
      candidate,
      `${label}: repository path ${sourcePath}`,
    );
    if (!isWithinRoot(rootRealPath, componentRealPath)) {
      fail(
        `${label}: repository path ${sourcePath} escapes the supplied repository root through a symlink, junction, or reparse point`,
      );
    }
  }

  const candidateRealPath = realPath(candidate, `${label}: repository path ${sourcePath}`);
  if (!isWithinRoot(rootRealPath, candidateRealPath)) {
    fail(
      `${label}: repository path ${sourcePath} escapes the supplied repository root through a symlink, junction, or reparse point`,
    );
  }
}

function validateRoutes(snapshot, ids, routeMode, repoRoot = null) {
  const nodes = [snapshot.root, ...snapshot.clusters.flatMap((cluster) => cluster.nodes)];
  for (const node of nodes) {
    const routes = node.routes ?? [];
    if (!Array.isArray(routes)) {
      fail(`rich snapshot: routes for ${node.id} must be an array`);
    }
    for (const route of routes) {
      if (routeMode === "id-targets" && route?.[STATIC_CALL] !== "R") {
        fail(`rich snapshot: route for ${node.id} must be an R() object`);
      }
      if (routeMode === "legacy-paths" && typeof route === "string") {
        if (!isSafeRelativePath(route)) {
          fail(`rich snapshot: unsafe path in legacy route for ${node.id}: ${route}`);
        }
        if (repoRoot !== null) {
          validateRepositoryPath(
            repoRoot,
            route,
            `rich snapshot: legacy route for ${node.id}`,
          );
        }
        continue;
      }
      if (!route || typeof route !== "object") {
        fail(`rich snapshot: route for ${node.id} must be an object`);
      }
      if (
        (routeMode === "id-targets" && route.__argumentCount !== 2) ||
        typeof route.target !== "string" ||
        route.target.length === 0 ||
        typeof route.label !== "string" ||
        route.label.length === 0
      ) {
        fail(`rich snapshot: route for ${node.id} has invalid R() shape`);
      }
      if (!ids.has(route.target)) {
        fail(`rich snapshot: route ${node.id} -> ${route.target} has no target`);
      }
    }
  }
}

function validatePaths(companion, repoRoot) {
  const nodes = [
    companion.repo.root,
    ...companion.clusters.flatMap((cluster) => cluster.nodes),
  ];
  for (const node of nodes) {
    for (const sourcePath of [node.path, ...(node.relatedPaths || [])]) {
      if (!isSafeRelativePath(sourcePath)) fail(`${node.id}: unsafe path ${sourcePath}`);
      validateRepositoryPath(repoRoot, sourcePath, node.id);
    }
  }
}

const [htmlArgument, jsonArgument, rootArgument] = process.argv.slice(2);
if (!htmlArgument || !jsonArgument) {
  fail("usage: node validate-project-map.mjs <map.html> <map.json> [repository-root]");
}

const htmlFile = path.resolve(htmlArgument);
const jsonFile = path.resolve(jsonArgument);
const html = fs.readFileSync(htmlFile, "utf8");
const companion = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
assertAutonomous(html, htmlFile);
const scripts = extractScripts(html, htmlFile);
const index = extractIndex(html, htmlFile);
const { data: rich, routeMode } = extractRichSnapshot(scripts, htmlFile);
const machine = entryMap(companion.repo?.root, companion.clusters, "JSON companion");
const embedded = entryMap(index.root, index.clusters, "project-map-index");
const interactive = entryMap(rich.root, rich.clusters, "rich snapshot");
const ids = compareRepresentations([
  ["JSON companion", machine],
  ["project-map-index", embedded],
  ["rich snapshot", interactive],
]);
const repositoryRoot = rootArgument ? path.resolve(rootArgument) : null;
validateRoutes(rich, ids, routeMode, repositoryRoot);
if (repositoryRoot) validatePaths(companion, repositoryRoot);

console.log(
  `Project Map PASS: ${ids.size} IDs in three-way parity; ${scripts.length} script(s) parse; static offline-dependency checks pass${rootArgument ? "; paths exist" : ""}.`,
);
