type JsonValue = Record<string, any>;

const OPERATORS = ["==", "!=", ">=", "<=", ">", "<", "in", "contains"];

function getValueByPath(obj: JsonValue, path: string) {
  return path.split(".").reduce((acc: any, key) => (acc ? acc[key] : undefined), obj);
}

function parseLiteral(raw: string) {
  const trimmed = raw.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (!Number.isNaN(Number(trimmed))) return Number(trimmed);
  if (trimmed.startsWith("[") || trimmed.startsWith("{") || trimmed.startsWith("\"")) {
    return JSON.parse(trimmed);
  }
  return trimmed.replace(/^["']|["']$/g, "");
}

function evalClause(left: string, op: string, right: string, data: JsonValue) {
  if (op === "exists") {
    return getValueByPath(data, left) !== undefined;
  }
  const leftValue = getValueByPath(data, left);
  const rightValue = parseLiteral(right);

  switch (op) {
    case "==":
      return leftValue === rightValue;
    case "!=":
      return leftValue !== rightValue;
    case ">":
      return Number(leftValue) > Number(rightValue);
    case "<":
      return Number(leftValue) < Number(rightValue);
    case ">=":
      return Number(leftValue) >= Number(rightValue);
    case "<=":
      return Number(leftValue) <= Number(rightValue);
    case "in":
      return Array.isArray(rightValue) ? rightValue.includes(leftValue) : false;
    case "contains":
      return typeof leftValue === "string" && typeof rightValue === "string"
        ? leftValue.includes(rightValue)
        : false;
    default:
      return false;
  }
}

export function evaluateExpression(expr: string, data: JsonValue) {
  const tokens = expr.split(/\s+(and|or)\s+/i);
  let result = false;
  let pendingOp: string | null = null;

  for (const token of tokens) {
    if (token.toLowerCase() === "and" || token.toLowerCase() === "or") {
      pendingOp = token.toLowerCase();
      continue;
    }
    const clause = token.trim();
    if (!clause) continue;

    let clauseResult = false;
    if (clause.startsWith("exists(")) {
      const field = clause.slice(7, -1);
      clauseResult = evalClause(field, "exists", "", data);
    } else {
      const op = OPERATORS.find((operator) => clause.includes(` ${operator} `));
      if (!op) {
        clauseResult = false;
      } else {
        const [left, right] = clause.split(` ${op} `);
        clauseResult = evalClause(left.trim(), op, right.trim(), data);
      }
    }

    if (pendingOp === "and") {
      result = result && clauseResult;
    } else if (pendingOp === "or") {
      result = result || clauseResult;
    } else {
      result = clauseResult;
    }
  }

  return result;
}
