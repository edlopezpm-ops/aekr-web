#!/usr/bin/env node

import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const VALIDATOR_ID = "AEKR_GENERATED_PROJECT_F1_A";
export const VALIDATOR_VERSION = 7;
export const VALIDATOR_PROJECTION_SHA256 =
  "8B0D1CB0982E3AF2EF668DEE21204B3F5282E54A1CBD98407D28A23E787C1B98";
export const DOCUMENT_ROLE = "DOWNSTREAM_ENGINEERING_CONSTITUTION";
export const TEMPLATE_ID = "AEKR_ENGINEERING_CONSTITUTION";
export const TEMPLATE_VERSION = 11;
export const TEMPLATE_SHA256 =
  "A346BC9A1EABCB3F6CA2B916CFC35683C59B5BDD36C2F1B42090DE6EFF71311A";
const PROJECT_MAP_VALIDATOR_SHA256 =
  "729F473D39A45EE1B28E3B0DC46DA1B2F2663DCBE1C1CEC580835A3DB67F586B";

const MANIFEST_NAME = "aekr-scaffold.json";
const PROFILE_LEAN = "LEAN";
const PROFILE_FULL = "FULL_HIGH_RISK";
const MODE0 = "MODE0";
const MODE1 = "MODE1";
const SWITCH_TABLE_START = "<!-- AEKR_SWITCH_TABLE_START -->";
const SWITCH_TABLE_END = "<!-- AEKR_SWITCH_TABLE_END -->";
const TOOL_ENTRY_NAMES = new Set(["AGENTS.md", "CLAUDE.md", "CODEX.md"]);
const REQUIRED_BASE_SWITCHES = [
  "OPERATING_ROUTE_LOCAL",
  "OPERATING_ROUTE_VENDOR",
  "GOVERNANCE_FULL",
  "INDEPENDENT_AUDIT",
  "PROJECT_MAP",
  "AEKR_BRANDING",
  "SCHEDULED_CHECKINS",
  "ORCHESTRATOR_MODE1",
  "MODE2_PROPOSAL_API",
  "REAL_PROVIDER_EXECUTION",
  "ADAPTER_MOCK",
  "ADAPTER_CODEX",
  "ADAPTER_CLAUDE_CODE",
  "CODEX_CUSTOM_CA_FORWARDING",
  "PROVIDER_WORKSPACE_WRITE",
  "CODEX_NON_GIT_EXECUTION",
  "CLAUDE_BASH_TOOLS",
  "USD_BUDGET_CEILING",
  "HUMAN_FINAL_AUTHORITY",
  "GATE_TABLE_HUMAN_ONLY",
  "INDEPENDENT_AUDIT_CONTEXT",
  "SECRET_HANDLING_CONTROLS",
  "BILLING_CONTROLS",
  "NO_PROVIDER_FALLBACK",
  "CONTROL_PLANE_ISOLATION",
  "SESSION_DEADLINES",
  "ITERATION_INVOCATION_CAPS",
  "AUTOMATIC_SHARED_HISTORY",
  "AUTOMATIC_DEPLOYMENT",
  "AUTOMATIC_DESTRUCTIVE_ACTION",
  "AUTOMATIC_PHASE_EXPANSION",
  "NARROW_POC",
  "VOLUME_TEST_PLAN",
  "UAT",
  "MODE2_PERSISTENT_RUNNER",
];
const BASE_SWITCH_SCHEMA_SHA256 =
  "797A1E6CC210E7DC5F0E8F78337BE37E06014E7492A5A915C9906F26C60995FA";
const SWITCH_TABLE_HEADER = [
  "Switch ID",
  "State",
  "Class",
  "Dependency / selection",
  "ON route",
  "OFF route",
  "Critical references",
];
const KNOWN_SWITCH_CLASSES = new Set([
  "Routing",
  "Guarded",
  "External",
  "Runtime-enforced",
  "Reserved",
]);
const REQUIRED_BASE_CLASSES = new Map([
  ...[
    "OPERATING_ROUTE_LOCAL",
    "OPERATING_ROUTE_VENDOR",
    "GOVERNANCE_FULL",
    "PROJECT_MAP",
    "AEKR_BRANDING",
    "MODE2_PROPOSAL_API",
    "NARROW_POC",
    "VOLUME_TEST_PLAN",
    "UAT",
  ].map((switchId) => [switchId, "Routing"]),
  ...["INDEPENDENT_AUDIT", "HUMAN_FINAL_AUTHORITY"].map((switchId) => [
    switchId,
    "Guarded",
  ]),
  ["SCHEDULED_CHECKINS", "External"],
  ...[
    "ORCHESTRATOR_MODE1",
    "REAL_PROVIDER_EXECUTION",
    "ADAPTER_MOCK",
    "ADAPTER_CODEX",
    "ADAPTER_CLAUDE_CODE",
    "CODEX_CUSTOM_CA_FORWARDING",
    "PROVIDER_WORKSPACE_WRITE",
    "CODEX_NON_GIT_EXECUTION",
    "CLAUDE_BASH_TOOLS",
    "USD_BUDGET_CEILING",
    "GATE_TABLE_HUMAN_ONLY",
    "INDEPENDENT_AUDIT_CONTEXT",
    "SECRET_HANDLING_CONTROLS",
    "BILLING_CONTROLS",
    "NO_PROVIDER_FALLBACK",
    "CONTROL_PLANE_ISOLATION",
    "SESSION_DEADLINES",
    "ITERATION_INVOCATION_CAPS",
    "AUTOMATIC_SHARED_HISTORY",
    "AUTOMATIC_DEPLOYMENT",
    "AUTOMATIC_DESTRUCTIVE_ACTION",
    "AUTOMATIC_PHASE_EXPANSION",
  ].map((switchId) => [switchId, "Runtime-enforced"]),
  ["MODE2_PERSISTENT_RUNNER", "Reserved"],
]);
const MODE0_RUNTIME_SWITCHES = [...REQUIRED_BASE_CLASSES]
  .filter(([, switchClass]) => switchClass === "Runtime-enforced")
  .map(([switchId]) => switchId);
const MODE1_RUNTIME_PROJECTIONS = new Map([
  [
    "ORCHESTRATOR_MODE1",
    ["runtime/cli.py", "runtime/git_coordination.py", "runtime/switchboard.py"],
  ],
  ["REAL_PROVIDER_EXECUTION", ["runtime/cli.py", "runtime/switchboard.py"]],
  ["ADAPTER_MOCK", ["runtime/adapters/registry.py"]],
  ["ADAPTER_CODEX", ["runtime/adapters/registry.py"]],
  ["ADAPTER_CLAUDE_CODE", ["runtime/adapters/registry.py"]],
  ["CODEX_CUSTOM_CA_FORWARDING", ["runtime/cli.py", "runtime/switchboard.py"]],
  ["PROVIDER_WORKSPACE_WRITE", ["runtime/cli.py", "runtime/switchboard.py"]],
  ["CODEX_NON_GIT_EXECUTION", ["runtime/cli.py", "runtime/switchboard.py"]],
  ["CLAUDE_BASH_TOOLS", ["runtime/cli.py", "runtime/switchboard.py"]],
  ["USD_BUDGET_CEILING", ["runtime/cli.py", "runtime/gates.py"]],
  ["GATE_TABLE_HUMAN_ONLY", ["runtime/gates.py", "runtime/switchboard.py"]],
  ["INDEPENDENT_AUDIT_CONTEXT", ["runtime/cli.py", "runtime/adapters/base.py"]],
  ["SECRET_HANDLING_CONTROLS", ["runtime/cli.py", "runtime/switchboard.py"]],
  ["BILLING_CONTROLS", ["runtime/cli.py", "runtime/switchboard.py"]],
  ["NO_PROVIDER_FALLBACK", ["runtime/cli.py", "runtime/switchboard.py"]],
  ["CONTROL_PLANE_ISOLATION", ["runtime/cli.py", "runtime/switchboard.py"]],
  ["SESSION_DEADLINES", ["runtime/cli.py", "runtime/switchboard.py"]],
  ["ITERATION_INVOCATION_CAPS", ["runtime/cli.py", "runtime/gates.py"]],
  ["AUTOMATIC_SHARED_HISTORY", ["runtime/gates.py", "runtime/switchboard.py"]],
  ["AUTOMATIC_DEPLOYMENT", ["runtime/gates.py", "runtime/switchboard.py"]],
  ["AUTOMATIC_DESTRUCTIVE_ACTION", ["runtime/gates.py", "runtime/switchboard.py"]],
  ["AUTOMATIC_PHASE_EXPANSION", ["runtime/gates.py", "runtime/switchboard.py"]],
]);
const NON_RUNTIME_PROJECTIONS = new Map([
  ["OPERATING_ROUTE_LOCAL", { kind: "tool-entry" }],
  ["OPERATING_ROUTE_VENDOR", { kind: "tool-entry" }],
  ["GOVERNANCE_FULL", { kind: "full-profile" }],
  ["INDEPENDENT_AUDIT", { kind: "path", path: "docs/delivery/audit-checklist.md" }],
  ["PROJECT_MAP", { kind: "project-map" }],
  ["AEKR_BRANDING", { kind: "branding" }],
  ["SCHEDULED_CHECKINS", { kind: "path", path: "docs/delivery/scheduled-checkins.md" }],
  ["MODE2_PROPOSAL_API", { kind: "mode1-path", path: "toolkit/orchestrator/runtime/orchestrator_client.py" }],
  ["HUMAN_FINAL_AUTHORITY", { kind: "tool-entry" }],
  ["NARROW_POC", { kind: "path", path: "docs/product/discovery.md" }],
  ["VOLUME_TEST_PLAN", { kind: "path", path: "docs/delivery/definition-of-done.md" }],
  ["UAT", { kind: "path", path: "docs/delivery/definition-of-done.md" }],
  ["MODE2_PERSISTENT_RUNNER", { kind: "reserved-off" }],
]);
const FULL_PROFILE_PATHS = [
  "docs/master.md",
  "docs/delivery/orchestration-loop.md",
  "docs/delivery/definition-of-done.md",
  "docs/delivery/audit-checklist.md",
  "docs/product/discovery.md",
  "PROJECT_MAP.html",
  "PROJECT_MAP.md",
  "project-map.json",
  "tools/aekr/validate-project-map.mjs",
];
const PROJECT_MAP_PATHS = [
  "PROJECT_MAP.html",
  "PROJECT_MAP.md",
  "project-map.json",
  "tools/aekr/validate-project-map.mjs",
];
const MODE1_REQUIRED_FILES = [
  "mode1-seed-manifest.json",
  "README.md",
  "ARCHITECTURE.md",
  "GATE_MODEL.md",
  "orchestrator.ps1",
  "requirements.txt",
  "requirements-dev.txt",
  "pytest.ini",
  "config/orchestrator.config.example.yaml",
  "config/orchestrator.config.codex.example.yaml",
  "config/orchestrator.config.claude-code.example.yaml",
  "packet_protocol/README.md",
  "packet_protocol/__init__.py",
  "packet_protocol/protocol.py",
  "packet_protocol/validate.py",
  "packet_protocol/validation_evidence.py",
  "packet_protocol/schemas/work-packet.schema.json",
  "packet_protocol/schemas/result-packet.schema.json",
  "packet_protocol/schemas/output-manifest.schema.json",
  "packet_protocol/schemas/required-child-declaration.schema.json",
  "packet_protocol/schemas/validation-receipt.schema.json",
  "runtime/__init__.py",
  "runtime/budget.py",
  "runtime/cli.py",
  "runtime/git_coordination.py",
  "runtime/packet_integration.py",
  "runtime/events.py",
  "runtime/gates.py",
  "runtime/metrics.py",
  "runtime/orchestrator_client.py",
  "runtime/state.py",
  "runtime/switchboard.py",
  "runtime/adapters/__init__.py",
  "runtime/adapters/base.py",
  "runtime/adapters/claude_code.py",
  "runtime/adapters/codex.py",
  "runtime/adapters/mock.py",
  "runtime/adapters/registry.py",
  "tests/portable/test_seed_bundle.py",
];
const MODE1_REQUIRED_DIRECTORIES = [];
const MODE1_EXCLUDED_SOURCE_ONLY_PATHS = [
  "demos",
  "packet_protocol/fixtures",
  "packet_protocol/tests",
];
const MODE1_FORBIDDEN_SEED_PATHS = [
  "demos",
  "packet_protocol/fixtures",
  "packet_protocol/tests",
  "config/orchestrator.config.yaml",
];
const MODE1_PORTABLE_TEST_ROOT = "tests/portable";
const MODE1_EVIDENCE_POSTURE = "INHERITED_UNTESTED_UNTIL_LOCAL_RUN";
const BRANDING_BANNER_SHA256 =
  "81A60D8E3D28B2E0934CECD22C703AF20E2BDDD164F68A0888193647C1B816FC";
const BRANDING_LICENSE_SHA256 =
  "FA138A953A6C531E43113361F013DDBF4D3B203C72E04F27DC7A8DCB6A9A3F1C";
const BRANDING_FOOTER_SENTENCE =
  "Built with the **AI Engineering Knowledge Racking (AEKR)** workflow.";
const BRANDING_FOOTER_IMAGE = "![Build with AEKR](assets/aekr-banner.png)";
const BRANDING_FOOTER = `---\n\n${BRANDING_FOOTER_SENTENCE}\n\n${BRANDING_FOOTER_IMAGE}`;
const BRANDING_EXCEPTION =
  /<!-- AEKR-BRANDING-EXCEPTION: ([^<>\r\n]{8,240}) -->/g;
const MODE1_MANIFEST_SHA256 =
  "C800CC3E3ABBD1A1FC220869577E3812A0B98377D84DF2B9C0216DF980F1AE8C";
