import * as $0 from "./routes/index.tsx";
import * as $1 from "./routes/rules/new.tsx";
import * as $2 from "./routes/rules/[id].tsx";
import * as $3 from "./routes/test.tsx";
import * as $4 from "./routes/runs.tsx";
import * as $5 from "./routes/api/rules.ts";
import * as $6 from "./routes/api/rules/[id].ts";
import * as $7 from "./routes/api/test.ts";
import * as $8 from "./islands/RuleForm.tsx";
import * as $9 from "./islands/TestHarness.tsx";

const manifest = {
  routes: {
    "./routes/index.tsx": $0,
    "./routes/rules/new.tsx": $1,
    "./routes/rules/[id].tsx": $2,
    "./routes/test.tsx": $3,
    "./routes/runs.tsx": $4,
    "./routes/api/rules.ts": $5,
    "./routes/api/rules/[id].ts": $6,
    "./routes/api/test.ts": $7,
  },
  islands: {
    "./islands/RuleForm.tsx": $8,
    "./islands/TestHarness.tsx": $9,
  },
  baseUrl: import.meta.url,
};

export default manifest;
