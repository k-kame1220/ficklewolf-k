import { execFileSync } from "node:child_process";

import type { TestProject } from "vitest/node";

const MASTER_VERSION_PATTERN = /master version: ([0-9a-f]{16})/u;

export default function setup(project: TestProject) {
  const output = execFileSync("python3", ["../spec/tools/validate.py"], { encoding: "utf-8" });
  project.provide("specMasterVersion", MASTER_VERSION_PATTERN.exec(output)?.[1] ?? "");
}