const MODE1_ADAPTER_CONTRACTS = [
  {
    switch_id: "ADAPTER_MOCK",
    kind: "mock",
    implementation: "runtime/adapters/mock.py",
    real_provider: false,
    workspace_write_capable: false,
  },
  {
    switch_id: "ADAPTER_CODEX",
    kind: "codex",
    implementation: "runtime/adapters/codex.py",
    real_provider: true,
    workspace_write_capable: true,
  },
  {
    switch_id: "ADAPTER_CLAUDE_CODE",
    kind: "claude_code",
    implementation: "runtime/adapters/claude_code.py",
    real_provider: true,
    workspace_write_capable: true,
  },
];
const MODE1_CONFIG_FILES = new Set(
  MODE1_REQUIRED_FILES.filter((item) => item.startsWith("config/")).map((item) =>
    path.posix.basename(item),
  ),
);
const ADAPTER_IMPLEMENTATIONS = new Map([
  ...MODE1_ADAPTER_CONTRACTS.map((contract) => [
    contract.switch_id,
    [contract.kind, contract.implementation],
  ]),
]);
const TEXT_EXTENSIONS = new Set([
  ".c",
  ".cc",
  ".cfg",
  ".conf",
  ".cpp",
  ".css",
  ".cs",
  ".go",
  ".html",
  ".ini",
  ".java",
  ".js",
  ".json",
  ".jsx",
  ".kt",
  ".kts",
  ".md",
  ".mjs",
  ".php",
  ".ps1",
  ".py",
  ".rb",
  ".rst",
  ".scala",
  ".rs",
  ".sh",
  ".sql",
  ".svelte",
  ".svg",
  ".swift",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".vue",
  ".xml",
  ".yaml",
  ".yml",
]);
const TEXT_BASENAMES = new Set([
  "dockerfile",
  "gnumakefile",
  "jenkinsfile",
  "justfile",
  "makefile",
  "procfile",
]);
const MARKUP_EXTENSIONS = new Set([".html", ".md", ".svg", ".xml"]);
const BINARY_EXTENSIONS = new Set([
  ".7z",
  ".avif",
  ".bin",
  ".bmp",
  ".bz2",
  ".class",
  ".dll",
  ".doc",
  ".docx",
  ".eot",
  ".exe",
  ".gif",
  ".gz",
  ".ico",
  ".jar",
  ".jpeg",
  ".jpg",
  ".mp3",
  ".mp4",
  ".otf",
  ".pdf",
  ".png",
  ".pyc",
  ".tar",
  ".ttf",
  ".wasm",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
  ".xls",
  ".xlsx",
  ".zip",
]);
const EXCLUDED_SCAN_DIRECTORIES = new Set([
  ".git",
  ".pytest_cache",
  "__pycache__",
  "node_modules",
]);
const CONDITIONAL_MARKER =
  /<!-- AEKR-CONDITIONAL-REFERENCE switch=([A-Z][A-Z0-9_]{1,63}) state=(ON|OFF) target=([A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+) -->/g;
const PARENT_PATH =
  /(?<![A-Za-z0-9_.\/\\])((?:\.\/)*(?:toolkit|meta|future_projects|(?:0[0-9]|1[0-9]|2[0-4])_[A-Za-z0-9_-]+)\/[@A-Za-z0-9_.-]+(?:\/[@A-Za-z0-9_.-]+)*)/gi;
const PARENT_WINDOWS_PATH =
  /(?<![A-Za-z0-9_.\/\\])((?:toolkit|meta|future_projects|(?:0[0-9]|1[0-9]|2[0-4])_[A-Za-z0-9_-]+)\\[A-Za-z0-9_.-]+(?:\\[A-Za-z0-9_.-]+)*)/gi;
const RELATIVE_PARENT_PATH =
  /(?<![A-Za-z0-9_.\/\\])((?:\.\.[\\/])+(?:[A-Za-z0-9_. -]+(?:[\\/][A-Za-z0-9_. -]+)*))/g;
const INTERNAL_TRAVERSAL_PATH =
  /(?<![A-Za-z0-9_.\/\\])([A-Za-z0-9_.-]+(?:[\\/][A-Za-z0-9_.-]+)*[\\/]\.\.[\\/](?:[A-Za-z0-9_.-]+(?:[\\/][A-Za-z0-9_.-]+)*)?)/g;
const MARKDOWN_REFERENCE_DEFINITION =
  /^\s{0,3}\[[^\]]+\]:\s*(<[^>]+>|[^\s]+)(?:\s+.*)?$/;
const HTML_REFERENCE =
  /(?:^|\s)(action|data|formaction|href|poster|src|srcset|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
const ABSOLUTE_POSIX_PATH =
  /(?<![A-Za-z0-9_.\/\\])(\/(?!\/)[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*)/g;
const POSIX_ROOT_NAMES = new Set([
  "bin",
  "boot",
  "dev",
  "etc",
  "home",
  "opt",
  "proc",
  "root",
  "run",
  "sbin",
  "srv",
  "sys",
  "tmp",
  "usr",
  "var",
]);
const ALLOWED_SLASH_COMMANDS = new Set(["/F", "/PID", "/T", "/status"]);
const CURRENT_VALIDATOR_PATH = fileURLToPath(import.meta.url);

function fail(message) {
  throw new Error(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value, label) {
  if (!isPlainObject(value)) fail(`${label} must be an object`);
  return value;
}

function requireExactValue(actual, expected, label) {
  if (actual !== expected) fail(`${label} must be ${JSON.stringify(expected)}`);
}

function requireExactArray(actual, expected, label) {
  if (
    !Array.isArray(actual) ||
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    fail(`${label} must match the canonical Mode 1 manifest`);
  }
}

function requireExactKeys(value, expected, label) {
  const actual = Object.keys(requireObject(value, label)).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} must contain exactly: ${wanted.join(", ")}`);
  }
}

function requireExactJson(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} must match the canonical contract`);
  }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex").toUpperCase();
}

function canonicalTextBuffer(buffer) {
  return Buffer.from(buffer.toString("utf8").replace(/\r\n?/g, "\n"), "utf8");
}

function sha256CanonicalText(buffer) {
  return sha256(canonicalTextBuffer(buffer));
}

function validatorProjection(buffer) {
  const canonical = canonicalTextBuffer(buffer).toString("utf8");
  const pattern =
    /(export const VALIDATOR_PROJECTION_SHA256 =\s*\n\s*")[A-F0-9]{64}(";)/;
  const projected = canonical.replace(pattern, `$1${"0".repeat(64)}$2`);
  if (projected === canonical) {
    fail("generated-project validator projection marker is malformed");
  }
  return Buffer.from(projected, "utf8");
}

function validateExecutingValidatorIntegrity() {
  const source = fs.readFileSync(CURRENT_VALIDATOR_PATH);
  if (sha256(validatorProjection(source)) !== VALIDATOR_PROJECTION_SHA256) {
    fail("generated-project validator projection integrity mismatch");
  }
}

function isSafeRelativePath(value) {
  if (typeof value !== "string" || value.length === 0) return false;
  if (
    value.includes("\\") ||
    value.split("/").some((segment) => segment.includes(":")) ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return false;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || /^[a-z]:/i.test(value)) return false;
  if (value.startsWith("/") || value.startsWith("//")) return false;
  const segments = value.split("/");
  return !segments.some(
    (segment) => segment === "" || segment === "." || segment === "..",
  );
}

function requireSafeRelativePath(value, label) {
  if (!isSafeRelativePath(value)) {
    fail(`${label} is an unsafe relative path: ${JSON.stringify(value)}`);
  }
  if (/REPLACE_WITH/i.test(value)) fail(`${label} still contains a placeholder`);
  return value;
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

function resolveContained(
  root,
  relativePath,
  { required = true, expectedType = null } = {},
) {
  requireSafeRelativePath(relativePath, "repository path");
  const resolved = path.resolve(root, ...relativePath.split("/"));
  if (!isWithin(root, resolved)) fail(`repository path escapes root: ${relativePath}`);

  let current = root;
  for (const segment of relativePath.split("/")) {
    if (fs.existsSync(current) && fs.lstatSync(current).isDirectory()) {
      const entries = fs.readdirSync(current);
      if (!entries.includes(segment)) {
        const caseInsensitiveMatch = entries.find(
          (entry) => entry.toLocaleLowerCase("en-US") === segment.toLocaleLowerCase("en-US"),
        );
        if (caseInsensitiveMatch !== undefined) {
          fail(
            `non-portable repository path casing: expected ${caseInsensitiveMatch}, received ${segment} in ${relativePath}`,
          );
        }
      }
    }
    current = path.join(current, segment);
    if (!fs.existsSync(current)) break;
    const metadata = fs.lstatSync(current);
    if (metadata.isSymbolicLink()) fail(`repository path uses a symlink: ${relativePath}`);
    const real = fs.realpathSync(current);
    if (!isWithin(fs.realpathSync(root), real)) {
      fail(`repository path resolves outside root: ${relativePath}`);
    }
  }
  if (required && !fs.existsSync(resolved)) fail(`missing repository path ${relativePath}`);
  if (fs.existsSync(resolved) && expectedType !== null) {
    const metadata = fs.lstatSync(resolved);
    if (expectedType === "file" && !metadata.isFile()) {
      fail(`${relativePath} must be a regular file`);
    }
    if (expectedType === "directory" && !metadata.isDirectory()) {
      fail(`${relativePath} must be a directory`);
    }
  }
  return resolved;
}

function resolveRegularFile(root, relativePath) {
  return resolveContained(root, relativePath, { expectedType: "file" });
}

function resolveDirectory(root, relativePath) {
  return resolveContained(root, relativePath, { expectedType: "directory" });
}

function readJson(file, label) {
  const text = fs.readFileSync(file, "utf8");
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
  let index = 0;
  const skipWhitespace = () => {
    while (index < text.length && /\s/.test(text[index])) index += 1;
  };
  const parseString = () => {
    const start = index;
    index += 1;
    while (index < text.length) {
      if (text[index] === "\\") {
        index += 2;
      } else if (text[index] === '"') {
        index += 1;
        break;
      } else {
        index += 1;
      }
    }
    return JSON.parse(text.slice(start, index));
  };
  const parseValue = () => {
    skipWhitespace();
    if (text[index] === "{") {
      index += 1;
      const keys = new Set();
      skipWhitespace();
      if (text[index] === "}") {
        index += 1;
        return;
      }
      while (index < text.length) {
        skipWhitespace();
        const key = parseString();
        if (keys.has(key)) fail(`${label} contains duplicate JSON key ${key}`);
        keys.add(key);
        skipWhitespace();
        index += 1;
        parseValue();
        skipWhitespace();
        if (text[index] === ",") {
          index += 1;
          continue;
        }
        index += 1;
        return;
      }
    }
    if (text[index] === "[") {
      index += 1;
      skipWhitespace();
      if (text[index] === "]") {
        index += 1;
        return;
      }
      while (index < text.length) {
        parseValue();
        skipWhitespace();
        if (text[index] === ",") {
          index += 1;
          continue;
        }
        index += 1;
        return;
      }
    }
    if (text[index] === '"') {
      parseString();
      return;
    }
    while (index < text.length && !/[,\]}]/.test(text[index])) index += 1;
  };
  parseValue();
  return value;
}

function readManifest(root) {
  const manifestPath = path.join(root, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) fail(`missing ${MANIFEST_NAME}`);
  const manifest = requireObject(readJson(manifestPath, MANIFEST_NAME), MANIFEST_NAME);
  requireExactKeys(
    manifest,
    [
      "schema_version",
      "governance_profile",
      "execution_mode",
      "tool_entry",
      "local_validators",
      "inheritance",
      "switch_capability_parity",
    ],
    MANIFEST_NAME,
  );
  requireExactValue(manifest.schema_version, 2, "schema_version");
  if (![PROFILE_LEAN, PROFILE_FULL].includes(manifest.governance_profile)) {
    fail("governance_profile must be LEAN or FULL_HIGH_RISK");
  }
  if (![MODE0, MODE1].includes(manifest.execution_mode)) {
    fail("execution_mode must be MODE0 or MODE1");
  }

  const toolEntry = requireObject(manifest.tool_entry, "tool_entry");
  requireExactKeys(
    toolEntry,
    [
      "document_role",
      "canonical_template_id",
      "canonical_template_version",
      "canonical_sha256",
      "paths",
    ],
    "tool_entry",
  );
  requireExactValue(toolEntry.document_role, DOCUMENT_ROLE, "tool_entry.document_role");
  requireExactValue(
    toolEntry.canonical_template_id,
    TEMPLATE_ID,
    "tool_entry.canonical_template_id",
  );
  requireExactValue(
    toolEntry.canonical_template_version,
    TEMPLATE_VERSION,
    "tool_entry.canonical_template_version",
  );
  requireExactValue(
    toolEntry.canonical_sha256,
    TEMPLATE_SHA256,
    "tool_entry.canonical_sha256",
  );
  if (!Array.isArray(toolEntry.paths) || toolEntry.paths.length === 0) {
    fail("tool_entry.paths must select at least one destination");
  }
  const entryPaths = toolEntry.paths.map((entryPath, index) => {
    requireSafeRelativePath(entryPath, `tool_entry.paths[${index}]`);
    if (path.posix.dirname(entryPath) !== "." || !TOOL_ENTRY_NAMES.has(entryPath)) {
      fail(`unsupported tool-entry destination ${entryPath}`);
    }
    return entryPath;
  });
  if (new Set(entryPaths).size !== entryPaths.length) {
    fail("tool_entry.paths contains duplicates");
  }

  const validators = requireObject(manifest.local_validators, "local_validators");
  requireExactKeys(
    validators,
    ["generated_project", "project_map"],
    "local_validators",
  );
  requireExactValue(
    validators.generated_project,
    "tools/aekr/validate-generated-project.mjs",
    "local_validators.generated_project",
  );
  const localValidatorPath = resolveRegularFile(root, validators.generated_project);
  if (
    !canonicalTextBuffer(fs.readFileSync(localValidatorPath)).equals(
      canonicalTextBuffer(fs.readFileSync(CURRENT_VALIDATOR_PATH)),
    )
  ) {
    fail("project-local generated-project validator must remain canonically identical to the executing validator");
  }
  if (
    validators.project_map !== null &&
    validators.project_map !== "tools/aekr/validate-project-map.mjs"
  ) {
    fail("local_validators.project_map must be null or the local validator path");
  }
  if (validators.project_map !== null) {
    const mapValidator = resolveRegularFile(root, validators.project_map);
    if (sha256CanonicalText(fs.readFileSync(mapValidator)) !== PROJECT_MAP_VALIDATOR_SHA256) {
      fail("project-map validator canonical digest mismatch");
    }
  }

  const inheritance = requireObject(manifest.inheritance, "inheritance");
  requireExactKeys(
    inheritance,
    ["verification_status", "source_repository_confidence_inherited"],
    "inheritance",
  );
  requireExactValue(
    inheritance.verification_status,
    "INHERITED_UNTESTED",
    "inheritance.verification_status",
  );
  requireExactValue(
    inheritance.source_repository_confidence_inherited,
    false,
    "source repository confidence inheritance",
  );
  requireExactValue(
    manifest.switch_capability_parity,
    "VALIDATOR_VERIFIED",
    "switch_capability_parity",
  );

  return { manifest, entryPaths };
}

function splitTableRow(line) {
  const stripped = line.trim();
  if (!stripped.startsWith("|") || !stripped.endsWith("|")) return null;
  return stripped.slice(1, -1).split("|").map((cell) => cell.trim());
}

