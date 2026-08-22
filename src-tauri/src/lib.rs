use reqwest::{Client, Error};
// use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Read, Write};
use std::os::windows::process::CommandExt;
use std::process::{Command, Stdio};
use std::ptr;
use std::sync::{mpsc, Mutex, OnceLock};
use std::{path, thread};
use sysinfo::System;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Emitter;
use tauri::Manager;
use windows::core::{Interface, BSTR};
use windows::Win32::Foundation::VARIANT_BOOL;
use windows::Win32::NetworkManagement::IpHelper::{
    GetAdaptersAddresses, GAA_FLAG_INCLUDE_PREFIX, IP_ADAPTER_ADDRESSES_LH,
};
use windows::Win32::Networking::WinSock::AF_UNSPEC;
use windows::Win32::System::Com::*;
use windows::Win32::System::TaskScheduler::*;
use windows::Win32::System::Variant::VARIANT;
// use std::ffi::CStr;

use windows::Win32::System::Power::SetThreadExecutionState;
use windows::Win32::System::Power::{
    ES_CONTINUOUS, ES_DISPLAY_REQUIRED, ES_SYSTEM_REQUIRED, EXECUTION_STATE,
};

use rand::Rng;
use tokio::process::Command as tokioCommand;
use tokio::time::{timeout, Duration};

static RUNNING_CLIENT_INSTANCES: OnceLock<Mutex<HashMap<String, RunningClientInstance>>> = OnceLock::new();

fn running_client_instances() -> &'static Mutex<HashMap<String, RunningClientInstance>> {
    RUNNING_CLIENT_INSTANCES.get_or_init(|| Mutex::new(HashMap::new()))
}

#[tauri::command(rename_all = "snake_case")]
fn get_network_adapter_guids() -> Vec<[String; 2]> {
    let mut guids: Vec<[String; 2]> = Vec::new();
    unsafe {
        let mut buffer_length: u32 = 0;
        let mut result = GetAdaptersAddresses(
            AF_UNSPEC.0.into(),
            GAA_FLAG_INCLUDE_PREFIX,
            Some(ptr::null_mut()),
            Some(ptr::null_mut()),
            &mut buffer_length,
        );

        if result != 0 {
            let mut buffer: Vec<u8> = vec![0; buffer_length as usize];
            let adapter_addresses: *mut IP_ADAPTER_ADDRESSES_LH = buffer.as_mut_ptr() as *mut _;

            result = GetAdaptersAddresses(
                AF_UNSPEC.0.into(),
                GAA_FLAG_INCLUDE_PREFIX,
                Some(ptr::null_mut()),
                Some(adapter_addresses),
                &mut buffer_length,
            );

            if result == 0 {
                let mut current_address = adapter_addresses;

                while !current_address.is_null() {
                    let adapter = &*current_address;

                    let guid = adapter.AdapterName.to_string().unwrap();
                    let desc = adapter.Description.to_string().unwrap();
                    guids.push([guid, desc]);

                    current_address = adapter.Next;
                }
            } else {
                log::error!("GetAdaptersAddresses failed with error");
            }
        } else {
            log::error!("GetAdaptersAddresses failed to retrieve buffer length with error");
        }
    }

    return guids;
}

fn generate_random_user_agent() -> String {
    let user_agents = vec![
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/{version} Safari/605.1.15",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/{version} Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version} Mobile Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:{version}) Gecko/20100101 Firefox/{version}",
    ];

    let mut rng = rand::rng();
    let template = user_agents[rng.random_range(0..user_agents.len())];

    // 生成随机版本号
    let version_major: u8 = rng.random_range(70..90);
    let version_minor: u8 = rng.random_range(0..10);
    let version_patch: u8 = rng.random_range(0..10);
    let version = format!("{}.{}.{}", version_major, version_minor, version_patch);

    // 替换模板中的版本号占位符
    template.replace("{version}", &version)
}

#[tauri::command(rename_all = "snake_case")]
fn prevent_sleep() -> bool {
    unsafe {
        let result =
            SetThreadExecutionState(ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED | ES_CONTINUOUS);
        result != EXECUTION_STATE(0)
    }
}

