"use client";

import { useEffect, useState } from "react";
import useUserKey from "../../../lib/userKey";

export default function ProblemPage({ params }: { params: { id: string } }) {
  const userKey = useUserKey();
  const [problem, setProblem] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [availableMinutes, setAvailableMinutes] = useState(0);

  const load = async () => {
    if (!userKey) return;
    const res = await fetch(`/api/problems/${params.id}?userKey=${userKey}`);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (res.ok && data) {
      setProblem(data.problem);
      setTasks(data.tasks || []);
      setTitle(data.problem?.title || "");
      setAvailableMinutes(data.problem?.params?.availableMinutes || 0);
      setStatus(null);
    } else {
      setStatus("Could not load problem.");
    }
  };

  const updateTask = (index: number, field: string, value: any) => {
    setTasks((prev) =>
      prev.map((task, idx) => (idx === index ? { ...task, [field]: value } : task))
    );
  };

  const addTask = () => {
    setTasks((prev) => [...prev, { id: crypto.randomUUID(), label: "", duration_min: 30, must: false }]);
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const save = async () => {
    const cleanTasks = tasks
      .map((task) => ({
        label: String(task.label || "").trim(),
        duration_min: Number(task.duration_min || 0),
        must: Boolean(task.must)
      }))
      .filter((task) => task.label && task.duration_min > 0);

    const res = await fetch(`/api/problems/${params.id}`, {
      method: "PUT",
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
      setStatus(data?.error || "Update failed.");
      return;
    }
    setEditing(false);
    load();
  };

  const solve = async () => {
    const res = await fetch(`/api/problems/${params.id}/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userKey })
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      setStatus(data?.message || data?.error || "Solve failed.");
      return;
    }
    if (data.conflict) {
      const detail = data.conflictDetails;
      if (detail) {
        setStatus(
          `${data.message} Over by ${detail.overload} minutes. Consider removing ${detail.mustTasks?.length} must tasks.`
        );
      } else {
        setStatus(data.message);
      }
    } else {
      setStatus("Solutions generated.");
    }
  };

  useEffect(() => {
    load();
  }, [userKey]);

  return (
    <div className="stack">
      <div className="hero">
        <h1>{problem?.title || "Problem"}</h1>
        <h2>Available {problem?.params?.availableMinutes ?? "?"} minutes</h2>
      </div>

      {status ? <div className="banner">{status}</div> : null}

      <section className="panel stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Tasks</strong>
          <div className="row">
            <button type="button" className="secondary" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel edit" : "Edit"}
            </button>
            <button type="button" onClick={solve}>Generate options</button>
          </div>
        </div>
        {editing ? (
          <div className="stack">
            <label>
              <small>Title</small>
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
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
            <button type="button" className="secondary" onClick={addTask}>Add task</button>
            {tasks.map((task, index) => (
              <div key={task.id || index} className="grid-two">
                <label>
                  <small>Label</small>
                  <input value={task.label} onChange={(e) => updateTask(index, "label", e.target.value)} />
                </label>
                <label>
                  <small>Duration (min)</small>
                  <input
                    type="number"
                    min={5}
                    value={task.duration_min}
                    onChange={(e) => updateTask(index, "duration_min", Number(e.target.value))}
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
            <button type="button" onClick={save}>Save changes</button>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{task.label}</strong>
                <span className="pill">{task.duration_min} min</span>
              </div>
              <div className="row">
                {task.must ? <span className="pill">Must</span> : <span className="pill">Optional</span>}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