function validateSwitchDependencies(states, classes) {
  if (!states.get("OPERATING_ROUTE_LOCAL") && !states.get("OPERATING_ROUTE_VENDOR")) {
    fail("MASTER_SWITCH.md requires at least one operating route ON");
  }
  if (states.get("GOVERNANCE_FULL") && !states.get("INDEPENDENT_AUDIT")) {
    fail("INDEPENDENT_AUDIT must be ON when GOVERNANCE_FULL is ON");
  }
  if (states.get("CODEX_CUSTOM_CA_FORWARDING") && !states.get("ADAPTER_CODEX")) {
    fail("CODEX_CUSTOM_CA_FORWARDING requires ADAPTER_CODEX ON");
  }
  if (states.get("CODEX_NON_GIT_EXECUTION") && !states.get("ADAPTER_CODEX")) {
    fail("CODEX_NON_GIT_EXECUTION requires ADAPTER_CODEX ON");
  }
  if (states.get("CLAUDE_BASH_TOOLS") && !states.get("ADAPTER_CLAUDE_CODE")) {
    fail("CLAUDE_BASH_TOOLS requires ADAPTER_CLAUDE_CODE ON");
  }
  if (states.get("REAL_PROVIDER_EXECUTION") && !states.get("ORCHESTRATOR_MODE1")) {
    fail("REAL_PROVIDER_EXECUTION requires ORCHESTRATOR_MODE1 ON");
  }
  if (states.get("MODE2_PROPOSAL_API") && !states.get("ORCHESTRATOR_MODE1")) {
    fail("MODE2_PROPOSAL_API requires ORCHESTRATOR_MODE1 ON");
  }
  const realAdapters = [...states].filter(
    ([switchId, enabled]) =>
      switchId.startsWith("ADAPTER_") && switchId !== "ADAPTER_MOCK" && enabled,
  );
  if (states.get("REAL_PROVIDER_EXECUTION") && realAdapters.length === 0) {
    fail("REAL_PROVIDER_EXECUTION requires at least one real adapter switch ON");
  }
  const automaticEffects = [
    "AUTOMATIC_SHARED_HISTORY",
    "AUTOMATIC_DEPLOYMENT",
    "AUTOMATIC_DESTRUCTIVE_ACTION",
    "AUTOMATIC_PHASE_EXPANSION",
  ].filter((switchId) => states.get(switchId));
  if (automaticEffects.length > 0 && states.get("GATE_TABLE_HUMAN_ONLY")) {
    fail(
      `GATE_TABLE_HUMAN_ONLY must be OFF when automatic-effect switches are ON: ${automaticEffects.join(", ")}`,
    );
  }
  const enabledReserved = [...classes]
    .filter(([switchId, switchClass]) => switchClass === "Reserved" && states.get(switchId))
    .map(([switchId]) => switchId)
    .sort();
  if (enabledReserved.length > 0) {
    fail(`reserved switches have no current ON route: ${enabledReserved.join(", ")}`);
  }
}

function validIsoCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validateInitializedSwitchboardMetadata(text) {
  const authorities = [
    ...text.matchAll(/^\*\*Authority:\*\*[ \t]+([^\r\n]+?)[ \t]*$/gm),
  ];
  if (authorities.length !== 1) {
    fail("MASTER_SWITCH.md requires exactly one initialized Authority");
  }
  const authority = authorities[0][1].trim();
  if (
    authority.length < 2 ||
    authority.length > 120 ||
    /^REPLACE_WITH_/i.test(authority)
  ) {
    fail("MASTER_SWITCH.md Authority remains an invalid placeholder");
  }

  const reviewDates = [
    ...text.matchAll(/^\*\*Last reviewed:\*\*[ \t]+([^\r\n]+?)[ \t]*$/gm),
  ];
  if (reviewDates.length !== 1 || !validIsoCalendarDate(reviewDates[0][1].trim())) {
    fail("MASTER_SWITCH.md Last reviewed must be an initialized ISO calendar date");
  }

  const initialRecords = [
    ...text.matchAll(
      /^- (\d{4}-\d{2}-\d{2}) — Initial project state selected by ([^:\r\n]+): ([^\r\n]+)\.[ \t]*$/gm,
    ),
  ];
  if (initialRecords.length !== 1) {
    fail("MASTER_SWITCH.md requires exactly one initialized initial project state record");
  }
  const [, initialDate, initialAuthority, initialReason] = initialRecords[0];
  if (
    !validIsoCalendarDate(initialDate) ||
    initialAuthority.trim() !== authority ||
    initialReason.trim().length < 8 ||
    initialReason.trim().length > 240 ||
    /REPLACE_WITH_/i.test(initialReason)
  ) {
    fail("MASTER_SWITCH.md initial project state record is not owner-initialized");
  }
}

function parseSwitchboard(root) {
  const switchPath = resolveContained(root, "MASTER_SWITCH.md");
  const switchBuffer = fs.readFileSync(switchPath);
  const switchText = switchBuffer.toString("utf8");
  validateInitializedSwitchboardMetadata(switchText);
  const lines = switchText.split(/\r?\n/);
  const starts = lines
    .map((line, index) => (line.trim() === SWITCH_TABLE_START ? index : -1))
    .filter((index) => index >= 0);
  const ends = lines
    .map((line, index) => (line.trim() === SWITCH_TABLE_END ? index : -1))
    .filter((index) => index >= 0);
  if (starts.length !== 1 || ends.length !== 1 || starts[0] >= ends[0]) {
    fail("MASTER_SWITCH.md must contain one ordered switch table");
  }
  const rows = [];
  for (const line of lines.slice(starts[0] + 1, ends[0])) {
    if (line.trim() === "") continue;
    const row = splitTableRow(line);
    if (row === null) fail("MASTER_SWITCH.md has a malformed switch row");
    rows.push(row);
  }
  if (
    rows.length < 3 ||
    rows[0].length !== SWITCH_TABLE_HEADER.length ||
    rows[0].some((cell, index) => cell !== SWITCH_TABLE_HEADER[index])
  ) {
    fail("MASTER_SWITCH.md has an invalid switch table header");
  }
  if (
    rows[1].length !== SWITCH_TABLE_HEADER.length ||
    !rows[1].every((cell) => /^:?-{3,}:?$/.test(cell))
  ) {
    fail("MASTER_SWITCH.md has an invalid table separator");
  }
  const states = new Map();
  const classes = new Map();
  const switchRows = new Map();
  for (const row of rows.slice(2)) {
    if (row.length !== 7) fail("MASTER_SWITCH.md has a malformed switch row");
    const switchId = row[0].replace(/^`|`$/g, "");
    if (!/^[A-Z][A-Z0-9_]{1,63}$/.test(switchId)) {
      fail(`MASTER_SWITCH.md has an invalid switch ID ${JSON.stringify(switchId)}`);
    }
    if (row[0] !== `\`${switchId}\``) {
      fail(`MASTER_SWITCH.md literal switch ID mismatch for ${switchId}`);
    }
    if (states.has(switchId)) fail(`MASTER_SWITCH.md duplicates ${switchId}`);
    if (!['ON', 'OFF'].includes(row[1])) fail(`invalid state for ${switchId}`);
    if (!KNOWN_SWITCH_CLASSES.has(row[2])) {
      fail(`MASTER_SWITCH.md switch ${switchId} has unknown class ${row[2]}`);
    }
    const expectedClass = REQUIRED_BASE_CLASSES.get(switchId);
    if (expectedClass !== undefined && row[2] !== expectedClass) {
      fail(`MASTER_SWITCH.md switch ${switchId} expected class ${expectedClass}`);
    }
    for (const [cellIndex, label] of [
      [3, "Dependency / selection"],
      [4, "ON route"],
      [5, "OFF route"],
      [6, "Critical references"],
    ]) {
      if (row[cellIndex] === "") {
        fail(`MASTER_SWITCH.md switch ${switchId} requires non-empty ${label}`);
      }
    }
    states.set(switchId, row[1] === "ON");
    classes.set(switchId, row[2]);
    switchRows.set(switchId, row);
  }
  for (const switchId of REQUIRED_BASE_SWITCHES) {
    if (!states.has(switchId)) fail(`MASTER_SWITCH.md is missing required base row ${switchId}`);
  }
  const observedBaseOrder = rows
    .slice(2, 2 + REQUIRED_BASE_SWITCHES.length)
    .map((row) => row[0].replace(/^`|`$/g, ""));
  const orderMismatch = REQUIRED_BASE_SWITCHES.findIndex(
    (switchId, index) => observedBaseOrder[index] !== switchId,
  );
  if (orderMismatch >= 0) {
    fail(
      `MASTER_SWITCH.md base row order digest mismatch at ${REQUIRED_BASE_SWITCHES[orderMismatch]}`,
    );
  }
  const baseSchemaProjection = REQUIRED_BASE_SWITCHES.map((switchId) => {
    const row = switchRows.get(switchId);
    return [row[0], ...row.slice(2)];
  });
  const baseSchemaDigest = sha256(
    Buffer.from(JSON.stringify(baseSchemaProjection), "utf8"),
  );
  if (baseSchemaDigest !== BASE_SWITCH_SCHEMA_SHA256) {
    fail(`MASTER_SWITCH.md base row schema digest mismatch: ${baseSchemaDigest}`);
  }
  validateSwitchDependencies(states, classes);
  return { states, classes, digest: sha256(switchBuffer) };
}

function requireSwitch(states, switchId) {
  if (!states.has(switchId)) fail(`MASTER_SWITCH.md is missing ${switchId}`);
  return states.get(switchId);
}

function validateProjectionCatalog() {
  const runtimeIds = new Set(MODE0_RUNTIME_SWITCHES);
  const projectedRuntimeIds = new Set(MODE1_RUNTIME_PROJECTIONS.keys());
  const nonRuntimeIds = new Set(
    [...REQUIRED_BASE_CLASSES]
      .filter(([, switchClass]) => switchClass !== "Runtime-enforced")
      .map(([switchId]) => switchId),
  );
  const projectedNonRuntimeIds = new Set(NON_RUNTIME_PROJECTIONS.keys());
  for (const [label, expected, observed] of [
    ["runtime", runtimeIds, projectedRuntimeIds],
    ["non-runtime", nonRuntimeIds, projectedNonRuntimeIds],
  ]) {
    const missing = [...expected].filter((switchId) => !observed.has(switchId));
    const extra = [...observed].filter((switchId) => !expected.has(switchId));
    if (missing.length > 0 || extra.length > 0) {
      fail(
        `${label} switch projection catalog mismatch; missing=${missing.join(",") || "none"}; extra=${extra.join(",") || "none"}`,
      );
    }
  }
}

function rejectUnprojectedEnabledCapabilities(states) {
  for (const [switchId, enabled] of states) {
    if (
      enabled &&
      !REQUIRED_BASE_CLASSES.has(switchId) &&
      !switchId.startsWith("ADAPTER_")
    ) {
      fail(`enabled custom capability ${switchId} has no validator projection`);
    }
  }
}

function validateMode1RuntimeProjection(root) {
  for (const [switchId, relativePaths] of MODE1_RUNTIME_PROJECTIONS) {
    let implementationNamesSwitch = false;
    for (const relativePath of relativePaths) {
      const absolute = resolveRegularFile(
        root,
        `toolkit/orchestrator/${relativePath}`,
      );
      if (fs.readFileSync(absolute, "utf8").includes(switchId)) {
        implementationNamesSwitch = true;
      }
    }
    if (!implementationNamesSwitch) {
      fail(`Mode 1 implementation projection does not consume ${switchId}`);
    }
  }
}

function validateNonRuntimeProjection(root, mode, states) {
  for (const [switchId, projection] of NON_RUNTIME_PROJECTIONS) {
    if (!requireSwitch(states, switchId)) continue;
    if (projection.kind === "path") {
      const projectedPath = resolveContained(root, projection.path, {
        required: false,
      });
      if (!fs.existsSync(projectedPath)) {
        fail(`${switchId}=ON requires ${projection.path}`);
      }
      resolveRegularFile(root, projection.path);
    } else if (projection.kind === "mode1-path") {
      if (mode !== MODE1) fail(`${switchId}=ON requires MODE1`);
      const projectedPath = resolveContained(root, projection.path, {
        required: false,
      });
      if (!fs.existsSync(projectedPath)) {
        fail(`${switchId}=ON requires ${projection.path}`);
      }
      const implementation = resolveRegularFile(root, projection.path);
      if (!fs.readFileSync(implementation, "utf8").includes(switchId)) {
        fail(`${switchId} implementation projection does not consume the switch`);
      }
    } else if (projection.kind === "full-profile") {
      // validateProfile enforces the bidirectional profile/state relationship.
    } else if (
      !["tool-entry", "project-map", "branding", "reserved-off"].includes(
        projection.kind,
      )
    ) {
      fail(`unsupported projection kind for ${switchId}: ${projection.kind}`);
    }
  }
}

