import { HandlerContext, PageProps } from "$fresh/server.ts";
import { sql } from "../../lib/db.ts";
import RuleForm from "../../islands/RuleForm.tsx";

type Rule = {
  id: string;
  name: string;
  priority: number;
  is_enabled: boolean;
  when_expr: string;
  then_json: Record<string, unknown>;
};

type Data = {
  rule: Rule | null;
};

export const handler = async (_req: Request, ctx: HandlerContext) => {
  const { id } = ctx.params;
  const rows = await sql<Rule[]>`
    select id, name, priority, is_enabled, when_expr, then_json
    from rf_rules
    where id = ${id}
  `;
  return ctx.render({ rule: rows[0] ?? null });
};

export default function EditRule({ data }: PageProps<Data>) {
  if (!data.rule) {
    return (
      <div class="page">
        <h1>Rule not found</h1>
      </div>
    );
  }
  return (
    <div class="page">
      <header class="hero">
        <h1>Edit Rule</h1>
      </header>
      <RuleForm rule={data.rule} />
    </div>
  );
}
