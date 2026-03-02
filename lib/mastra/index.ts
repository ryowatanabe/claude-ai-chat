import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { oracleAgent } from "./agent";

export const mastra = new Mastra({
  agents: {
    oracleAgent,
  },
  storage: new LibSQLStore({
    id: "oracle-storage",
    url: ":memory:",
  }),
});
