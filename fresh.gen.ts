import * as $0 from "./routes/index.tsx";
import * as $1 from "./routes/views.tsx";
import * as $2 from "./routes/api/views.ts";
import * as $3 from "./routes/api/items.ts";
import * as $4 from "./islands/Filters.tsx";

const manifest = {
  routes: {
    "./routes/index.tsx": $0,
    "./routes/views.tsx": $1,
    "./routes/api/views.ts": $2,
    "./routes/api/items.ts": $3,
  },
  islands: {
    "./islands/Filters.tsx": $4,
  },
  baseUrl: import.meta.url,
};

export default manifest;