function validateProjectMapSemantics(root) {
  const validator = resolveRegularFile(
    root,
    "tools/aekr/validate-project-map.mjs",
  );
  const html = resolveRegularFile(root, "PROJECT_MAP.html");
  const companion = resolveRegularFile(root, "project-map.json");
  const result = spawnSync(
    process.execPath,
    [validator, html, companion, root],
    {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (result.error !== undefined) {
    fail(`Project Map semantic validation could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const evidence = [result.stderr, result.stdout]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(" | ");
    fail(`Project Map semantic/autonomy validation failed${evidence ? `: ${evidence}` : ""}`);
  }
  if (!/Project Map PASS:/.test(result.stdout ?? "")) {
    fail("Project Map semantic validator returned no canonical PASS evidence");
  }
}

function validateProfile(root, manifest, states) {
  const profile = manifest.governance_profile;
  if (profile === PROFILE_FULL) {
    for (const switchId of ["GOVERNANCE_FULL", "INDEPENDENT_AUDIT", "PROJECT_MAP"]) {
      if (!requireSwitch(states, switchId)) {
        fail(`FULL_HIGH_RISK requires ${switchId}=ON`);
      }
    }
    for (const relativePath of FULL_PROFILE_PATHS) resolveRegularFile(root, relativePath);
  } else if (requireSwitch(states, "GOVERNANCE_FULL")) {
    fail("LEAN requires GOVERNANCE_FULL=OFF");
  }
  const projectMapEnabled = requireSwitch(states, "PROJECT_MAP");
  requireExactValue(
    manifest.local_validators.project_map,
    projectMapEnabled ? "tools/aekr/validate-project-map.mjs" : null,
    "local_validators.project_map for PROJECT_MAP state",
  );
  if (projectMapEnabled) {
    for (const relativePath of PROJECT_MAP_PATHS) resolveRegularFile(root, relativePath);
    validateProjectMapSemantics(root);
  } else {
    const dormantValidator = resolveContained(
      root,
      "tools/aekr/validate-project-map.mjs",
      { required: false },
    );
    if (fs.existsSync(dormantValidator)) {
      fail("PROJECT_MAP=OFF forbids a dormant project-map validator");
    }
  }
}

function validateBranding(root, states) {
  const readmePath = resolveRegularFile(root, "README.md");
  const readme = fs.readFileSync(readmePath, "utf8");
  const markdownVisibleReadme = markdownVisibleLines(readme, "README.md").join("\n");
  const exceptions = [...markdownVisibleReadme.matchAll(BRANDING_EXCEPTION)];
  const visibleReadme = maskHtmlRawTextElements(
    maskMarkdownInlineCode(maskHtmlComments(markdownVisibleReadme, "README.md")),
    "README.md",
  );
  const bannerPath = path.join(root, "assets", "aekr-banner.png");
  const license = resolveRegularFile(root, "assets/AEKR-BANNER-LICENSE.txt");
  if (sha256CanonicalText(fs.readFileSync(license)) !== BRANDING_LICENSE_SHA256) {
    fail("AEKR code and template license canonical digest mismatch");
  }
  if (requireSwitch(states, "AEKR_BRANDING")) {
    if (exceptions.length > 0) {
      fail("AEKR_BRANDING=ON cannot carry a branding exception marker");
    }
    const banner = resolveRegularFile(root, "assets/aekr-banner.png");
    if (sha256(fs.readFileSync(banner)) !== BRANDING_BANNER_SHA256) {
      fail("AEKR branding banner canonical digest mismatch");
    }
    if (!visibleReadme.trimEnd().endsWith(BRANDING_FOOTER)) {
      fail("AEKR_BRANDING=ON requires the canonical README branding footer");
    }
    const readmeFooterIndex = visibleReadme.lastIndexOf(BRANDING_FOOTER);
    if (hasHiddenHtmlAncestor(visibleReadme, readmeFooterIndex)) {
      fail("AEKR_BRANDING=ON requires a visible README branding footer");
    }
    const projectMapPath = path.join(root, "PROJECT_MAP.html");
    if (fs.existsSync(projectMapPath)) {
      const projectMap = fs.readFileSync(projectMapPath, "utf8");
      const commentVisibleProjectMap = maskHtmlComments(projectMap, "PROJECT_MAP.html");
      const visibleProjectMap = maskHtmlRawTextElements(
        commentVisibleProjectMap,
        "PROJECT_MAP.html",
      );
      const brandedFooter = [...visibleProjectMap.matchAll(/<footer\b([^>]*)>([\s\S]*?)<\/footer>/gi)].find(
        (match) => /\bclass\s*=\s*["'][^"']*\baekr-footer\b[^"']*["']/i.test(match[1]),
      );
      const footerAttributes = brandedFooter?.[1] ?? "";
      const footerBody = brandedFooter?.[2] ?? "";
      if (
        brandedFooter !== undefined &&
        cssHidesBranding(
          commentVisibleProjectMap,
          brandedFooter.index ?? 0,
          footerAttributes,
        )
      ) {
        fail("AEKR_BRANDING=ON requires visible Project Map branding CSS");
      }
      const hasCanonicalImage = [...footerBody.matchAll(/<img\b[^>]*>/gi)].some((match) =>
        [...match[0].matchAll(HTML_REFERENCE)].some((reference) => {
          const attribute = reference[1].toLowerCase();
          const target = reference.slice(2).find((value) => value !== undefined) ?? "";
          return attribute === "src" && target === "assets/aekr-banner.png";
        }),
      );
      if (
        brandedFooter === undefined ||
        hiddenHtmlAttributes(footerAttributes) ||
        hasHiddenHtmlAncestor(visibleProjectMap, brandedFooter?.index ?? 0) ||
        !hasCanonicalImage ||
        !footerBody.includes("Built with the AI Engineering Knowledge Racking (AEKR) workflow.")
      ) {
        fail("AEKR_BRANDING=ON requires canonical Project Map branding");
      }
    }
    const projectMapMarkdownPath = path.join(root, "PROJECT_MAP.md");
    if (fs.existsSync(projectMapMarkdownPath)) {
      const projectMapMarkdown = maskMarkdownInlineCode(
        maskHtmlComments(
          markdownVisibleLines(
            fs.readFileSync(projectMapMarkdownPath, "utf8"),
            "PROJECT_MAP.md",
          ).join("\n"),
          "PROJECT_MAP.md",
        ),
      );
      const hasCanonicalBanner = projectMapMarkdown
        .split("\n")
        .flatMap((line) => markdownLinkTargets(line, "PROJECT_MAP.md"))
        .some(
          ({ image, target }) => image && target === "assets/aekr-banner.png",
        );
      if (!hasCanonicalBanner) {
        fail("AEKR_BRANDING=ON requires canonical Project Map Markdown branding");
      }
    }
    return;
  }

  if (exceptions.length !== 1 || exceptions[0][1].trim().length < 8) {
    fail("AEKR_BRANDING=OFF requires exactly one documented branding exception");
  }
  if (fs.existsSync(bannerPath)) {
    fail("AEKR_BRANDING=OFF requires the AEKR banner asset to be absent");
  }
  if (readme.includes(BRANDING_FOOTER_SENTENCE) || readme.includes(BRANDING_FOOTER_IMAGE)) {
    fail("AEKR_BRANDING=OFF requires the README branding footer to be absent");
  }
  const projectMapPath = path.join(root, "PROJECT_MAP.html");
  if (fs.existsSync(projectMapPath)) {
    const projectMap = fs.readFileSync(projectMapPath, "utf8");
    if (/aekr-banner\.png|aekr-footer|Built with the AI Engineering Knowledge Racking/i.test(projectMap)) {
      fail("AEKR_BRANDING=OFF requires Project Map branding to be removed");
    }
  }
  const projectMapMarkdownPath = path.join(root, "PROJECT_MAP.md");
  if (
    fs.existsSync(projectMapMarkdownPath) &&
    /assets\/aekr-banner\.png|Build with AEKR/i.test(
      fs.readFileSync(projectMapMarkdownPath, "utf8"),
    )
  ) {
    fail("AEKR_BRANDING=OFF requires Project Map Markdown branding to be removed");
  }
}

function validateExactMode1Tree(bundleRoot) {
  const allowedFiles = new Set(MODE1_REQUIRED_FILES);
  const allowedDirectories = new Set();
  for (const relativeFile of MODE1_REQUIRED_FILES) {
    let directory = path.posix.dirname(relativeFile);
    while (directory !== ".") {
      allowedDirectories.add(directory);
      directory = path.posix.dirname(directory);
    }
  }

  function visit(directory, relativeDirectory = "") {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relative = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const absolute = path.join(directory, entry.name);
      const metadata = fs.lstatSync(absolute);
      if (entry.name.includes(":")) {
        fail(`Mode 1 bundle contains a colon-bearing path alias: ${relative}`);
      }
      if (metadata.isSymbolicLink()) {
        fail(`Mode 1 bundle contains symlink outside its allowlist: ${relative}`);
      }
      if (entry.isDirectory()) {
        if (!allowedDirectories.has(relative)) {
          fail(`Mode 1 bundle directory is outside the exact allowlist: ${relative}`);
        }
        visit(absolute, relative);
      } else if (entry.isFile()) {
        if (!allowedFiles.has(relative)) {
          fail(`Mode 1 bundle file is outside the exact allowlist: ${relative}`);
        }
      } else {
        fail(`Mode 1 bundle path has an unsupported filesystem type: ${relative}`);
      }
    }
  }

  visit(bundleRoot);
}

function validateNoWindowsAlternateDataStreams(bundleRoot) {
  if (process.platform !== "win32") return;
  const literalRoot = bundleRoot.replaceAll("'", "''");
  const command =
    "$ErrorActionPreference='Stop'; " +
    `$root='${literalRoot}'; ` +
    "Get-ChildItem -LiteralPath $root -Recurse -Force -File | " +
    "ForEach-Object { Get-Item -LiteralPath $_.FullName -Stream * -ErrorAction Stop } | " +
    "Where-Object { $_.Stream -ne ':$DATA' } | " +
    "ForEach-Object { '{0}:{1}' -f $_.FileName,$_.Stream }";
  const result = spawnSync(
    "powershell.exe",
    ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command],
    {
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (result.error !== undefined || result.status !== 0) {
    const detail = result.error?.message ?? result.stderr?.trim() ?? "unknown error";
    fail(`Mode 1 alternate data stream inspection failed closed: ${detail}`);
  }
  const alternateStreams = (result.stdout ?? "").trim();
  if (alternateStreams !== "") {
    fail(`Mode 1 bundle contains an NTFS alternate data stream: ${alternateStreams}`);
  }
}

function gitignorePatternRegex(pattern) {
  const anchored = pattern.startsWith("/");
  let normalized = anchored ? pattern.slice(1) : pattern;
  const directoryOnly = normalized.endsWith("/");
  if (directoryOnly) normalized = normalized.slice(0, -1);
  let expression = "";
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (character === "*") {
      if (normalized[index + 1] === "*") {
        if (normalized[index + 2] === "/") {
          expression += "(?:.*/)?";
          index += 2;
        } else {
          expression += ".*";
          index += 1;
        }
      } else {
        expression += "[^/]*";
      }
    } else if (character === "?") {
      expression += "[^/]";
    } else {
      expression += character.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
    }
  }
  const hasSlash = normalized.includes("/");
  const prefix = anchored || hasSlash ? "^" : "(?:^|/)";
  return { directoryOnly, regex: new RegExp(`${prefix}${expression}$`) };
}

function normalizeGitignoreLine(rawLine) {
  return rawLine.replace(/(?<!\\) +$/, "");
}

function relevantGitignoreSources(root, repositoryPath) {
  const segments = repositoryPath.split("/");
  const sources = [];
  for (let depth = 0; depth < segments.length; depth += 1) {
    const base = segments.slice(0, depth).join("/");
    const ignorePath = path.join(root, ...segments.slice(0, depth), ".gitignore");
    if (!fs.existsSync(ignorePath)) continue;
    const metadata = fs.lstatSync(ignorePath);
    if (metadata.isSymbolicLink() || !metadata.isFile()) {
      fail(`Mode 1 ignore source must be a regular file: ${base ? `${base}/` : ""}.gitignore`);
    }
    sources.push({
      base,
      lines: fs.readFileSync(ignorePath, "utf8").split(/\r?\n/),
    });
  }
  return sources;
}

function isEffectivelyIgnored(root, repositoryPath) {
  const segments = repositoryPath.split("/");
  const candidates = segments.map((_, index) => ({
    path: segments.slice(0, index + 1).join("/"),
    directory: index < segments.length - 1,
  }));
  const states = new Map(candidates.map((candidate) => [candidate.path, false]));
  for (const source of relevantGitignoreSources(root, repositoryPath)) {
    for (const rawLine of source.lines) {
      const line = normalizeGitignoreLine(rawLine);
      if (line === "" || line.startsWith("#")) continue;
      const negated = line.startsWith("!");
      const pattern = negated ? line.slice(1) : line;
      if (pattern === "") continue;
      if (negated && /[\\[\]]/.test(pattern)) {
        const normalizedPattern = pattern.replace(/^\//, "");
        const literalPrefix = normalizedPattern.split(/[\\[*?]/, 1)[0];
        const couldAffectProtectedPath =
          literalPrefix === "" ||
          candidates.some((candidate) => {
            const relativeCandidate = source.base
              ? path.posix.relative(source.base, candidate.path)
              : candidate.path;
            return (
              relativeCandidate === literalPrefix ||
              relativeCandidate.startsWith(literalPrefix) ||
              literalPrefix.startsWith(`${relativeCandidate}/`)
            );
          });
        if (couldAffectProtectedPath) {
          fail(
            "Mode 1 .gitignore contains an unsupported negation pattern relevant to protected paths",
          );
        }
        continue;
      }
      const compiled = gitignorePatternRegex(pattern);
      for (const candidate of candidates) {
        const relativeCandidate = source.base
          ? path.posix.relative(source.base, candidate.path)
          : candidate.path;
        if (relativeCandidate === ".." || relativeCandidate.startsWith("../")) continue;
        if (compiled.directoryOnly && !candidate.directory) continue;
        if (compiled.regex.test(relativeCandidate)) {
          states.set(candidate.path, !negated);
        }
      }
    }
  }
  return candidates.some((candidate) => states.get(candidate.path));
}

function requireEffectiveIgnore(root, ignoreLines, anchoredRule, label) {
  if (!ignoreLines.map(normalizeGitignoreLine).includes(anchoredRule)) {
    fail(`Mode 1 .gitignore must anchor the ${label}`);
  }
  if (!isEffectivelyIgnored(root, anchoredRule.slice(1))) {
    fail(`Mode 1 .gitignore does not effectively ignore the ${label}; check negation rules`);
  }
}

function validateMode1Bundle(root) {
  const bundleRoot = resolveDirectory(root, "toolkit/orchestrator");
  const ignoreLines = fs
    .readFileSync(resolveRegularFile(root, ".gitignore"), "utf8")
    .split(/\r?\n/);
  requireEffectiveIgnore(
    root,
    ignoreLines,
    "/toolkit/orchestrator/config/orchestrator.config.yaml",
    "operational config path",
  );
  requireEffectiveIgnore(
    root,
    ignoreLines,
    "/.MASTER_SWITCH.md.lock",
    "switchboard lock sidecar",
  );
  const bundleManifestPath = resolveRegularFile(
    root,
    "toolkit/orchestrator/mode1-seed-manifest.json",
  );
  if (sha256CanonicalText(fs.readFileSync(bundleManifestPath)) !== MODE1_MANIFEST_SHA256) {
    fail("Mode 1 seed manifest canonical digest mismatch");
  }
  const bundleManifest = requireObject(
    readJson(bundleManifestPath, "Mode 1 seed manifest"),
    "Mode 1 seed manifest",
  );
  requireExactKeys(
    bundleManifest,
    [
      "schema_version",
      "component",
      "bundle_version",
      "required_files",
      "required_file_sha256",
      "required_directories",
      "excluded_source_only_paths",
      "forbidden_seed_paths",
      "adapter_contracts",
      "portable_test_root",
      "evidence_posture",
    ],
    "Mode 1 seed manifest",
  );
  requireExactValue(bundleManifest.schema_version, 2, "Mode 1 schema_version");
  requireExactValue(bundleManifest.component, "AEKR_MODE1_ORCHESTRATOR", "Mode 1 component");
  requireExactValue(bundleManifest.bundle_version, 7, "Mode 1 bundle_version");
  requireExactArray(
    bundleManifest.required_files,
    MODE1_REQUIRED_FILES,
    "Mode 1 required_files",
  );
  const requiredFileDigests = requireObject(
    bundleManifest.required_file_sha256,
    "Mode 1 required_file_sha256",
  );
  const contentFiles = MODE1_REQUIRED_FILES.filter(
    (item) => item !== "mode1-seed-manifest.json",
  );
  requireExactKeys(
    requiredFileDigests,
    contentFiles,
    "Mode 1 required_file_sha256",
  );
  for (const item of contentFiles) {
    const expectedDigest = requiredFileDigests[item];
    if (!/^[A-F0-9]{64}$/.test(expectedDigest)) {
      fail(`Mode 1 file ${item} has an invalid canonical digest`);
    }
    const seededFile = resolveRegularFile(root, `toolkit/orchestrator/${item}`);
    if (sha256CanonicalText(fs.readFileSync(seededFile)) !== expectedDigest) {
      fail(`Mode 1 file ${item} canonical digest mismatch`);
    }
  }
  requireExactArray(
    bundleManifest.required_directories,
    MODE1_REQUIRED_DIRECTORIES,
    "Mode 1 required_directories",
  );
  requireExactArray(
    bundleManifest.excluded_source_only_paths,
    MODE1_EXCLUDED_SOURCE_ONLY_PATHS,
    "Mode 1 excluded_source_only_paths",
  );
  requireExactArray(
    bundleManifest.forbidden_seed_paths,
    MODE1_FORBIDDEN_SEED_PATHS,
    "Mode 1 forbidden_seed_paths",
  );
  requireExactJson(
    bundleManifest.adapter_contracts,
    MODE1_ADAPTER_CONTRACTS,
    "Mode 1 adapter_contracts",
  );
  requireExactValue(
    bundleManifest.portable_test_root,
    MODE1_PORTABLE_TEST_ROOT,
    "Mode 1 portable_test_root",
  );
  requireExactValue(
    bundleManifest.evidence_posture,
    MODE1_EVIDENCE_POSTURE,
    "Mode 1 evidence_posture",
  );

  for (const item of MODE1_REQUIRED_FILES) {
    requireSafeRelativePath(item, "Mode 1 required_files");
    resolveRegularFile(root, `toolkit/orchestrator/${item}`);
  }
  for (const item of MODE1_REQUIRED_DIRECTORIES) {
    requireSafeRelativePath(item, "Mode 1 required_directories");
    resolveDirectory(root, `toolkit/orchestrator/${item}`);
  }
  for (const item of MODE1_FORBIDDEN_SEED_PATHS) {
    requireSafeRelativePath(item, "Mode 1 forbidden_seed_paths");
    if (fs.existsSync(path.join(bundleRoot, ...item.split("/")))) {
      fail(`Mode 1 bundle includes forbidden seed path ${item}`);
    }
  }
  validateExactMode1Tree(bundleRoot);
  validateNoWindowsAlternateDataStreams(bundleRoot);

  const configRoot = resolveDirectory(root, "toolkit/orchestrator/config");
  for (const entry of fs.readdirSync(configRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !MODE1_CONFIG_FILES.has(entry.name)) {
      fail(`Mode 1 bundle includes undeclared config path config/${entry.name}`);
    }
  }
  const testsRoot = path.join(bundleRoot, "tests");
  if (fs.existsSync(testsRoot)) {
    for (const entry of fs.readdirSync(testsRoot)) {
      if (entry !== "portable") fail(`Mode 1 bundle includes non-portable test path tests/${entry}`);
    }
  }

  return bundleRoot;
}

function validateMode(root, mode, states) {
  const bundlePath = path.join(root, "toolkit", "orchestrator");
  if (mode === MODE0) {
    for (const switchId of MODE0_RUNTIME_SWITCHES) {
      if (requireSwitch(states, switchId)) {
        fail(`MODE0 requires ${switchId}=OFF when no implementation is seeded`);
      }
    }
    if (requireSwitch(states, "MODE2_PROPOSAL_API")) {
      fail("MODE0 requires MODE2_PROPOSAL_API=OFF when no proposal implementation is seeded");
    }
    for (const [switchId, enabled] of states) {
      if (switchId.startsWith("ADAPTER_") && enabled) {
        fail(`MODE0 requires ${switchId}=OFF when no adapter implementation is seeded`);
      }
    }
    if (fs.existsSync(bundlePath)) fail("MODE0 must not contain an orchestrator bundle");
    return;
  }

  if (!requireSwitch(states, "ORCHESTRATOR_MODE1")) {
    fail("MODE1 requires ORCHESTRATOR_MODE1=ON");
  }
  const adapters = [...states.entries()].filter(
    ([switchId, enabled]) => switchId.startsWith("ADAPTER_") && enabled,
  );
  if (adapters.length === 0) fail("MODE1 requires at least one enabled ADAPTER_* capability");
  validateMode1Bundle(root);
  const registry = fs.readFileSync(
    resolveRegularFile(root, "toolkit/orchestrator/runtime/adapters/registry.py"),
    "utf8",
  );
  for (const [switchId] of adapters) {
    const implementation = ADAPTER_IMPLEMENTATIONS.get(switchId);
    if (!implementation) {
      fail(`MODE1 enabled adapter ${switchId} has no declared portable implementation`);
    }
    const [kind, relativePath] = implementation;
    resolveRegularFile(root, `toolkit/orchestrator/${relativePath}`);
    const policyLiteral = `AdapterPolicy("${switchId}"`;
    if (!registry.includes(`"${kind}":`) || !registry.includes(policyLiteral)) {
      fail(`MODE1 enabled adapter ${switchId} is missing registry metadata`);
    }
  }
}

function singleMetadataValue(text, pattern, label) {
  const values = [...text.matchAll(pattern)].map((match) => match[1]);
  if (values.length !== 1) fail(`tool entry requires exactly one ${label}`);
  return values[0];
}

function validateToolEntries(root, entryPaths) {
  const existingEntries = [...TOOL_ENTRY_NAMES]
    .filter((entryPath) => fs.existsSync(path.join(root, entryPath)))
    .sort();
  const declaredEntries = [...entryPaths].sort();
  if (
    existingEntries.length !== declaredEntries.length ||
    existingEntries.some((entryPath, index) => entryPath !== declaredEntries[index])
  ) {
    fail(
      `tool_entry.paths must list exactly every root tool entry; found ${existingEntries.join(", ")}`,
    );
  }
  const buffers = entryPaths.map((entryPath) =>
    fs.readFileSync(resolveRegularFile(root, entryPath)),
  );
  if (buffers.some((buffer) => !buffer.equals(buffers[0]))) {
    fail("selected tool-entry files must remain byte-identical");
  }

  entryPaths.forEach((entryPath, index) => {
    const buffer = buffers[index];
    const text = buffer.toString("utf8");
    if (/^# AEKR Agent Entry Contract\s*$/m.test(text)) {
      fail(`${entryPath}: AEKR Agent Entry Contract cannot be seeded as a downstream constitution`);
    }
    if (!/^# Engineering Constitution — Canonical Core\s*$/m.test(text)) {
      fail(`${entryPath}: missing downstream Engineering Constitution title`);
    }
    requireExactValue(
      singleMetadataValue(
        text,
        /^<!-- AEKR-DOCUMENT-ROLE: ([A-Z_]+) -->\s*$/gm,
        "document role",
      ),
      DOCUMENT_ROLE,
      `${entryPath} document role`,
    );
    requireExactValue(
      singleMetadataValue(
        text,
        /^<!-- AEKR-CANONICAL-TEMPLATE-ID: ([A-Z0-9_]+) -->\s*$/gm,
        "canonical template ID",
      ),
      TEMPLATE_ID,
      `${entryPath} canonical template ID`,
    );
    requireExactValue(
      Number(
        singleMetadataValue(
          text,
          /^<!-- AEKR-CANONICAL-TEMPLATE-VERSION: ([0-9]+) -->\s*$/gm,
          "canonical template version",
        ),
      ),
      TEMPLATE_VERSION,
      `${entryPath} canonical template version`,
    );
    if (sha256CanonicalText(buffer) !== TEMPLATE_SHA256) {
      fail(`${entryPath}: constitution canonical digest mismatch`);
    }
  });
}

function walkTextFiles(root) {
  const files = [];
  const realRoot = fs.realpathSync(root);
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      const metadata = fs.lstatSync(absolute);
      if (metadata.isSymbolicLink()) {
        fail(`generated project contains symlink or junction ${relative}`);
      }
      const real = fs.realpathSync(absolute);
      if (!isWithin(realRoot, real)) {
        fail(`generated project path resolves outside root through a reparse point: ${relative}`);
      }
      // AEKR-WEB-VARIANCE-START website-license-copy
      if (relative === "public/assets/AEKR-BANNER-LICENSE.txt") {
        if (sha256CanonicalText(fs.readFileSync(absolute)) !== BRANDING_LICENSE_SHA256) fail("website banner license digest mismatch");
        continue;
      }
      // AEKR-WEB-VARIANCE-END website-license-copy
      if (EXCLUDED_SCAN_DIRECTORIES.has(entry.name)) continue;
      if (entry.isDirectory()) {
        visit(absolute);
      } else if (
        entry.isFile() &&
        (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ||
          TEXT_BASENAMES.has(entry.name.toLowerCase()) ||
          (!BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) &&
            entry.name !== ".gitignore")) &&
        ![
          "assets/AEKR-BANNER-LICENSE.txt",
          "tools/aekr/validate-generated-project.mjs",
          "tools/aekr/validate-project-map.mjs",
        ].includes(relative) &&
        relative !== MANIFEST_NAME
      ) {
        files.push({ absolute, relative });
      }
    }
  }
  visit(root);
  return files;
}

function readUtf8Text(file, label) {
  const buffer = fs.readFileSync(file);
  if (
    (buffer[0] === 0xff && buffer[1] === 0xfe) ||
    (buffer[0] === 0xfe && buffer[1] === 0xff)
  ) {
    fail(`${label}: scanned text files must use UTF-8, not UTF-16`);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    fail(`${label}: scanned text file is not valid UTF-8`);
  }
}

function pathExistsInside(root, relativePath) {
  if (!isSafeRelativePath(relativePath)) return false;
  try {
    return fs.existsSync(resolveContained(root, relativePath, { required: false }));
  } catch {
    return false;
  }
}

function fenceToken(line) {
  const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  if (match === null || (match[1][0] === "`" && match[2].includes("`"))) {
    return null;
  }
  return { character: match[1][0], length: match[1].length, trailing: match[2] };
}

function markdownContainer(line) {
  let content = line;
  let quoteDepth = 0;
  while (true) {
    const marker = content.match(/^ {0,3}>[ \t]?/);
    if (marker === null) break;
    quoteDepth += 1;
    content = content.slice(marker[0].length);
  }
  return { content, quoteDepth };
}

function leadingMarkdownColumns(value) {
  let columns = 0;
  for (const character of value) {
    if (character === " ") columns += 1;
    else if (character === "\t") columns += 4 - (columns % 4);
    else break;
  }
  return columns;
}

function markdownListContentIndent(value) {
  const match = value.match(/^( {0,3})(?:[-+*]|\d{1,9}[.)])([ \t]+)/);
  if (match === null) return null;
  const markerWidth = match[0].length - match[1].length - match[2].length;
  return (
    leadingMarkdownColumns(match[1]) +
    markerWidth +
    leadingMarkdownColumns(match[2])
  );
}

function markdownVisibleLines(text, relative) {
  const visible = [];
  let activeFence = null;
  let activeIndentedCode = false;
  let activeList = null;
  let listBlankLines = 0;
  let previousLineBlank = true;
  let previousQuoteDepth = null;
  const lines = text.split(/\r?\n/);
  lines.forEach((rawLine, index) => {
    const container = markdownContainer(rawLine);
    if (activeFence !== null) {
      if (container.quoteDepth !== activeFence.quoteDepth) {
        fail(`${relative}:${index + 1}: fenced code block changed Markdown container`);
      }
      const token = fenceToken(container.content);
      if (
        token !== null &&
        token.character === activeFence.character &&
        token.length >= activeFence.length &&
        token.trailing.trim() === ""
      ) {
        activeFence = null;
      }
      visible.push("");
      previousLineBlank = true;
      previousQuoteDepth = container.quoteDepth;
      return;
    }
    const token = fenceToken(container.content);
    if (token !== null) {
      activeFence = { ...token, quoteDepth: container.quoteDepth };
      visible.push("");
      previousLineBlank = true;
      previousQuoteDepth = container.quoteDepth;
      return;
    }
    const listIndent = markdownListContentIndent(container.content);
    if (listIndent !== null) {
      activeList = {
        quoteDepth: container.quoteDepth,
        contentIndent: listIndent,
        indentedCode: false,
      };
      listBlankLines = 0;
    } else if (activeList !== null && activeList.quoteDepth === container.quoteDepth) {
      if (container.content.trim() === "") {
        listBlankLines += 1;
        if (listBlankLines >= 2) activeList = null;
      } else {
        const indentation = leadingMarkdownColumns(container.content);
        if (indentation < activeList.contentIndent) {
          activeList = null;
        } else {
          if (indentation >= activeList.contentIndent + 4) {
            if (activeList.indentedCode || listBlankLines > 0) {
              activeList.indentedCode = true;
              listBlankLines = 0;
              visible.push("");
              previousLineBlank = false;
              previousQuoteDepth = container.quoteDepth;
              return;
            }
          } else {
            activeList.indentedCode = false;
          }
          listBlankLines = 0;
        }
      }
    } else if (activeList !== null && activeList.quoteDepth !== container.quoteDepth) {
      activeList = null;
    }
    if (activeList === null) {
      const indented = /^(?: {4}|\t)/.test(container.content);
      if (activeIndentedCode) {
        if (container.quoteDepth !== previousQuoteDepth) {
          activeIndentedCode = false;
        } else if (container.content.trim() === "" || indented) {
          visible.push("");
          previousLineBlank = container.content.trim() === "";
          previousQuoteDepth = container.quoteDepth;
          return;
        } else {
          activeIndentedCode = false;
        }
      }
      if (
        indented &&
        (previousLineBlank || previousQuoteDepth !== container.quoteDepth)
      ) {
        activeIndentedCode = true;
        visible.push("");
        previousLineBlank = false;
        previousQuoteDepth = container.quoteDepth;
        return;
      }
    }
    visible.push(container.content);
    previousLineBlank = container.content.trim() === "";
    previousQuoteDepth = container.quoteDepth;
  });
  if (activeFence !== null) fail(`${relative}: unclosed fenced code block`);
  return visible;
}

function maskMarkdownInlineCode(text) {
  const characters = [...text];
  for (let index = 0; index < characters.length; index += 1) {
    if (characters[index] !== "`") continue;
    let runLength = 1;
    while (characters[index + runLength] === "`") runLength += 1;
    let closing = index + runLength;
    while (closing < characters.length) {
      if (characters[closing] !== "`") {
        closing += 1;
        continue;
      }
      let closingLength = 1;
      while (characters[closing + closingLength] === "`") closingLength += 1;
      if (closingLength === runLength) break;
      closing += closingLength;
    }
    if (closing >= characters.length) {
      index += runLength - 1;
      continue;
    }
    for (let cursor = index; cursor < closing + runLength; cursor += 1) {
      if (characters[cursor] !== "\n" && characters[cursor] !== "\r") {
        characters[cursor] = " ";
      }
    }
    index = closing + runLength - 1;
  }
  return characters.join("");
}

function markdownLinkTargets(line, label) {
  const targets = [];
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] !== "[" || (index > 0 && line[index - 1] === "\\")) continue;
    let labelEnd = index + 1;
    let labelDepth = 0;
    for (; labelEnd < line.length; labelEnd += 1) {
      if (line[labelEnd] === "\\") {
        labelEnd += 1;
        continue;
      }
      if (line[labelEnd] === "[") labelDepth += 1;
      if (line[labelEnd] !== "]") continue;
      if (labelDepth > 0) {
        labelDepth -= 1;
        continue;
      }
      break;
    }
    if (labelEnd >= line.length) continue;
    let cursor = labelEnd + 1;
    if (line[cursor] !== "(") continue;
    cursor += 1;
    while (cursor < line.length && /\s/.test(line[cursor])) cursor += 1;
    let rawTarget = "";
    if (line[cursor] === "<") {
      const start = ++cursor;
      while (cursor < line.length && line[cursor] !== ">") {
        if (line[cursor] === "\\" && cursor + 1 < line.length) cursor += 1;
        cursor += 1;
      }
      if (cursor >= line.length) fail(`${label}: malformed Markdown link destination`);
      rawTarget = line.slice(start, cursor);
      cursor += 1;
    } else {
      const start = cursor;
      let depth = 0;
      for (; cursor < line.length; cursor += 1) {
        if (line[cursor] === "\\") {
          cursor += 1;
          continue;
        }
        if (line[cursor] === "(") {
          depth += 1;
          continue;
        }
        if (line[cursor] === ")") {
          if (depth === 0) break;
          depth -= 1;
          continue;
        }
        if (depth === 0 && /\s/.test(line[cursor])) break;
      }
      rawTarget = line.slice(start, cursor);
    }
    if (rawTarget.length === 0) continue;
    if (line[cursor] !== ")") {
      if (!/\s/.test(line[cursor] ?? "")) continue;
      while (cursor < line.length && /\s/.test(line[cursor])) cursor += 1;
      if (line[cursor] !== ")") {
        const titleOpen = line[cursor];
        const titleClose = titleOpen === "(" ? ")" : titleOpen;
        if (!["\"", "'", "("].includes(titleOpen)) continue;
        cursor += 1;
        while (cursor < line.length && line[cursor] !== titleClose) {
          if (line[cursor] === "\\") cursor += 1;
          cursor += 1;
        }
        if (cursor >= line.length) continue;
        cursor += 1;
        while (cursor < line.length && /\s/.test(line[cursor])) cursor += 1;
        if (line[cursor] !== ")") continue;
      }
    }
    targets.push({
      image: index > 0 && line[index - 1] === "!",
      target: rawTarget.replace(/\\([^\w\s])/g, "$1"),
      multiline: line.slice(index, cursor + 1).includes("\n"),
    });
    index = cursor;
  }
  return targets;
}

function markdownReferenceDefinitionTargets(text, label) {
  const targets = [];
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const definition = lines[index].match(
      /^ {0,3}\[((?:\\.|[^\]])+)\]:[ \t]*(.*)$/,
    );
    if (definition === null) continue;
    let destinationSource = definition[2];
    let destinationLine = index;
    if (destinationSource.trim() === "") {
      const continuation = lines[index + 1]?.match(/^ {0,3}(\S.*)$/);
      if (continuation === undefined || continuation === null) {
        fail(`${label}:${index + 1}: malformed Markdown reference definition`);
      }
      destinationSource = continuation[1];
      destinationLine = index + 1;
    }
    destinationSource = destinationSource.trimStart();
    let target;
    if (destinationSource.startsWith("<")) {
      let cursor = 1;
      while (cursor < destinationSource.length) {
        if (destinationSource[cursor] === "\\") cursor += 1;
        else if (destinationSource[cursor] === ">") break;
        cursor += 1;
      }
      if (cursor >= destinationSource.length) {
        fail(`${label}:${destinationLine + 1}: malformed Markdown reference destination`);
      }
      target = destinationSource.slice(1, cursor);
    } else {
      let cursor = 0;
      let depth = 0;
      while (cursor < destinationSource.length) {
        const character = destinationSource[cursor];
        if (character === "\\") {
          cursor += 2;
          continue;
        }
        if (character === "(") depth += 1;
        else if (character === ")") {
          if (depth === 0) break;
          depth -= 1;
        } else if (depth === 0 && /\s/.test(character)) {
          break;
        }
        cursor += 1;
      }
      target = destinationSource.slice(0, cursor);
    }
    if (target === "") {
      fail(`${label}:${destinationLine + 1}: empty Markdown reference destination`);
    }
    targets.push({
      line: destinationLine + 1,
      target: target.replace(/\\([^\w\s])/g, "$1"),
    });
  }
  return targets;
}

