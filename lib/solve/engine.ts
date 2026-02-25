export type Task = {
  id: string;
  label: string;
  duration: number;
  must: boolean;
};

export type Solution = {
  tasks: Task[];
  remaining: number;
  explanation: string[];
};

function sumDuration(tasks: Task[]) {
  return tasks.reduce((sum, task) => sum + task.duration, 0);
}

function dedupeSolutions(solutions: Solution[]) {
  const seen = new Set<string>();
  const unique: Solution[] = [];
  for (const solution of solutions) {
    const key = solution.tasks.map((task) => task.id).sort().join("|");
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(solution);
    }
  }
  return unique;
}

function explain(rule: string, tasks: Task[], remaining: number) {
  return [
    `Rule: ${rule}.`,
    `Selected ${tasks.length} tasks totaling ${sumDuration(tasks)} minutes.`,
    `Remaining time: ${remaining} minutes.`
  ];
}

export function solveTasks(available: number, tasks: Task[]) {
  const must = tasks.filter((task) => task.must);
  const optional = tasks.filter((task) => !task.must);

  const mustTotal = sumDuration(must);
  if (mustTotal > available) {
    return {
      conflict: true,
      message: `Must tasks need ${mustTotal} minutes but only ${available} are available.`,
      conflictDetails: {
        mustTotal,
        available,
        overload: mustTotal - available,
        mustTasks: must.map((task) => ({
          label: task.label,
          duration: task.duration
        }))
      },
      solutions: [] as Solution[]
    };
  }

  const space = available - mustTotal;
  const variants: Array<{ rule: string; list: Task[] }> = [
    { rule: "Shortest-first", list: [...optional].sort((a, b) => a.duration - b.duration) },
    { rule: "Longest-first", list: [...optional].sort((a, b) => b.duration - a.duration) },
    { rule: "Alphabetical", list: [...optional].sort((a, b) => a.label.localeCompare(b.label)) },
    { rule: "Balanced", list: [...optional].sort((a, b) => Math.abs(a.duration - 45) - Math.abs(b.duration - 45)) }
  ];

  const solutions: Solution[] = [];
  for (const variant of variants) {
    const picked: Task[] = [...must];
    let remaining = space;
    for (const task of variant.list) {
      if (task.duration <= remaining) {
        picked.push(task);
        remaining -= task.duration;
      }
    }
    solutions.push({
      tasks: picked,
      remaining,
      explanation: explain(variant.rule, picked, remaining)
    });
  }

  const unique = dedupeSolutions(solutions).sort((a, b) => {
    const usedA = available - a.remaining;
    const usedB = available - b.remaining;
    if (usedB !== usedA) return usedB - usedA;
    return a.tasks.length - b.tasks.length;
  });

  return {
    conflict: false,
    message: "ok",
    solutions: unique.slice(0, 10)
  };
}
