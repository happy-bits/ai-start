#!/usr/bin/env bun
/// <reference types="node" />
import { readFileSync } from "fs";

/**
 * warn-test-edits: preToolUse hook that blocks edits to test files.
 * Detects files matching *.test.* or *.spec.* (name-based).
 * Agent only (Cmd+K / Agent Chat).
 */

const TEST_FILE_PATTERN = /\.(test|spec)\.(ts|tsx|js|jsx|mts|cts|mjs|cjs)$/i;

function isTestFile(filePath: string): boolean {
  if (!filePath || typeof filePath !== "string") return false;
  return TEST_FILE_PATTERN.test(filePath);
}

function getFilePath(toolInput: unknown): string | null {
  if (!toolInput || typeof toolInput !== "object") return null;
  const input = toolInput as Record<string, unknown>;
  const path = input.path ?? input.file_path;
  if (typeof path === "string") return path;
  return null;
}

interface PreToolUsePayload {
  tool_name: string;
  tool_input?: unknown;
  hook_event_name: string;
  [key: string]: unknown;
}

interface PreToolUseOutput {
  decision: "allow" | "deny";
  reason?: string;
}

function main() {
  const rawInput = readFileSync(0, "utf8");

  let payload: PreToolUsePayload;
  try {
    payload = JSON.parse(rawInput) as PreToolUsePayload;
  } catch {
    console.log(JSON.stringify({ decision: "allow" }));
    process.exit(0);
    return;
  }

  if (payload.hook_event_name !== "preToolUse") {
    console.log(JSON.stringify({ decision: "allow" }));
    process.exit(0);
  }

  const filePath = getFilePath(payload.tool_input);
  if (!filePath) {
    console.log(JSON.stringify({ decision: "allow" }));
    process.exit(0);
  }

  if (isTestFile(filePath)) {
    const output: PreToolUseOutput = {
      decision: "deny",
      reason:
        "Editing test files is blocked by project policy. Modify implementation code instead; the agent should not change *.test.* or *.spec.* files.",
    };
    console.log(JSON.stringify(output));
    process.exit(2); // Exit 2 is required for Cursor to actually block the tool execution
  }

  console.log(JSON.stringify({ decision: "allow" }));
}

main();