#[tauri::command(rename_all = "snake_case")]
fn allow_sleep() -> bool {
    unsafe {
        let result = SetThreadExecutionState(ES_CONTINUOUS);
        result != EXECUTION_STATE(0)
    }
}

// 定义GitHub Release的结构体
#[derive(Debug, Deserialize)]
pub struct Release {
    pub tag_name: String,
    pub name: String,
    pub prerelease: bool,
    pub id: u64,
    pub assets: Vec<Asset>,
}

// 定义GitHub Asset的结构体
#[derive(Debug, Deserialize)]
pub struct Asset {
    pub browser_download_url: String,
    pub name: String,
}

// 获取GitHub Release列表的函数
pub async fn fetch_releases() -> Result<Vec<Release>, Error> {
    // 创建HTTP客户端
    let client = Client::new();
    // 构建请求的URL
    let url = format!("https://api.github.com/repos/easytier/easytier/releases",);
    let user_agent = generate_random_user_agent();
    // 发送HTTP GET请求
    let response = client
        .get(&url)
        .header("User-Agent", user_agent)
        .send()
        .await?;
    // 反序列化响应体为Release列表
    response.json::<Vec<Release>>().await
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_game_releases() -> [String; 2] {
    // 创建HTTP客户端
    let client = Client::new();
    // 构建请求的URL
    let url = format!("https://api.github.com/repos/Easytier/EasytierGame/releases",);
    let user_agent = generate_random_user_agent();
    // 发送HTTP GET请求
    if let Ok(response) = client
        .get(&url)
        .header("User-Agent", user_agent)
        .send()
        .await
    {
        // 反序列化响应体为Release列表
        match response.json::<Vec<Release>>().await {
            Ok(releases) => {
                if releases.len() <= 0 {
                    return [String::from(""), String::from("")];
                }
                let release = releases.first().unwrap();
                let tag_name = release.tag_name.as_str();
                let browser_download_url = release
                    .assets
                    .first()
                    .unwrap()
                    .browser_download_url
                    .as_str();
                [String::from(tag_name), String::from(browser_download_url)]
            }
            Err(_e) => {
                log::error!("game release {}", _e.to_string());
                [String::from(""), String::from("")]
            }
        }
    } else {
        log::error!("failed to get game release");
        [String::from(""), String::from("")]
    }
}

#[tauri::command(rename_all = "snake_case")]
fn get_core_version() -> String {
    let core_path = get_tool_exe_path("\\easytier\\easytier-core.exe");
    match Command::new(&core_path)
        .arg("--version")
        .creation_flags(0x08000000)
        .output()
    {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            return output_str.trim().to_string();
        }
        Err(_e) => {
            log::error!("{}", _e.to_string());
            return "".to_string();
        }
    }
}

// #[tauri::command(rename_all = "snake_case")]
// #[warn(dead_code)]
// fn get_cli_version() -> String {
//     let cli_path = get_tool_exe_path("\\easytier\\easytier-cli.exe");
//     match Command::new(&cli_path)
//         .arg("--version")
//         .creation_flags(0x08000000)
//         .output()
//     {
//         Ok(output) => {
//             let output_str = String::from_utf8_lossy(&output.stdout);
//             return output_str.trim().to_string();
//         }
//         Err(_e) => return "".to_string(),
//     }
// }

fn get_tool_exe_path(path: &str) -> String {
    let cur_vec = get_exe_directory();
    let tool_path = format!("{}{}", cur_vec[1].as_str(), path);
    // log::error!("tool path: {}", tool_path);
    return tool_path;
}


const CLI_FAILED_TO_CONNECT: &str = "_EasytierGameCliFailedToConnect_";
const CLI_FAILED_TO_GET_PROXY: &str = "_EasytierGameCliFailedToGetProxy_";
const CLI_FAILED_TO_GET_CONNECTIONS: &str = "_EasytierGameCliFailedToGetConnections_";