function maskHtmlComments(text, label) {
  let masked = "";
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf("<!--", cursor);
    if (start < 0) {
      masked += text.slice(cursor);
      break;
    }
    masked += text.slice(cursor, start);
    const end = text.indexOf("-->", start + 4);
    if (end < 0) fail(`${label}: unclosed HTML comment`);
    const comment = text.slice(start, end + 3);
    masked += comment.replace(/[^\r\n]/g, " ");
    cursor = end + 3;
  }
  return masked;
}

function findHtmlTagEnd(text, start) {
  let quote = null;
  for (let cursor = start + 1; cursor < text.length; cursor += 1) {
    const character = text[cursor];
    if (quote !== null) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return cursor;
    }
  }
  return -1;
}

function maskHtmlRawTextElements(text, label) {
  let masked = "";
  let cursor = 0;
  const opening = /<(script|style|textarea|title)\b/gi;
  while (true) {
    opening.lastIndex = cursor;
    const match = opening.exec(text);
    if (match === null) {
      masked += text.slice(cursor);
      break;
    }
    const openingEnd = findHtmlTagEnd(text, match.index);
    if (openingEnd < 0) fail(`${label}: unclosed HTML ${match[1]} tag`);
    masked += text.slice(cursor, openingEnd + 1);
    const close = new RegExp(`</${match[1]}\\s*>`, "gi");
    close.lastIndex = openingEnd + 1;
    const closing = close.exec(text);
    if (closing === null) fail(`${label}: unclosed HTML ${match[1]} element`);
    const body = text.slice(openingEnd + 1, closing.index);
    masked += body.replace(/[^\r\n]/g, " ");
    masked += closing[0];
    cursor = closing.index + closing[0].length;
  }
  return masked;
}

