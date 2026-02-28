#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize)]
struct Entry {
    id: i64,
    title: String,
    project: String,
    decision: String,
    reason: String,
    expected_outcome: String,
    confidence: i64,
    tags: String,
    created_at: String,
}

#[derive(Serialize, Deserialize)]
struct Outcome {
    id: i64,
    entry_id: i64,
    result: String,
    lessons: String,
    repeat: bool,
    recorded_at: String,
}

fn db_path(app: &AppHandle) -> PathBuf {
    let mut dir = app.path_resolver().app_data_dir().unwrap();
    dir.push("database");
    fs::create_dir_all(&dir).ok();
    dir.push("ledger.sqlite");
    dir
}

fn init_db(app: &AppHandle) -> Connection {
    let path = db_path(app);
    let conn = Connection::open(path).expect("failed to open database");
    conn.execute_batch(
        r#"
        create table if not exists ledger_entries (
          id integer primary key autoincrement,
          title text not null,
          project text not null,
          decision text not null,
          reason text not null,
          expected_outcome text not null,
          confidence integer not null,
          tags text not null,
          created_at text not null default (datetime('now'))
        );
        create table if not exists ledger_outcomes (
          id integer primary key autoincrement,
          entry_id integer not null,
          result text not null,
          lessons text not null,
          repeat integer not null default 1,
          recorded_at text not null default (datetime('now')),
          foreign key(entry_id) references ledger_entries(id)
        );
        "#,
    )
    .unwrap();
    conn
}

#[tauri::command]
fn create_entry(
    app: AppHandle,
    title: String,
    project: String,
    decision: String,
    reason: String,
    expected_outcome: String,
    confidence: i64,
    tags: String,
) {
    let conn = init_db(&app);
    conn.execute(
        "insert into ledger_entries (title, project, decision, reason, expected_outcome, confidence, tags)
         values (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            title,
            project,
            decision,
            reason,
            expected_outcome,
            confidence,
            tags
        ],
    )
    .unwrap();
}

