import { Agent } from "@mastra/core/agent";
import { ORACLE_SYSTEM_PROMPT } from "./prompts";

export const oracleAgent = new Agent({
  id: "oracle-agent",
  name: "神様エージェント",
  instructions: ORACLE_SYSTEM_PROMPT,
  model: "anthropic/claude-sonnet-4-6",
});
