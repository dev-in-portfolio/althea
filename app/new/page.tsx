"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useUserKey from "../../lib/userKey";

export default function NewProblemPage() {
  const userKey = useUserKey();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [availableMinutes, setAvailableMinutes] = useState(120);
  const [tasks, setTasks] = useState<any[]>([{ label: "", duration: 30, must: false }]);
  const [error, setError] = useState<string | null>(null);

  const updateTask = (index: number, field: string, value: any) => {
    setTasks((prev) =>
      prev.map((task, idx) => (idx === index ? { ...task, [field]: value } : task))
    );
  };

  const addTask = () => {
    setTasks((prev) => [...prev, { label: "", duration: 30, must: false }]);
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const create = async () => {
    const cleanTasks = tasks
      .map((task) => ({
        label: String(task.label || "").trim(),
        duration_min: Number(task.duration || 0),
        must: Boolean(task.must)
      }))
      .filter((task) => task.label && task.duration_min > 0);

    const res = await fetch("/api/problems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userKey,
        title,
        availableMinutes,
        tasks: cleanTasks
      })
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      setError(data?.error || "Could not create problem.");
      return;
    }
    router.push(`/problems/${data.id}`);
  };

  return (
    <div className="stack">
      <div className="hero">
        <h1>New Problem</h1>
        <h2>Pack tasks into a fixed time window.</h2>
      </div>

      {error ? <div className="banner">{error}</div> : null}

      <section className="panel stack">
        <label>
          <small>Title</small>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Morning plan" />
        </label>
        <label>
          <small>Available minutes</small>
          <input
            type="number"
            min={15}
            value={availableMinutes}
            onChange={(e) => setAvailableMinutes(Number(e.target.value))}
          />
        </label>
      </section>

      <section className="panel stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Tasks</strong>
          <button type="button" className="secondary" onClick={addTask}>Add task</button>
        </div>
        {tasks.map((task, index) => (
          <div key={index} className="grid-two">
            <label>
              <small>Label</small>
              <input value={task.label} onChange={(e) => updateTask(index, "label", e.target.value)} />
            </label>
            <label>
              <small>Duration (min)</small>
              <input
                type="number"
                min={5}
                value={task.duration}
                onChange={(e) => updateTask(index, "duration", Number(e.target.value))}
              />
            </label>
            <label>
              <small>Must</small>
              <select value={task.must ? "yes" : "no"} onChange={(e) => updateTask(index, "must", e.target.value === "yes")}>
                <option value="no">Optional</option>
                <option value="yes">Must</option>
              </select>
            </label>
            <button type="button" className="secondary" onClick={() => removeTask(index)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={create}>Create problem</button>
      </section>
    </div>
  );
}
