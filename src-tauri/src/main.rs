#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
struct RepoList {
    repos: Vec<Repo>,
    active_repo: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct Repo {
    path: String,
}

#[derive(Serialize)]
struct Branch {
    name: String,
    is_current: bool,
    last_commit: String,
}

#[derive(Serialize)]
struct StatusSummary {
    staged: i64,
    unstaged: i64,
    files: Vec<String>,
    diff: String,
}

#[derive(Serialize, Deserialize)]
struct Config {
    repos: Vec<Repo>,
    active_repo: String,
}

fn config_path(app: &AppHandle) -> PathBuf {
    let mut dir = app.path_resolver().app_data_dir().unwrap();
    dir.push("repopilot");
    fs::create_dir_all(&dir).ok();
    dir.push("config.json");
    dir
}

fn load_config(app: &AppHandle) -> Config {
    let path = config_path(app);
    if let Ok(data) = fs::read_to_string(&path) {
        serde_json::from_str(&data).unwrap_or(Config { repos: vec![], active_repo: "".into() })
    } else {
        Config { repos: vec![], active_repo: "".into() }
    }
}

fn save_config(app: &AppHandle, config: &Config) {
    let path = config_path(app);
    fs::write(path, serde_json::to_string_pretty(config).unwrap()).ok();
}

fn run_git(path: &str, args: &[&str]) -> String {
    let output = Command::new("git")
        .args(args)
        .current_dir(path)
        .output();
    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let stderr = String::from_utf8_lossy(&out.stderr);
            format!("$ git {}\n{}\n{}", args.join(" "), stdout, stderr)
        }
        Err(err) => format!("Failed to run git: {}", err),
    }
}

#[tauri::command]
fn list_repos(app: AppHandle) -> RepoList {
    let config = load_config(&app);
    RepoList { repos: config.repos, active_repo: config.active_repo }
}

#[tauri::command]
fn add_repo(app: AppHandle, path: String) {
    let mut config = load_config(&app);
    if !config.repos.iter().any(|r| r.path == path) {
        config.repos.push(Repo { path: path.clone() });
    }
    if config.active_repo.is_empty() {
        config.active_repo = path;
    }
    save_config(&app, &config);
}

#[tauri::command]
fn set_active_repo(app: AppHandle, path: String) {
    let mut config = load_config(&app);
    config.active_repo = path;
    save_config(&app, &config);
}

#[tauri::command]
fn list_branches(app: AppHandle, path: String) -> Vec<Branch> {
    let output = run_git(&path, &["branch", "-a", "--format=%(refname:short)|%(HEAD)|%(committerdate:short)|%(subject)"]);
    let mut branches = Vec::new();
    for line in output.lines().skip(1) {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() >= 4 {
            branches.push(Branch {
                name: parts[0].to_string(),
                is_current: parts[1].contains('*'),
                last_commit: format!("{} · {}", parts[2], parts[3]),
            });
        }
    }
    branches
}

#[tauri::command]
fn checkout_branch(_app: AppHandle, path: String, name: String) -> String {
    run_git(&path, &["checkout", &name])
}

#[tauri::command]
fn status_summary(_app: AppHandle, path: String) -> StatusSummary {
    let status = Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(&path)
        .output()
        .ok();
    let mut staged = 0;
    let mut unstaged = 0;
    let mut files = Vec::new();
    if let Some(out) = status {
        let text = String::from_utf8_lossy(&out.stdout);
        for line in text.lines() {
            let status_code = &line[0..2];
            if status_code.trim_start().chars().next().unwrap_or(' ') != ' ' {
                staged += 1;
            }
            if status_code.chars().nth(1).unwrap_or(' ') != ' ' {
                unstaged += 1;
            }
            files.push(line[3..].to_string());
        }
    }
    let diff = run_git(&path, &["diff", "--stat", "-n", "20"]);
    StatusSummary { staged, unstaged, files, diff }
}

#[tauri::command]
fn stage_all(_app: AppHandle, path: String) -> String {
    run_git(&path, &["add", "-A"])
}

#[tauri::command]
fn unstage_all(_app: AppHandle, path: String) -> String {
    run_git(&path, &["reset"])
}

#[tauri::command]
fn discard_changes(_app: AppHandle, path: String) -> String {
    run_git(&path, &["checkout", "--", "."])
}

#[tauri::command]
fn commit_and_push(_app: AppHandle, path: String, message: String) -> String {
    let commit = run_git(&path, &["commit", "-m", &message]);
    let push = run_git(&path, &["push"]);
    format!("{}\n{}", commit, push)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_repos,
            add_repo,
            set_active_repo,
            list_branches,
            checkout_branch,
            status_summary,
            stage_all,
            unstage_all,
            discard_changes,
            commit_and_push
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