#[tauri::command]
fn list_entries(app: AppHandle, project: Option<String>, tag: Option<String>, search: Option<String>) -> Vec<Entry> {
    let conn = init_db(&app);
    let mut stmt = conn
        .prepare(
            r#"
            select id, title, project, decision, reason, expected_outcome, confidence, tags, created_at
            from ledger_entries
            where (?1 is null or project = ?1)
              and (?2 is null or tags like '%' || ?2 || '%')
              and (?3 is null or title like '%' || ?3 || '%' or decision like '%' || ?3 || '%')
            order by datetime(created_at) desc
            "#,
        )
        .unwrap();
    let rows = stmt
        .query_map(params![project, tag, search], |row| {
            Ok(Entry {
                id: row.get(0)?,
                title: row.get(1)?,
                project: row.get(2)?,
                decision: row.get(3)?,
                reason: row.get(4)?,
                expected_outcome: row.get(5)?,
                confidence: row.get(6)?,
                tags: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .unwrap();
    rows.map(|r| r.unwrap()).collect()
}

#[tauri::command]
fn add_outcome(app: AppHandle, entry_id: i64, result: String, lessons: String, repeat: bool) {
    let conn = init_db(&app);
    conn.execute(
        "insert into ledger_outcomes (entry_id, result, lessons, repeat)
         values (?1, ?2, ?3, ?4)",
        params![entry_id, result, lessons, if repeat { 1 } else { 0 }],
    )
    .unwrap();
}

#[tauri::command]
fn list_outcomes(app: AppHandle) -> Vec<Outcome> {
    let conn = init_db(&app);
    let mut stmt = conn
        .prepare(
            "select id, entry_id, result, lessons, repeat, recorded_at from ledger_outcomes order by recorded_at desc",
        )
        .unwrap();
    let rows = stmt
        .query_map([], |row| {
            Ok(Outcome {
                id: row.get(0)?,
                entry_id: row.get(1)?,
                result: row.get(2)?,
                lessons: row.get(3)?,
                repeat: row.get::<_, i64>(4)? == 1,
                recorded_at: row.get(5)?,
            })
        })
        .unwrap();
    rows.map(|r| r.unwrap()).collect()
}

#[tauri::command]
fn search_low_confidence(app: AppHandle) -> Vec<Entry> {
    let conn = init_db(&app);
    let mut stmt = conn
        .prepare(
            "select id, title, project, decision, reason, expected_outcome, confidence, tags, created_at
             from ledger_entries
             where confidence <= 4
             order by datetime(created_at) desc",
        )
        .unwrap();
    let rows = stmt
        .query_map([], |row| {
            Ok(Entry {
                id: row.get(0)?,
                title: row.get(1)?,
                project: row.get(2)?,
                decision: row.get(3)?,
                reason: row.get(4)?,
                expected_outcome: row.get(5)?,
                confidence: row.get(6)?,
                tags: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .unwrap();
    rows.map(|r| r.unwrap()).collect()
}

#[tauri::command]
fn search_failed(app: AppHandle) -> Vec<Entry> {
    let conn = init_db(&app);
    let mut stmt = conn
        .prepare(
            r#"
            select distinct e.id, e.title, e.project, e.decision, e.reason, e.expected_outcome, e.confidence, e.tags, e.created_at
            from ledger_entries e
            join ledger_outcomes o on o.entry_id = e.id
            where o.repeat = 0
            order by datetime(e.created_at) desc
            "#,
        )
        .unwrap();
    let rows = stmt
        .query_map([], |row| {
            Ok(Entry {
                id: row.get(0)?,
                title: row.get(1)?,
                project: row.get(2)?,
                decision: row.get(3)?,
                reason: row.get(4)?,
                expected_outcome: row.get(5)?,
                confidence: row.get(6)?,
                tags: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .unwrap();
    rows.map(|r| r.unwrap()).collect()
}

#[tauri::command]
fn search_by_tag(app: AppHandle, tag: String) -> Vec<Entry> {
    let conn = init_db(&app);
    let mut stmt = conn
        .prepare(
            "select id, title, project, decision, reason, expected_outcome, confidence, tags, created_at
             from ledger_entries
             where tags like '%' || ?1 || '%'
             order by datetime(created_at) desc",
        )
        .unwrap();
    let rows = stmt
        .query_map(params![tag], |row| {
            Ok(Entry {
                id: row.get(0)?,
                title: row.get(1)?,
                project: row.get(2)?,
                decision: row.get(3)?,
                reason: row.get(4)?,
                expected_outcome: row.get(5)?,
                confidence: row.get(6)?,
                tags: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .unwrap();
    rows.map(|r| r.unwrap()).collect()
}

#[tauri::command]
fn export_json(app: AppHandle) -> String {
    let conn = init_db(&app);
    let mut entries_stmt = conn
        .prepare("select id, title, project, decision, reason, expected_outcome, confidence, tags, created_at from ledger_entries")
        .unwrap();
    let entries: Vec<Entry> = entries_stmt
        .query_map([], |row| {
            Ok(Entry {
                id: row.get(0)?,
                title: row.get(1)?,
                project: row.get(2)?,
                decision: row.get(3)?,
                reason: row.get(4)?,
                expected_outcome: row.get(5)?,
                confidence: row.get(6)?,
                tags: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .unwrap()
        .map(|r| r.unwrap())
        .collect();

    let mut outcomes_stmt = conn
        .prepare("select id, entry_id, result, lessons, repeat, recorded_at from ledger_outcomes")
        .unwrap();
    let outcomes: Vec<Outcome> = outcomes_stmt
        .query_map([], |row| {
            Ok(Outcome {
                id: row.get(0)?,
                entry_id: row.get(1)?,
                result: row.get(2)?,
                lessons: row.get(3)?,
                repeat: row.get::<_, i64>(4)? == 1,
                recorded_at: row.get(5)?,
            })
        })
        .unwrap()
        .map(|r| r.unwrap())
        .collect();

    let payload = serde_json::json!({ "entries": entries, "outcomes": outcomes });
    let mut path = db_path(&app);
    path.pop();
    path.push("ledger_export.json");
    fs::write(&path, serde_json::to_string_pretty(&payload).unwrap()).unwrap();
    path.to_string_lossy().to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_entry,
            list_entries,
            add_outcome,
            list_outcomes,
            search_low_confidence,
            search_failed,
            search_by_tag,
            export_json
        ])
        .setup(|app| {
            init_db(&app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