async fn run_cli_json(
    rpc_portal: u16,
    options: &[&str],
    command_args: &[&str],
    failure_marker: &str,
    operation_name: &str,
) -> String {
    let cli_path = get_tool_exe_path("\\easytier\\easytier-cli.exe");
    let mut command = tokioCommand::new(&cli_path);
    command
        .arg("-p")
        .arg(format!("127.0.0.1:{}", rpc_portal))
        .args(options)
        .arg("-o")
        .arg("json")
        .args(command_args)
        .creation_flags(0x08000000)
        .kill_on_drop(true);
    match timeout(Duration::from_secs(5), command.output()).await {
        Ok(Ok(output)) => {
            if output.status.success() {
                let output_str = String::from_utf8_lossy(&output.stdout);
                output_str.trim().to_string()
            } else {
                let output_str = String::from_utf8_lossy(&output.stderr);
                log::error!("{}失败: {}", operation_name, output_str.trim());
                failure_marker.to_string()
            }
        }
        Ok(Err(error)) => {
            log::error!("{}执行失败: {}", operation_name, error);
            String::new()
        }
        Err(_) => {
            log::error!("{}超时，RPC端口: {}", operation_name, rpc_portal);
            failure_marker.to_string()
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn get_members_by_cli(rpc_portal: u16) -> String {
    run_cli_json(rpc_portal, &[], &["peer", "list"], CLI_FAILED_TO_CONNECT, "获取成员列表").await
}

#[tauri::command(rename_all = "snake_case")]
async fn get_members_proxy(rpc_portal: u16) -> String {
    run_cli_json(rpc_portal, &[], &["proxy"], CLI_FAILED_TO_GET_PROXY, "获取代理列表").await
}

#[tauri::command(rename_all = "snake_case")]
async fn get_members_connections_cli(rpc_portal: u16) -> String {
    run_cli_json(
        rpc_portal,
        &["-v"],
        &["peer"],
        CLI_FAILED_TO_GET_CONNECTIONS,
        "获取成员连接",
    )
    .await
}

#[tauri::command(rename_all = "snake_case")]
async fn get_route_by_cli(rpc_portal: u16) -> String {
    run_cli_json(rpc_portal, &[], &["route"], CLI_FAILED_TO_CONNECT, "获取路由列表").await
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_nodes_list(page: u64, limit: u64) -> String {
    let client = Client::new();
    let url = format!("https://uptime.easytier.cn/api/nodes?page={}&per_page={}", page, limit);
    let user_agent = generate_random_user_agent();
    
    match client
        .get(url)
        .header("User-Agent", user_agent)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.text().await {
                    Ok(text) => text,
                    Err(e) => {
                        log::error!("Failed to get response text: {}", e);
                        format!("_EasytierGameFetchNodesError_: {}", e)
                    }
                }
            } else {
                log::error!("HTTP request failed with status: {}", response.status());
                format!("_EasytierGameFetchNodesError_: HTTP request failed with status: {}", response.status())
            }
        }
        Err(e) => {
            log::error!("Failed to fetch nodes list: {}", e);
            format!("_EasytierGameFetchNodesError_: {}", e)
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn download_easytier_zip(
    app_handle: tauri::AppHandle,
    download_url: String,
    file_name: String,
) {
    let cache_dir_path = get_tool_exe_path("\\easytier\\cache");
    let cache_file_name = format!("{}\\{}", cache_dir_path, file_name);
    let cache_file_name_path = path::Path::new(&cache_file_name);
    if cache_file_name_path.exists() {
        unzip(cache_file_name_path);
        return;
    }

    let target = format!("{}", download_url);
    let mut response = reqwest::get(target)
        .await
        .expect("error to download easytier url");
    let easytier_path = get_tool_exe_path("\\easytier");
    let file_path = format!("{}\\{}", easytier_path, file_name);
    // println!("download easytier to {}", file_path);

    let easytier_dir = path::Path::new(&easytier_path);
    if !easytier_dir.exists() {
        fs::create_dir_all(&easytier_dir).unwrap();
    }

    let path = path::Path::new(&file_path);
    println!("download easytier to {}", path.display());
    if path.exists() {
        match fs::remove_file(path) {
            Ok(_) => println!("删除上次下载的Zip文件成功"),
            Err(_) => log::error!("删除上次下载Zip的文件失败"),
        }
    }

    let mut file = match File::create(&path) {
        Err(why) => panic!("couldn't create {}", why),
        Ok(file) => file,
    };
    let context_size: u64 = response.content_length().unwrap();
    while let Some(item) = response.chunk().await.unwrap() {
        match file.write_all(&item) {
            Ok(_) => {
                app_handle
                    .emit("download_core_progress", [item.len() as u64, context_size])
                    .expect("error to emit download_core_progress");
            }
            Err(why) => {
                log::error!("error to write file: {}", why);
                app_handle
                    .emit("download_core_progress_error", why.to_string())
                    .expect("error to emit download_core_progress_error");
                return;
            }
        };
    }
    println!("下载完成");
    unzip(path);

    let cache_dir_path = path::Path::new(&cache_dir_path);
    if !cache_dir_path.exists() {
        fs::create_dir_all(&cache_dir_path).unwrap();
    }
    match fs::rename(path, cache_file_name) {
        Ok(_) => println!("保存zip文件至easytier/cache成功"),
        Err(_) => log::error!("保存zip文件失败"),
    }
    // match fs::remove_file(path) {
    //     Ok(_) => println!("删除zip文件成功"),
    //     Err(_) => log::error!("删除zip文件失败"),
    // }
}

fn unzip(fname: &path::Path) {
    let zipfile = std::fs::File::open(fname).unwrap();

    let mut archive = zip::ZipArchive::new(zipfile).unwrap();

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).unwrap();
        let outpath = match file.enclosed_name() {
            Some(path) => path,
            None => continue,
        };

        {
            let comment = file.comment();
            if !comment.is_empty() {
                println!("File {i} comment: {comment}");
            }
        }

        println!(
            "File {} extracted to \"{}\" ({} bytes)",
            i,
            outpath.display(),
            file.size()
        );
        // if let Some(p) = outpath.parent() {
        //     if !p.exists() {
        //         fs::create_dir_all(p).unwrap();
        //     }
        // }
        let easytier_path = get_tool_exe_path("\\easytier");
        let easytier_dir = path::Path::new(&easytier_path);
        // if !easytier_dir.exists() {
        //     fs::create_dir_all(&easytier_dir).unwrap();
        // }

        // let out_file_path = path::Path::new("./").join(outpath.file_name().clone().unwrap());
        let out_file_path = easytier_dir.join(outpath.file_name().clone().unwrap());
        println!("outFilePath: {}", out_file_path.display());
        let mut outfile = fs::File::create(&out_file_path).unwrap();
        std::io::copy(&mut file, &mut outfile).unwrap();
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ClientCommandEvent {
    instance_id: String,
    run_id: String,
    event_type: String,
    child_id: Option<u32>,
    output: Option<String>,
    exit_code: Option<i32>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct RunningClientInstance {
    child_id: u32,
    run_id: String,
}

fn emit_client_command_event(
    app_handle: &tauri::AppHandle,
    instance_id: &str,
    run_id: &str,
    event_type: &str,
    child_id: Option<u32>,
    output: Option<String>,
    exit_code: Option<i32>,
) {
    if let Err(error) = app_handle.emit(
        "client-command-event",
        ClientCommandEvent {
            instance_id: instance_id.to_string(),
            run_id: run_id.to_string(),
            event_type: event_type.to_string(),
            child_id,
            output,
            exit_code,
        },
    ) {
        log::error!(
            "发送 EasyTier 客户端事件失败，实例: {}，运行标识: {}，事件: {}，错误: {}",
            instance_id,
            run_id,
            event_type,
            error
        );
    }
}

fn sanitize_command_args(args: &[String]) -> String {
    let mut sanitized_args = Vec::with_capacity(args.len());
    let mut redact_next = false;
    for arg in args {
        if redact_next {
            sanitized_args.push("***".to_string());
            redact_next = false;
            continue;
        }
        sanitized_args.push(arg.clone());
        if arg == "--network-secret" {
            redact_next = true;
        }
    }
    sanitized_args.join(" ")
}

#[tauri::command(rename_all = "snake_case")]
fn get_running_instances() -> HashMap<String, RunningClientInstance> {
    match running_client_instances().lock() {
        Ok(instances) => instances.clone(),
        Err(error) => {
            log::error!("读取 EasyTier 运行实例失败: {}", error);
            HashMap::new()
        }
    }
}

fn stream_command_output<R: Read + Send + 'static>(
    stream: R,
    sender: mpsc::SyncSender<String>,
) -> thread::JoinHandle<()> {
    thread::spawn(move || {
        let reader = BufReader::new(stream);
        for line in reader.lines() {
            match line {
                Ok(line) => {
                    if let Err(error) = sender.send(line) {
                        log::error!("发送 EasyTier 输出失败: {}", error);
                        break;
                    }
                }
                Err(error) => {
                    log::error!("读取 EasyTier 输出失败: {}", error);
                    break;
                }
            }
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
fn run_command(
    app_handle: tauri::AppHandle,
    args: Vec<String>,
    is_server: Option<bool>,
    instance_id: Option<String>,
    run_id: Option<String>,
) {
    let is_server = is_server.unwrap_or(false);
    let instance_id = instance_id.unwrap_or_default();
    let run_id = run_id.unwrap_or_default();
    // 有界队列避免内核日志突发时无限占用内存。
    let (tx, rx) = mpsc::sync_channel::<String>(256);

    let app_handle1 = app_handle.clone();
    let app_handle2 = app_handle.clone();

    let args2 = sanitize_command_args(&args);
    let process_instance_id = instance_id.clone();
    let output_instance_id = instance_id.clone();
    let process_run_id = run_id.clone();
    let output_run_id = run_id;
    thread::spawn(move || {
        let core_path = get_tool_exe_path("\\easytier\\easytier-core.exe");
        // trace, debug, info, warn, error, off
        let child_result = Command::new(&core_path)
            .args(args)
            .creation_flags(0x08000000)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn();

        let mut child = match child_result {
            Ok(child) => child,
            Err(error) => {
                log::error!("启动 EasyTier 实例失败: {}", error);
                if !is_server {
                    emit_client_command_event(
                        &app_handle1,
                        &process_instance_id,
                        &process_run_id,
                        "error",
                        None,
                        Some(error.to_string()),
                        None,
                    );
                }
                return;
            }
        };

        println!("child id: {}", child.id());
        let child_id = child.id();
        if is_server {
            let _ = app_handle1.emit("server-thread-id", child_id);
            let _ = app_handle1.emit("server-command-output", args2.clone());
        } else {
            if let Ok(mut instances) = running_client_instances().lock() {
                instances.insert(
                    process_instance_id.clone(),
                    RunningClientInstance {
                        child_id,
                        run_id: process_run_id.clone(),
                    },
                );
            }
            emit_client_command_event(
                &app_handle1,
                &process_instance_id,
                &process_run_id,
                "started",
                Some(child_id),
                Some(args2),
                None,
            );
        }
        let mut output_threads = Vec::new();
        if let Some(stdout) = child.stdout.take() {
            output_threads.push(stream_command_output(stdout, tx.clone()));
        }
        if let Some(stderr) = child.stderr.take() {
            output_threads.push(stream_command_output(stderr, tx.clone()));
        }
        drop(tx);
        let exit_code = child.wait().ok().and_then(|status| status.code());
        for output_thread in output_threads {
            let _ = output_thread.join();
        }
        if !is_server {
            if let Ok(mut instances) = running_client_instances().lock() {
                if instances
                    .get(&process_instance_id)
                    .map_or(false, |instance| instance.run_id == process_run_id)
                {
                    instances.remove(&process_instance_id);
                }
            }
            emit_client_command_event(
                &app_handle1,
                &process_instance_id,
                &process_run_id,
                "exited",
                Some(child_id),
                None,
                exit_code,
            );
        }
        println!("end");
    });

    thread::spawn(move || {
        while let Ok(line) = rx.recv() {
            if is_server {
                let _ = app_handle2.emit("server-command-output", line);
            } else {
                emit_client_command_event(
                    &app_handle2,
                    &output_instance_id,
                    &output_run_id,
                    "output",
                    None,
                    Some(line),
                    None,
                );
            }
        }
    });
}

#[tauri::command(rename_all = "snake_case")]
fn stop_command(child_id: u32) -> bool {
    if child_id != 0 {
        let output = Command::new("taskkill")
            .arg("/F")
            .arg("/PID") // 使用 -9 信号强制终止进程
            .arg(child_id.to_string())
            .creation_flags(0x08000000)
            .output();

        match output {
            Ok(output) if output.status.success() => {
                println!("Process {} terminated successfully.", child_id);
                true
            }
            Ok(output) => {
                let error = String::from_utf8_lossy(&output.stderr);
                log::error!("停止进程 {} 失败: {}", child_id, error.trim());
                false
            }
            Err(error) => {
                log::error!("执行进程停止命令失败: {}", error);
                false
            }
        }
    } else {
        println!("child id is 0");
        true
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_easytier_list() -> Vec<Vec<[String; 4]>> {
    // 获取release列表
    if let Ok(release) = fetch_releases().await {
        let mut release_list: Vec<Vec<[String; 4]>> = Vec::new();
        for re in release {
            let mut assets_list: Vec<[String; 4]> = Vec::new();
            for asset in re.assets {
                if asset.name.contains("windows-x86_64") {
                    assets_list.push([
                        re.tag_name.clone(),
                        asset.name.clone(),
                        asset.browser_download_url.clone(),
                        re.prerelease.to_string(),
                    ]);
                }
            }
            release_list.push(assets_list);
        }
        release_list
    } else {
        Vec::new()
    }
}

fn toggle_window_visibility<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[tauri::command(rename_all = "snake_case")]
fn search_pid_by_pname(target_process_name: String) -> u32 {
    // 创建一个新的 System 实例
    let mut system = System::new_all();

    // 刷新所有进程信息
    system.refresh_all();

    // 遍历所有进程
    for (pid, process) in system.processes() {
        if process
            .name()
            .to_string_lossy()
            .to_lowercase()
            .contains(&target_process_name.to_lowercase())
        {
            println!("Found process '{}' with PID: {}", target_process_name, pid);
            return pid.as_u32();
        }
    }
    return 0;
}

#[tauri::command]
fn get_exe_directory() -> Vec<String> {
    let mut ret_vec: Vec<String> = Vec::new();
    match std::env::current_exe() {
        Ok(exe_path) => {
            // println!("Path of this executable is: {}", exe_path.display());
            ret_vec.push(exe_path.display().to_string());
            ret_vec.push(exe_path.parent().unwrap().display().to_string());
            return ret_vec;
        }
        Err(e) => {
            println!("failed to get current exe path: {e}");
            ret_vec.push("".to_string());
            ret_vec.push("".to_string());
            return ret_vec;
        }
    };
}

#[tauri::command]
fn spawn_autostart(enabled: bool) {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || match autostart(enabled) {
        Ok(_) => {
            let _ = tx.send(true);
        }
        Err(e) => {
            log::error!("Error: {}", e);
            let _ = tx.send(false);
        }
    });

    match rx.recv() {
        Ok(_) => {
            // println!("autostart enabled: {}", enabled);
        }
        Err(_e) => {}
    }
}

fn autostart_enabled() -> Result<bool, Box<dyn std::error::Error>> {
    unsafe {
        let task_service: ITaskService = CoCreateInstance(&TaskScheduler, None, CLSCTX_ALL)?;
        task_service.Connect(
            &VARIANT::default(),
            &VARIANT::default(),
            &VARIANT::default(),
            &VARIANT::default(),
        )?;

        // 指定要删除的任务文件夹路径
        let folder_path = BSTR::from("\\easytierGame");
        // let root = BSTR::from("\\");
        let task_name = BSTR::from("auto start");
        let mut penabled = VARIANT_BOOL::from(false);
        let bool_ptr: *mut VARIANT_BOOL = &mut penabled;

        // 获取任务文件夹F
        let task_folder: ITaskFolder = task_service.GetFolder(&folder_path)?;
        let task = task_folder.GetTask(&task_name)?;
        task.Definition()?
            .Triggers()?
            .get_Item(1)?
            .Enabled(bool_ptr)?;
        // 释放 COM 库
        CoUninitialize();
        // return penabled.as_bool();
        Ok(penabled.as_bool())
    }
}

#[tauri::command]
fn autostart_is_enabled() -> bool {
    match autostart_enabled() {
        Ok(enabled) => {
            // println!("autostart enabled: {}", enabled);
            return enabled;
        }
        Err(_e) => {
            // log::error!("autostart enabled: false -> {}", e);
            return false;
        }
    }
}

// 新增辅助函数
fn ensure_task_folder_and_cleanup(
    task_service: &ITaskService,
    folder_path: &BSTR,
    task_name: &BSTR,
) -> Result<ITaskFolder, Box<dyn std::error::Error>> {
    unsafe {
        let root = BSTR::from("\\");
        let root_folder: ITaskFolder = task_service.GetFolder(&root)?;

        match task_service.GetFolder(folder_path) {
            Ok(existing_folder) => {
                println!("任务文件夹已存在: {}", folder_path);

                // 检查并清理现有任务
                if let Ok(_existing_task) = existing_folder.GetTask(task_name) {
                    println!("发现同名任务: {}，准备删除", task_name);
                    match existing_folder.DeleteTask(task_name, 0) {
                        Ok(_) => println!("成功删除现有任务"),
                        Err(e) => {
                            log::error!("删除现有任务失败: {}", e);
                            // 继续执行，尝试覆盖
                        }
                    }
                }
                Ok(existing_folder)
            }
            Err(_) => {
                println!("创建新的任务文件夹: {}", folder_path);
                match root_folder.CreateFolder(folder_path, &VARIANT::default()) {
                    Ok(new_folder) => {
                        println!("成功创建任务文件夹");
                        Ok(new_folder)
                    }
                    Err(e) => {
                        log::error!("创建任务文件夹失败: {}", e);
                        Err(e.into())
                    }
                }
            }
        }
    }
}

// pub const AUTOSTART_ARG: &str = "--autostart";
pub const TASKAUTOSTART_ARG: &str = "--task-auto-start";
fn autostart(enabled: bool) -> std::result::Result<(), Box<dyn std::error::Error>> {
    if !enabled {
        unsafe {
            let task_service: ITaskService = CoCreateInstance(&TaskScheduler, None, CLSCTX_ALL)?;
            task_service.Connect(
                &VARIANT::default(),
                &VARIANT::default(),
                &VARIANT::default(),
                &VARIANT::default(),
            )?;

            // 指定要删除的任务文件夹路径
            let folder_path = BSTR::from("\\easytierGame");
            let root = BSTR::from("\\");
            let task_name = BSTR::from("auto start");

            // 获取任务文件夹
            let task_folder: ITaskFolder = task_service.GetFolder(&folder_path)?;
            task_folder.DeleteTask(&task_name, 0)?;
            println!("Task AutoStart Task deleted successfully.");

            let task_folder: ITaskFolder = task_service.GetFolder(&root)?;

            // 删除任务文件夹
            task_folder.DeleteFolder(&folder_path, 0)?;

            println!("Task folder easytierGame deleted successfully.");

            // 释放 COM 库
            CoUninitialize();
        }
    } else {
        unsafe {
            let task_service: ITaskService = CoCreateInstance(&TaskScheduler, None, CLSCTX_ALL)?;
            task_service.Connect(
                &VARIANT::default(),
                &VARIANT::default(),
                &VARIANT::default(),
                &VARIANT::default(),
            )?;

            let folder_path = BSTR::from("\\easytierGame");
            let task_name = BSTR::from("auto start");

            let task_definition = task_service.NewTask(0)?;

            // 设置任务信息
            let registration_info = task_definition.RegistrationInfo()?;
            registration_info.SetDescription(&BSTR::from("EasytierGame auto start task"))?;
            registration_info.SetAuthor(&BSTR::from("EasytierGame"))?;

            // 改为用户登录触发
            let triggers = task_definition.Triggers()?;
            let trigger = triggers.Create(TASK_TRIGGER_LOGON)?;
            let logon_trigger: ILogonTrigger = trigger.cast()?;
            logon_trigger.SetEnabled(VARIANT_BOOL::from(true))?;

            // 设置动作
            let actions = task_definition.Actions()?;
            let action = actions.Create(TASK_ACTION_EXEC)?;
            let exec_action: IExecAction = action.cast()?;
            let exe = std::env::current_exe()?;
            let exe_path: &str = exe.to_str().unwrap();
            exec_action.SetPath(&BSTR::from(exe_path))?;
            exec_action.SetArguments(&BSTR::from("--task-auto-start"))?;

            // 设置任务权限为当前用户
            let principal = task_definition.Principal()?;
            principal.SetUserId(&BSTR::from(whoami::username().as_str()))?;
            principal.SetLogonType(TASK_LOGON_INTERACTIVE_TOKEN)?;
            principal.SetRunLevel(TASK_RUNLEVEL_HIGHEST)?;

            // 设置任务设置
            let settings = task_definition.Settings()?;
            settings.SetEnabled(VARIANT_BOOL::from(true))?;
            settings.SetCompatibility(TASK_COMPATIBILITY_V2_1)?; // Windows 7
            settings.SetStartWhenAvailable(VARIANT_BOOL::from(true))?;
            // settings.SetHidden(VARIANT_BOOL::from(true))?; // 注释掉让任务可见
            settings.SetExecutionTimeLimit(&BSTR::from("PT0S"))?;
            settings.SetDisallowStartIfOnBatteries(VARIANT_BOOL(0))?; // 允许在电池供电时启动

            // 获取文件夹并注册任务
            let task_folder =
                ensure_task_folder_and_cleanup(&task_service, &folder_path, &task_name)?;

            let _auto_task = task_folder.RegisterTaskDefinition(
                &task_name,
                &task_definition,
                TASK_CREATE_OR_UPDATE.0,
                &VARIANT::default(),
                &VARIANT::default(),
                TASK_LOGON_INTERACTIVE_TOKEN,
                &VARIANT::default(),
            )?;

            CoUninitialize();
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 获取命令行参数
    let args: Vec<String> = std::env::args().collect();

    let context = tauri::generate_context!();
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_cli::init())
        .plugin(
            tauri_plugin_window_state::Builder::new()
                .with_state_flags(tauri_plugin_window_state::StateFlags::SIZE)
                .build(),
        )
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus()
                .expect("failed to set focus");
        }))
        .setup(move |app| {
            // let args = args.clone();
            // if cfg!(debug_assertions) {
            let log_path = get_tool_exe_path("\\easytier\\guiLogs");
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .target(tauri_plugin_log::Target::new(
                        tauri_plugin_log::TargetKind::Folder {
                            path: std::path::PathBuf::from(log_path),
                            file_name: None,
                        },
                    ))
                    .max_file_size(50_000 /* bytes */)
                    .level(log::LevelFilter::Error)
                    .build(),
            )?;
            // }
            #[cfg(not(target_os = "android"))]
            let _tray_menu = TrayIconBuilder::with_id("main")
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        toggle_window_visibility(app);
                    }
                })
                .icon(tauri::image::Image::from_bytes(include_bytes!(
                    "../icons/icon.png"
                ))?)
                .icon_as_template(false)
                .build(app)?;

            // 开机自启隐藏到托盘或者显示主窗口
            if !args.contains(&String::from(TASKAUTOSTART_ARG)) {
                let main_window = app.get_webview_window("main").unwrap();
                main_window.show().expect("failed to show window");
                main_window.set_focus().expect("failed to set focus");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            run_command,
            stop_command,
            get_running_instances,
            get_core_version,
            fetch_easytier_list,
            fetch_game_releases,
            download_easytier_zip,
            get_members_by_cli,
            get_members_connections_cli,
            get_members_proxy,
            get_route_by_cli,
            fetch_nodes_list,
            search_pid_by_pname,
            get_exe_directory,
            spawn_autostart,
            autostart_is_enabled,
            prevent_sleep,
            allow_sleep,
            get_network_adapter_guids
        ])
        .run(context)
        .expect("error while running tauri application");
}
