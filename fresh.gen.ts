import * as $0 from "./routes/index.tsx";
import * as $1 from "./routes/edit/[id].tsx";
import * as $2 from "./routes/p/[slug].tsx";
import * as $3 from "./routes/api/pages.ts";
import * as $4 from "./routes/api/cards.ts";
import * as $5 from "./routes/api/publish/[id].ts";
import * as $6 from "./islands/CreatePage.tsx";
import * as $7 from "./islands/Editor.tsx";

const manifest = {
  routes: {
    "./routes/index.tsx": $0,
    "./routes/edit/[id].tsx": $1,
    "./routes/p/[slug].tsx": $2,
    "./routes/api/pages.ts": $3,
    "./routes/api/cards.ts": $4,
    "./routes/api/publish/[id].ts": $5,
  },
  islands: {
    "./islands/CreatePage.tsx": $6,
    "./islands/Editor.tsx": $7,
  },
  baseUrl: import.meta.url,
};

export default manifest;
