import type { InstantRules } from "@instantdb/react";

const rules = {
  "**": {
    allow: {
      read: "true",
      create: "isLoggedIn",
      update: "isLoggedIn",
      delete: "isLoggedIn",
    },
    bind: ["isLoggedIn", "auth.id != null"],
  },
} satisfies InstantRules;

export default rules;