function htmlTags(text, label) {
  const tags = [];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== "<" || !/[A-Za-z]/.test(text[index + 1] ?? "")) continue;
    const name = text.slice(index + 1).match(/^[A-Za-z][A-Za-z0-9:-]*/)?.[0];
    if (
      name === undefined ||
      !/[\s/>]/.test(text[index + 1 + name.length] ?? "")
    ) {
      continue;
    }
    const end = findHtmlTagEnd(text, index);
    if (end < 0) continue;
    tags.push({ index, text: text.slice(index, end + 1) });
    index = end;
  }
  return tags;
}

const VOID_HTML_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function hiddenHtmlAttributes(attributes) {
  return (
    /(?:^|\s)hidden(?:\s|=|\/?>|$)/i.test(attributes) ||
    /\baria-hidden\s*=\s*(?:["']?true["']?)/i.test(attributes) ||
    /\bclass\s*=\s*["'][^"']*\bhidden\b[^"']*["']/i.test(
      attributes,
    ) ||
    /\bstyle\s*=\s*["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\D|$))/i.test(
      attributes,
    )
  );
}

function openHtmlElementsBefore(text, targetIndex) {
  const stack = [];
  const tag = /<\/?[A-Za-z][A-Za-z0-9:-]*/g;
  while (true) {
    const match = tag.exec(text);
    if (match === null || match.index >= targetIndex) break;
    const end = findHtmlTagEnd(text, match.index);
    if (end < 0 || end >= targetIndex) break;
    const token = text.slice(match.index, end + 1);
    const closing = /^<\//.test(token);
    const rawName = token.match(/^<\/?([A-Za-z][A-Za-z0-9:-]*)/)?.[1];
    if (rawName === undefined) continue;
    const name = rawName.toLowerCase();
    if (closing) {
      const openIndex = stack.map((item) => item.name).lastIndexOf(name);
      if (openIndex >= 0) stack.splice(openIndex);
    } else if (!VOID_HTML_ELEMENTS.has(name) && !/\/\s*>$/.test(token)) {
      const detailsClosed =
        name === "details" &&
        !/(?:^|\s)open(?:\s|=|\/?>|$)/i.test(token.replace(/^<details\b/i, ""));
      stack.push({
        name,
        token,
        hidden: hiddenHtmlAttributes(token) || detailsClosed,
      });
    }
    tag.lastIndex = end + 1;
  }
  return stack;
}

function hasHiddenHtmlAncestor(text, targetIndex) {
  return openHtmlElementsBefore(text, targetIndex).some((item) => item.hidden);
}

function finalCssCompound(selector) {
  selector = selector.trim();
  let quote = null;
  let squareDepth = 0;
  let parenthesisDepth = 0;
  let start = 0;
  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];
    if (quote !== null) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "\"" || character === "'") quote = character;
    else if (character === "[") squareDepth += 1;
    else if (character === "]") squareDepth = Math.max(0, squareDepth - 1);
    else if (character === "(") parenthesisDepth += 1;
    else if (character === ")") parenthesisDepth = Math.max(0, parenthesisDepth - 1);
    else if (
      squareDepth === 0 &&
      parenthesisDepth === 0 &&
      (/[\s>+~]/.test(character))
    ) {
      start = index + 1;
    }
  }
  return selector.slice(start).trim();
}

function htmlElementMatchesCssCompound(element, compound) {
  if (compound === "" || /::(?:before|after|marker)\b/i.test(compound)) return false;
  if (/:(?:active|checked|focus|focus-within|focus-visible|has|hover|target|visited)\b/i.test(compound)) {
    return false;
  }
  if (/^:root\b/i.test(compound)) return element.name === "html";
  const withoutPseudo = compound.replace(/:{1,2}[A-Za-z-]+(?:\([^)]*\))?/g, "");
  const tagName = withoutPseudo.match(/^[A-Za-z][A-Za-z0-9-]*/)?.[0];
  if (tagName !== undefined && tagName.toLowerCase() !== element.name) return false;
  if (withoutPseudo.startsWith("*") || tagName !== undefined) {
    // Continue with any class, id, and attribute qualifiers.
  } else if (!/^[.#\[]/.test(withoutPseudo)) {
    return false;
  }
  const classAttribute = element.token.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const classes = new Set((classAttribute?.[1] ?? classAttribute?.[2] ?? "").split(/\s+/).filter(Boolean));
  for (const classMatch of withoutPseudo.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)) {
    if (!classes.has(classMatch[1])) return false;
  }
  const idAttribute = element.token.match(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const id = idAttribute?.[1] ?? idAttribute?.[2] ?? null;
  for (const idMatch of withoutPseudo.matchAll(/#([A-Za-z_][A-Za-z0-9_-]*)/g)) {
    if (id !== idMatch[1]) return false;
  }
  for (const attributeMatch of withoutPseudo.matchAll(
    /\[\s*([A-Za-z_:][A-Za-z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+)))?\s*\]/g,
  )) {
    const attributeName = attributeMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const actual = element.token.match(
      new RegExp(`\\b${attributeName}\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`, "i"),
    );
    if (actual === null) {
      if (!new RegExp(`(?:^|\\s)${attributeName}(?:\\s|=|/?>|$)`, "i").test(element.token)) {
        return false;
      }
    } else {
      const expected = attributeMatch[2] ?? attributeMatch[3] ?? attributeMatch[4];
      const actualValue = actual[1] ?? actual[2] ?? actual[3] ?? "";
      if (expected !== undefined && actualValue !== expected) return false;
    }
  }
  return true;
}

function cssHidesBranding(text, targetIndex, footerAttributes) {
  const elements = [
    ...openHtmlElementsBefore(text, targetIndex),
    { name: "footer", token: `<footer${footerAttributes}>`, hidden: false },
  ];
  for (const style of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
    const css = style[1].replace(/\/\*[\s\S]*?\*\//g, " ");
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\D|$))/i.test(rule[2])) continue;
      const selectors = rule[1].split(",");
      if (selectors.some((selector) => {
        const compound = finalCssCompound(selector);
        return elements.some((element) => htmlElementMatchesCssCompound(element, compound));
      })) return true;
    }
  }
  return false;
}

function jsonReferenceLines(value, key = "value") {
  const lines = [];
  const visit = (candidate, currentKey) => {
    if (typeof candidate === "string") {
      for (const line of candidate.split(/\r?\n/)) lines.push(`${currentKey}: ${line}`);
    } else if (Array.isArray(candidate)) {
      candidate.forEach((item) => visit(item, currentKey));
    } else if (candidate !== null && typeof candidate === "object") {
      Object.entries(candidate).forEach(([childKey, item]) => {
        const parentLabel = currentKey === "paths" ? "paths" : "object";
        for (const line of childKey.split(/\r?\n/)) {
          lines.push(`JSON key under ${parentLabel}: ${line}`);
        }
        visit(item, childKey);
      });
    }
  };
  visit(value, key);
  return lines;
}

const HTML_REFERENCE_ENTITIES = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["bsol", "\\"],
  ["colon", ":"],
  ["copy", "©"],
  ["gt", ">"],
  ["lt", "<"],
  ["num", "#"],
  ["nbsp", "\u00a0"],
  ["quot", '"'],
  ["reg", "®"],
  ["sol", "/"],
]);

function decodeHtmlReferenceEntities(value, label) {
  return value.replace(/&(#(?:x[0-9a-f]+|[0-9]+);?|[A-Za-z][A-Za-z0-9]+;)/gi, (
    match,
    entity,
  ) => {
    const normalizedEntity = entity.endsWith(";") ? entity.slice(0, -1) : entity;
    if (normalizedEntity[0] === "#") {
      const hexadecimal = normalizedEntity[1]?.toLowerCase() === "x";
      const digits = normalizedEntity.slice(hexadecimal ? 2 : 1);
      const codePoint = Number.parseInt(digits, hexadecimal ? 16 : 10);
      if (!Number.isSafeInteger(codePoint) || codePoint > 0x10ffff) {
        fail(`${label}: invalid numeric HTML entity in link target`);
      }
      return String.fromCodePoint(codePoint);
    }
    const decoded = HTML_REFERENCE_ENTITIES.get(normalizedEntity.toLowerCase());
    return decoded ?? match;
  });
}

