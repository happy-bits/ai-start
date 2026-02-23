#!/usr/bin/env bun
/// <reference types="node" />
import { readFileSync } from "fs";

/**
 * safe-shell: Modular beforeShellExecution hook
 * Runs security rules against commands before they execute.
 * Add new rules to the RULES array.
 */

interface RuleResult {
  permission: "allow" | "deny" | "ask";
  userMessage?: string;
  agentMessage?: string;
}

type Rule = (command: string) => RuleResult | null;

// ---------------------------------------------------------------------------
// Rules - add new rules here
// ---------------------------------------------------------------------------

const CURL_BASH_PATTERN =
  /\b(?:curl|wget)\s+[^|]+\s*\|\s*(?:bash|sh|zsh)(?:\s|$)/i;

function curlBashRule(command: string): RuleResult | null {
  if (!CURL_BASH_PATTERN.test(command)) return null;
  return {
    permission: "ask",
    userMessage:
      "This command pipes remote content directly into a shell (curl|wget ... | bash). This can execute arbitrary code from the internet. Confirm only if you trust the source.",
    agentMessage:
      "The command uses curl-bash pattern. User will be prompted to confirm. Suggest downloading and inspecting the script first if they proceed.",
  };
}

const RULES: Rule[] = [curlBashRule];

// ---------------------------------------------------------------------------
// Hook runner
// ---------------------------------------------------------------------------

interface BeforeShellPayload {
  command: string;
  cwd?: string;
  hook_event_name: string;
  [key: string]: unknown;
}

interface HookResponse {
  continue: boolean;
  permission: "allow" | "deny" | "ask";
  userMessage?: string;
  agentMessage?: string;
}

function main() {
  const rawInput = readFileSync(0, "utf8");

  let payload: BeforeShellPayload;
  try {
    payload = JSON.parse(rawInput) as BeforeShellPayload;
  } catch {
    console.log(JSON.stringify({ permission: "allow", continue: true }));
    process.exit(0);
    return;
  }

  if (payload.hook_event_name !== "beforeShellExecution") {
    console.log(JSON.stringify({ permission: "allow", continue: true }));
    process.exit(0);
  }

  const command = payload.command ?? "";
  let response: HookResponse = { continue: true, permission: "allow" };

  for (const rule of RULES) {
    const result = rule(command);
    if (result) {
      response = {
        continue: result.permission !== "deny",
        permission: result.permission,
        userMessage: result.userMessage,
        agentMessage: result.agentMessage,
      };
      break;
    }
  }

  console.log(JSON.stringify(response));
}

main();