// AEKR-WEB-VARIANCE-START public-url-resolver
function publicUrlPath(root, sourceRelative, target, attribute = null) {
  if (!sourceRelative.startsWith("public/") || !sourceRelative.endsWith(".html") || !target.startsWith("/")) return null;
  if (target.startsWith("//") || target.includes("\\") || target.split("/").some(segment => segment === ".." || segment === ".")) {
    fail(`unsafe public URL ${target}`);
  }
  const firstSegment = target.slice(1).split("/", 1)[0].toLowerCase();
  if (POSIX_ROOT_NAMES.has(firstSegment) || firstSegment === "users") fail(`filesystem path is not a public URL ${target}`);
  if (target === "/api/contact" && ["action", "formaction"].includes(attribute)) {
    const entry = resolveContained(root, "src/index.js", { expectedType: "file" });
    if (!/\burl\.pathname\s*===\s*["']\/api\/contact["']/.test(fs.readFileSync(entry, "utf8"))) fail("contact form route is not declared by the server entrypoint");
    return "src/index.js";
  }
  const candidate = `public${target}`.replace(/\/$/, "");
  resolveContained(root, candidate, { expectedType: target.endsWith("/") ? "directory" : "file" });
  return candidate;
}
// AEKR-WEB-VARIANCE-END public-url-resolver

function localLinkPath(root, sourceRelative, rawTarget, label) {
  let target = rawTarget;
  if (target.startsWith("<") && target.endsWith(">")) {
    target = target.slice(1, -1);
  }
  target = decodeHtmlReferenceEntities(target, label);
  if (target.startsWith("#")) return null;
  target = target.split("#", 1)[0].split("?", 1)[0];
  if (target.length === 0) return null;
  try {
    target = decodeURIComponent(target);
  } catch {
    fail(`${label}: malformed encoded link target ${rawTarget}`);
  }
  if (target.startsWith("//")) {
    fail(`${label}: unsafe network-path link ${rawTarget}`);
  }
  if (/^file:/i.test(target)) {
    fail(`${label}: unsafe file: link scheme ${rawTarget}`);
  }
  if (/^[a-z]:/i.test(target)) {
    fail(`${label}: unsafe absolute drive path ${rawTarget}`);
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return null;
  if (/&[A-Za-z][A-Za-z0-9]+;/.test(target)) {
    fail(`${label}: unsupported HTML entity in local link target ${rawTarget}`);
  }
  // AEKR-WEB-VARIANCE-START structured-public-url
  const publicPath = publicUrlPath(root, sourceRelative, target);
  if (publicPath !== null) return publicPath;
  // AEKR-WEB-VARIANCE-END structured-public-url
  if (target.includes("\\") || target.startsWith("/")) {
    fail(`${label}: absolute or unsafe local link ${rawTarget}`);
  }
  const expectsDirectory = target.endsWith("/");
  let candidate = path.posix.normalize(
    path.posix.join(path.posix.dirname(sourceRelative), target),
  );
  if (expectsDirectory && candidate.endsWith("/")) candidate = candidate.slice(0, -1);
  if (candidate === ".." || candidate.startsWith("../") || path.posix.isAbsolute(candidate)) {
    fail(`${label}: local link escapes project root ${rawTarget}`);
  }
  resolveContained(root, candidate, {
    expectedType: expectsDirectory ? "directory" : "file",
  });
  return candidate;
}

function srcsetTargets(value) {
  const targets = [];
  let cursor = 0;
  while (cursor < value.length) {
    while (cursor < value.length && /[\s,]/.test(value[cursor])) cursor += 1;
    if (cursor >= value.length) break;
    const start = cursor;
    const dataUrl = value.slice(cursor).toLowerCase().startsWith("data:");
    while (
      cursor < value.length &&
      !/\s/.test(value[cursor]) &&
      (dataUrl || value[cursor] !== ",")
    ) {
      cursor += 1;
    }
    const target = value.slice(start, cursor);
    if (target !== "") targets.push(target);
    while (cursor < value.length && value[cursor] !== ",") cursor += 1;
    if (cursor < value.length) cursor += 1;
  }
  return targets;
}

function decodeCssEscapes(value) {
  return value
    .replace(/\\(?:\r\n|[\r\n\f])/g, "")
    .replace(/\\([0-9a-f]{1,6})(?:[ \t\r\n\f])?/gi, (_match, digits) => {
      const codePoint = Number.parseInt(digits, 16);
      if (codePoint === 0 || codePoint > 0x10ffff) return "\ufffd";
      return String.fromCodePoint(codePoint);
    })
    .replace(/\\([^\r\n\f])/g, "$1");
}

function validateCssTarget(root, sourceRelative, rawTarget, label) {
  const target = decodeCssEscapes(rawTarget.trim());
  if (target === "" || target.startsWith("#") || /^data:/i.test(target)) return;
  if (target.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(target)) {
    fail(`${label}: external CSS dependency is forbidden: ${rawTarget}`);
  }
  localLinkPath(root, sourceRelative, target, label);
}

function validateCssReferences(root, sourceRelative, cssText, label) {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.replace(/[^\r\n]/g, " "),
  );
  for (const match of css.matchAll(
    /@import\s+(?!url\s*\()(?:(?:"((?:\\.|[^"\\])*)")|(?:'((?:\\.|[^'\\])*)'))/gi,
  )) {
    const target = match[1] ?? match[2] ?? "";
    validateCssTarget(root, sourceRelative, target, `${label}: CSS @import`);
  }
  for (const match of css.matchAll(
    /\burl\s*\(\s*(?:(?:"((?:\\.|[^"\\])*)")|(?:'((?:\\.|[^'\\])*)')|((?:\\.|[^)'"\s])+))\s*\)/gi,
  )) {
    const target = match[1] ?? match[2] ?? match[3] ?? "";
    validateCssTarget(root, sourceRelative, target, `${label}: CSS url()`);
  }
}

function conditionalSwitchCuePresent(prose, switchId) {
  if (switchId === "ORCHESTRATOR_MODE1") return /\bmode\s*1\b/i.test(prose);
  const normalizedProse = prose.toUpperCase().replace(/[-_\s]+/g, " ");
  const normalizedSwitch = switchId.replace(/_/g, " ");
  return prose.includes(switchId) || normalizedProse.includes(normalizedSwitch);
}

function conditionalExplicitStateMatches(prose, switchId, expectedState) {
  const switchForms = [
    switchId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    switchId
      .split("_")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("[-_\\s]+"),
  ];
  const explicitState = prose.match(
    new RegExp(
      `(?:${switchForms.join("|")})\\s*(?:is\\s+|=\\s*)?(ON|OFF)\\b`,
      "i",
    ),
  )?.[1];
  return explicitState === undefined || explicitState.toUpperCase() === expectedState;
}

function conditionalCuePresent(prose, target, switchId, expectedState) {
  const targetIndex = prose.indexOf(target);
  if (targetIndex < 0) return false;
  const sentenceStart = Math.max(
    prose.lastIndexOf(".", targetIndex - 1),
    prose.lastIndexOf("!", targetIndex - 1),
    prose.lastIndexOf("?", targetIndex - 1),
  );
  const sentenceEnds = [".", "!", "?"]
    .map((punctuation) => prose.indexOf(punctuation, targetIndex + target.length))
    .filter((position) => position >= 0);
  const sentenceEnd = sentenceEnds.length > 0 ? Math.min(...sentenceEnds) : prose.length;
  const sentence = prose.slice(sentenceStart + 1, sentenceEnd);
  const segment = sentence.split("|").find((candidate) => candidate.includes(target)) ?? sentence;
  if (!conditionalSwitchCuePresent(segment, switchId)) return false;
  if (!conditionalExplicitStateMatches(segment, switchId, expectedState)) return false;
  const hasConditionalForm =
    /\b(?:when|if|once|unless)\b/i.test(segment) ||
    /\bfor a project that\b/i.test(segment);
  if (!hasConditionalForm) return false;
  const negativeSeedPattern =
    /\b(?:unseeded|not\s+seeded|never\s+seeded|without\s+(?:being\s+)?seeded|isn['’]t\s+seeded|hasn['’]t\s+been\s+seeded|doesn['’]t\s+seed)\b/gi;
  const negativeSeed = negativeSeedPattern.test(segment);
  negativeSeedPattern.lastIndex = 0;
  const positiveRemainder = segment.replace(negativeSeedPattern, " ");
  const positiveSeed = /\bseed(?:ed|s)\b/i.test(positiveRemainder);
  const unless = /\bunless\b/i.test(segment);
  const nonLocalSeed =
    /\bseed(?:ed|s)\s+(?:elsewhere|in\s+(?:another|a\s+different)\s+project)\b/i.test(
      segment,
    ) || /\bnot\s+(?:here|in\s+this\s+project)\b/i.test(segment);
  if (nonLocalSeed) return false;
  if (
    /\b(?:do|must|need|should)\s+not\s+(?:be\s+)?(?:consulted|followed|loaded|read|used)\b/i.test(
      segment,
    ) ||
    /\b(?:and|or)\s+(?:also\s+)?when\s+(?:it|mode\s*1)\s+is\s+not\b/i.test(
      segment,
    )
  ) {
    return false;
  }
  if (positiveSeed && negativeSeed) return false;
  if (expectedState === "ON") return positiveSeed && !negativeSeed && !unless;
  return (negativeSeed && !positiveSeed) || (unless && positiveSeed && !negativeSeed);
}

function stringQuoteEnd(line, quoteStart) {
  const quote = line[quoteStart];
  for (let index = quoteStart + 1; index < line.length; index += 1) {
    if (line[index] !== quote) continue;
    let escapes = 0;
    for (let cursor = index - 1; cursor > quoteStart && line[cursor] === "\\"; cursor -= 1) {
      escapes += 1;
    }
    if (escapes % 2 === 0) return index;
  }
  return -1;
}

function isRegexCharacterClassSlash(line, slashIndex, extension) {
  const javascriptLike = [".html", ".js", ".jsx", ".mjs", ".ts", ".tsx"].includes(
    extension,
  );
  if (!javascriptLike && extension !== ".py") {
    return false;
  }
  const quoteStart = Math.max(
    line.lastIndexOf('"', slashIndex - 1),
    line.lastIndexOf("'", slashIndex - 1),
  );
  if (quoteStart < 0) return false;
  if (
    extension === ".py" &&
    !/\b(?:re|regex)\.(?:compile|findall|finditer|fullmatch|match|search|split|sub|subn)\(\s*[rubf]*$/i.test(
      line.slice(0, quoteStart),
    )
  ) {
    return false;
  }
  const quoteEnd = stringQuoteEnd(line, quoteStart);
  if (quoteEnd < slashIndex) return false;
  const openBracket = line.lastIndexOf("[", slashIndex - 1);
  const priorClose = line.lastIndexOf("]", slashIndex - 1);
  const nextClose = line.indexOf("]", slashIndex + 1);
  return (
    openBracket > quoteStart &&
    openBracket > priorClose &&
    nextClose > slashIndex &&
    nextClose < quoteEnd
  );
}

function isJavaScriptRegexDelimiter(candidate, line, slashIndex, extension) {
  if (![".html", ".js", ".jsx", ".mjs", ".ts", ".tsx"].includes(extension)) return false;
  if (!/^\/[dgimsuvy]*(?:\.(?:exec|test))?$/.test(candidate)) return false;
  let openingSlash = line.lastIndexOf("/", slashIndex - 1);
  while (openingSlash >= 0 && line[openingSlash - 1] === "\\") {
    openingSlash = line.lastIndexOf("/", openingSlash - 1);
  }
  if (openingSlash < 0) return false;
  const prefix = line.slice(0, openingSlash).trimEnd();
  return prefix === "" || /[!%&(*+,/:;<=>?[\]^{|~-]$/.test(prefix);
}

function isJavaScriptRegexOpening(line, slashIndex, extension) {
  if (![".html", ".js", ".jsx", ".mjs", ".ts", ".tsx"].includes(extension)) return false;
  const prefix = line.slice(0, slashIndex).trimEnd();
  if (
    prefix !== "" &&
    !/[!%&(*+,/:;<=>?[\]^{|~-]$/.test(prefix) &&
    !/\b(?:case|return|throw)\s*$/.test(prefix)
  ) {
    return false;
  }
  let escaped = false;
  let inCharacterClass = false;
  for (let cursor = slashIndex + 1; cursor < line.length; cursor += 1) {
    const character = line[cursor];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === "[") {
      inCharacterClass = true;
      continue;
    }
    if (character === "]") {
      inCharacterClass = false;
      continue;
    }
    if (character !== "/" || inCharacterClass) continue;
    const suffix = line.slice(cursor + 1);
    return /^[dgimsuvy]*(?:\s|$|[;,.?)}\]]|\.(?:exec|test)\b)/.test(suffix);
  }
  return false;
}

function isRubyRegexOpening(line, slashIndex, extension) {
  if (extension !== ".rb") return false;
  const prefix = line.slice(0, slashIndex).trimEnd();
  if (!/\b(?:(?:ROUTE|PATH|PATTERN)[A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*_(?:ROUTE|PATH|PATTERN)[A-Za-z0-9_]*)\s*=\s*$/i.test(prefix)) {
    return false;
  }
  let escaped = false;
  for (let cursor = slashIndex + 1; cursor < line.length; cursor += 1) {
    if (escaped) {
      escaped = false;
    } else if (line[cursor] === "\\") {
      escaped = true;
    } else if (line[cursor] === "/") {
      return true;
    }
  }
  return false;
}

function isLikelyAbsolutePosixPath(candidate, line, slashIndex, extension) {
  if (ALLOWED_SLASH_COMMANDS.has(candidate)) return false;
  const rootSegment = candidate.slice(1).split("/", 1)[0].toLowerCase();
  if (isRegexCharacterClassSlash(line, slashIndex, extension)) return false;
  if (isJavaScriptRegexOpening(line, slashIndex, extension)) return false;
  if (isJavaScriptRegexDelimiter(candidate, line, slashIndex, extension)) return false;
  if (isRubyRegexOpening(line, slashIndex, extension)) return false;
  const pathPrefix = line.slice(0, slashIndex);
  if (/(?:%[A-Za-z_][A-Za-z0-9_]*%|~)$/.test(pathPrefix)) return false;
  const prefix = slashIndex > 0 ? line[slashIndex - 1] : "";
  const tagName = candidate.slice(1);
  if (
    [".html", ".md"].includes(extension) &&
    prefix === "<" &&
    /^[A-Za-z][A-Za-z0-9:-]*$/.test(tagName) &&
    /^\s*>/.test(line.slice(slashIndex + candidate.length))
  ) {
    return false;
  }
  if (prefix === "`") {
    const precedingBackticks = (line.slice(0, slashIndex).match(/`/g) || []).length;
    if (precedingBackticks % 2 === 0) return false;
  }
  const routeCue = line.slice(Math.max(0, slashIndex - 100), slashIndex);
  if (
    /\b(?:GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s*$/i.test(routeCue) ||
    /(?:^|\W)(?:app|router|server)\.(?:get|post|put|patch|delete|options|head)\(\s*["']$/i.test(
      routeCue,
    ) ||
    /(?:^|\W)(?:app|router)\.route\(\s*["']$/i.test(routeCue) ||
    /@(?:Delete|Get|Patch|Post|Put|Request)Mapping\(\s*["']$/i.test(routeCue) ||
    [".html", ".js", ".jsx", ".mjs", ".ts", ".tsx"].includes(extension) &&
      /\bfetch\(\s*["']$/i.test(routeCue) ||
    /\b(?:(?:API|ROUTE|ENDPOINT|CALLBACK)[A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*(?:_API|_ROUTE|_ENDPOINT|_CALLBACK))\s*=\s*["']$/i.test(
      routeCue,
    )
  ) {
    return false;
  }
  if (POSIX_ROOT_NAMES.has(rootSegment)) return true;
  if (
    /\b(?:endpoint|route|http route|api route|callback path)\s*:\s*(?:GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)?\s*$/i.test(
      routeCue,
    ) ||
    /\bJSON key under paths:\s*$/i.test(routeCue)
  ) {
    return false;
  }
  return true;
}

function validateConditionalReferences(root, states) {
  let referenceCount = 0;
  let inactiveCount = 0;
  for (const { absolute, relative } of walkTextFiles(root)) {
    const text = readUtf8Text(absolute, relative);
    const extension = path.extname(relative).toLowerCase();
    const sourceLines =
      extension === ".md"
        ? markdownVisibleLines(text, relative)
        : extension === ".json"
          ? jsonReferenceLines(readJson(absolute, relative))
          : text.split(/\r?\n/);
    let scannedText = sourceLines.join("\n");
    let structuredReferenceText = scannedText;
    if (MARKUP_EXTENSIONS.has(extension)) {
      scannedText = maskHtmlComments(scannedText, relative);
      structuredReferenceText = scannedText;
      if (extension === ".md") {
        structuredReferenceText = maskMarkdownInlineCode(structuredReferenceText);
      }
      structuredReferenceText = maskHtmlRawTextElements(
        structuredReferenceText,
        relative,
      );
    }
    const scanLines = MARKUP_EXTENSIONS.has(extension)
      ? scannedText.split("\n")
      : [...sourceLines];
    const structuredReferenceLines = MARKUP_EXTENSIONS.has(extension)
      ? structuredReferenceText.split("\n")
      : [...scanLines];
    sourceLines.forEach((sourceLine, index) => {
      const scannedLine = scanLines[index] ?? "";
      const structuredReferenceLine = structuredReferenceLines[index] ?? "";
      const line = [".yaml", ".yml"].includes(extension)
        ? scannedLine.replace(/\\+/g, "\\")
        : scannedLine;
      const markers = [...sourceLine.matchAll(CONDITIONAL_MARKER)];
      const rawMarkerCount =
        (sourceLine.match(/AEKR-CONDITIONAL-REFERENCE/g) || []).length;
      if (rawMarkerCount !== markers.length) {
        fail(`${relative}:${index + 1}: malformed conditional reference marker`);
      }
      if (markers.length > 1) {
        fail(`${relative}:${index + 1}: at most one conditional reference marker is allowed per line`);
      }
      const inactiveTargets = new Set();
      for (const marker of markers) {
        const [fullMarker, switchId, expectedState, target] = marker;
        if (!states.has(switchId)) {
          fail(`${relative}:${index + 1}: conditional reference marker names unknown switch ${switchId}`);
        }
        requireSafeRelativePath(target, `${relative}:${index + 1} conditional target`);
        const prose = sourceLine.replace(fullMarker, "");
        if (!prose.includes(target)) {
          fail(`${relative}:${index + 1}: conditional reference marker has no matching prose path`);
        }
        if (prose.split(target).length !== 2) {
          fail(`${relative}:${index + 1}: conditional marker must bind exactly one prose path`);
        }
        if (!conditionalCuePresent(prose, target, switchId, expectedState)) {
          fail(
            `${relative}:${index + 1}: conditional reference prose lacks a seeded cue matching state=${expectedState}`,
          );
        }
        const suffix = sourceLine
          .slice((marker.index ?? 0) + fullMarker.length)
          .trim();
        if (suffix !== "" && suffix !== "|") {
          fail(`${relative}:${index + 1}: conditional reference marker must end its prose line`);
        }
        const active = states.get(switchId) === (expectedState === "ON");
        if (active) {
          resolveContained(root, target);
        } else {
          inactiveTargets.add(target);
          inactiveCount += 1;
        }
        referenceCount += 1;
      }

      const markdownLinks =
        extension === ".md"
          ? markdownLinkTargets(structuredReferenceLine, `${relative}:${index + 1}`)
          : [];
      for (const link of markdownLinks) {
        if (inactiveTargets.has(link.target)) continue;
        localLinkPath(root, relative, link.target, `${relative}:${index + 1}`);
      }
      for (const match of line.matchAll(PARENT_PATH)) {
        const candidate = match[1]
          .replace(/^(?:\.\/)+/, "")
          .replace(/[.,;:]+$/, "");
        const rootName = candidate.split("/", 1)[0];
        if (
          ["toolkit", "meta", "future_projects"].includes(rootName.toLowerCase()) &&
          !["toolkit", "meta", "future_projects"].includes(rootName)
        ) {
          fail(`${relative}:${index + 1}: non-portable parent path casing ${candidate}`);
        }
        if (pathExistsInside(root, candidate) || inactiveTargets.has(candidate)) continue;
        fail(`${relative}:${index + 1}: unresolved parent dependency ${candidate}`);
      }
      for (const match of line.matchAll(PARENT_WINDOWS_PATH)) {
        fail(`${relative}:${index + 1}: unsafe parent dependency with backslashes ${match[1]}`);
      }
      for (const match of line.matchAll(RELATIVE_PARENT_PATH)) {
        const normalized = path.posix.normalize(
          path.posix.join(
            path.posix.dirname(relative),
            match[1].replaceAll("\\", "/"),
          ),
        );
        if (
          normalized === ".." ||
          normalized.startsWith("../") ||
          !pathExistsInside(root, normalized)
        ) {
          fail(`${relative}:${index + 1}: unsafe parent path reference ${match[1]}`);
        }
      }
      for (const match of line.matchAll(INTERNAL_TRAVERSAL_PATH)) {
        const normalized = path.posix.normalize(
          path.posix.join(
            path.posix.dirname(relative),
            match[1].replaceAll("\\", "/"),
          ),
        );
        if (
          normalized === ".." ||
          normalized.startsWith("../") ||
          !pathExistsInside(root, normalized)
        ) {
          fail(`${relative}:${index + 1}: unsafe parent path reference ${match[1]}`);
        }
      }
      for (const absoluteMatch of line.matchAll(ABSOLUTE_POSIX_PATH)) {
        const slashOffset = absoluteMatch[0].indexOf("/");
        const slashIndex = (absoluteMatch.index ?? 0) + slashOffset;
        // AEKR-WEB-VARIANCE-START lexical-public-url
        const attributePrefix = line.slice(0, slashIndex);
        if (relative.startsWith("public/") && extension === ".html" && /\b(?:action|formaction|href|poster|src)\s*=\s*["']$/.test(attributePrefix)) {
          const tail = line.slice(slashIndex).match(/^[^"']*/)[0];
          let decoded;
          try { decoded = decodeURIComponent(decodeHtmlReferenceEntities(tail, relative).split(/[?#]/)[0]); }
          catch { fail(`${relative}: malformed public URL`); }
          if (publicUrlPath(root, relative, decoded, attributePrefix.match(/\b(action|formaction|href|poster|src)\s*=\s*["']$/)[1]) !== null) continue;
        }
        if (relative === "src/index.js" && absoluteMatch[1] === "/api/contact" && /\burl\.pathname\s*===\s*["']$/.test(attributePrefix)) continue;
        if (relative === "public/script.js" && absoluteMatch[1] === "/api/contact" && /^\s*const ENDPOINT = form\.getAttribute\("action"\) \|\| "\/api\/contact";\s*$/.test(line)) continue;
        if (relative === "src/index.js" && ["div", "p", "strong", "td", "tr", "table"].includes(absoluteMatch[1].slice(1)) && line[slashIndex - 1] === "<" && /^\s*>/.test(line.slice(slashIndex + absoluteMatch[1].length))) continue;
        if (relative === "public/_headers" && line.trim() === "/assets/*") {
          resolveContained(root, "public/assets", { expectedType: "directory" });
          continue;
        }
        // AEKR-WEB-VARIANCE-END lexical-public-url
        if (isLikelyAbsolutePosixPath(absoluteMatch[1], line, slashIndex, extension)) {
          fail(`${relative}:${index + 1}: unsafe absolute path reference`);
        }
      }
      if (/\bfile:\/{2,}/i.test(line)) {
        fail(`${relative}:${index + 1}: unsafe file: path scheme`);
      }
      const hostPathLine = extension === ".md" ? structuredReferenceLine : line;
      if (
        /(?:^|[^A-Za-z0-9_])(?:~(?:[A-Za-z0-9._-]+)?[\\/]|\$(?:HOME|\{HOME\})[\\/]|%[A-Za-z_][A-Za-z0-9_]*%[\\/])/i.test(
          hostPathLine,
        ) ||
        /(?<!:)\/\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/.test(hostPathLine)
      ) {
        fail(`${relative}:${index + 1}: unsafe host-dependent path reference`);
      }
      if (
        /\[[A-Za-z0-9_.-]*\/(?:etc|home|root|tmp|usr|var|workspace)(?:\/[A-Za-z0-9_.-]+)+\]/i.test(
          line,
        )
      ) {
        fail(`${relative}:${index + 1}: unsafe embedded host path reference`);
      }
      if (
        /(?<![A-Za-z0-9_.\/\\])(?:[A-Za-z]:[\\/]|\\\\\?\\[A-Za-z]:\\|\\\\[A-Za-z0-9_.-]+\\|\\[A-Za-z][A-Za-z0-9_. -]{1,}\\[A-Za-z0-9_. -])/.test(line)
      ) {
        fail(`${relative}:${index + 1}: unsafe parent or absolute path reference`);
      }
    });
    if (extension === ".css") {
      validateCssReferences(root, relative, text, relative);
    }
    if (MARKUP_EXTENSIONS.has(extension)) {
      for (const styleTag of htmlTags(structuredReferenceText, relative).filter(
        (tag) => /^<style\b/i.test(tag.text),
      )) {
        const bodyStart = styleTag.index + styleTag.text.length;
        const closing = /<\/style\s*>/gi;
        closing.lastIndex = bodyStart;
        const closeMatch = closing.exec(structuredReferenceText);
        if (closeMatch === null) {
          fail(`${relative}: unclosed HTML style element`);
        }
        const lineNumber = scannedText.slice(0, styleTag.index).split("\n").length;
        validateCssReferences(
          root,
          relative,
          scannedText.slice(bodyStart, closeMatch.index),
          `${relative}:${lineNumber} embedded CSS`,
        );
      }
    }
    if (extension === ".md") {
      for (const link of markdownLinkTargets(structuredReferenceText, relative)) {
        if (!link.multiline) continue;
        localLinkPath(root, relative, link.target, `${relative}:multiline link`);
      }
      for (const definition of markdownReferenceDefinitionTargets(
        structuredReferenceText,
        relative,
      )) {
        localLinkPath(
          root,
          relative,
          definition.target,
          `${relative}:${definition.line}`,
        );
      }
    }
    if (MARKUP_EXTENSIONS.has(extension)) {
      const visibleText = structuredReferenceLines.join("\n");
      for (const htmlTag of htmlTags(visibleText, relative)) {
        const lineNumber = visibleText.slice(0, htmlTag.index).split("\n").length;
        const styleAttribute = htmlTag.text.match(
          /(?:^|\s)style\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
        );
        if (styleAttribute !== null) {
          validateCssReferences(
            root,
            relative,
            decodeHtmlReferenceEntities(
              styleAttribute[1] ?? styleAttribute[2] ?? "",
              `${relative}:${lineNumber}`,
            ),
            `${relative}:${lineNumber} inline CSS`,
          );
        }
        for (const htmlReference of htmlTag.text.matchAll(HTML_REFERENCE)) {
          const attribute = htmlReference[1].toLowerCase();
          const rawTarget =
            htmlReference.slice(2).find((value) => value !== undefined) ?? "";
          const targets =
            attribute === "srcset"
              ? srcsetTargets(rawTarget)
              : [rawTarget];
          for (const target of targets) {
            // AEKR-WEB-VARIANCE-START html-form-endpoint
            if (["action", "formaction"].includes(attribute) && publicUrlPath(root, relative, target, attribute) !== null) continue;
            // AEKR-WEB-VARIANCE-END html-form-endpoint
            localLinkPath(root, relative, target, `${relative}:${lineNumber}`);
          }
        }
      }
    }
  }
  return { referenceCount, inactiveCount };
}

export function validateGeneratedProject(projectRoot) {
  validateExecutingValidatorIntegrity();
  const root = path.resolve(projectRoot);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    fail("generated project root must be an existing directory");
  }
  const { manifest, entryPaths } = readManifest(root);
  validateProjectionCatalog();
  const { states, classes, digest: switchboardDigest } = parseSwitchboard(root);
  rejectUnprojectedEnabledCapabilities(states, classes);
  validateProfile(root, manifest, states);
  validateMode(root, manifest.execution_mode, states);
  if (manifest.execution_mode === MODE1) validateMode1RuntimeProjection(root);
  validateNonRuntimeProjection(root, manifest.execution_mode, states);
  validateToolEntries(root, entryPaths);
  const references = validateConditionalReferences(root, states);
  validateBranding(root, states);
  return {
    profile: manifest.governance_profile,
    mode: manifest.execution_mode,
    entryCount: entryPaths.length,
    conditionalReferenceCount: references.referenceCount,
    inactiveConditionalReferenceCount: references.inactiveCount,
    switchCapabilityParity: manifest.switch_capability_parity,
    switchboardDigest,
  };
}

function runCli() {
  const [projectRoot, ...extra] = process.argv.slice(2);
  if (!projectRoot || extra.length > 0) {
    fail("usage: node validate-generated-project.mjs <generated-project-root>");
  }
  const result = validateGeneratedProject(projectRoot);
  console.log(
    `Generated project F1-A PASS: ${result.profile}/${result.mode}; ` +
      `${result.entryCount} tool entr${result.entryCount === 1 ? "y" : "ies"}; ` +
      `${result.conditionalReferenceCount} conditional references checked; ` +
      `switch/capability parity VALIDATOR_VERIFIED at MASTER_SWITCH SHA-256 ${result.switchboardDigest}; ` +
      "structural snapshot only; inherited confidence, provider selection, scheduler configuration, and runtime execution are not asserted.",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    runCli();
  } catch (error) {
    console.error(`Generated project F1-A FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
