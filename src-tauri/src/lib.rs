use planif::enums::TaskCreationFlags;
use planif::schedule::TaskScheduler as planIfTaskScheduler;
use planif::schedule_builder::{Action, ScheduleBuilder};
use planif::settings::{Duration, LogonType, PrincipalSettings, RunLevel};
use reqwest::{Client, Error};
// use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Write};
use std::os::windows::process::CommandExt;
use std::process::{Command, Stdio};
use std::ptr;
use std::sync::mpsc;
use std::{path, thread};
use sysinfo::System;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Emitter;
use tauri::Manager;
use windows::core::{BSTR, VARIANT};
use windows::Win32::Foundation::VARIANT_BOOL;
use windows::Win32::NetworkManagement::IpHelper::{
    GetAdaptersAddresses, GAA_FLAG_INCLUDE_PREFIX, IP_ADAPTER_ADDRESSES_LH,
};
use windows::Win32::Networking::WinSock::AF_UNSPEC;
use windows::Win32::System::Com::*;
use windows::Win32::System::TaskScheduler::*;
// use std::ffi::CStr;

use windows::Win32::System::Power::SetThreadExecutionState;
use windows::Win32::System::Power::{
    ES_CONTINUOUS, ES_DISPLAY_REQUIRED, ES_SYSTEM_REQUIRED, EXECUTION_STATE,
};

use rand::Rng;
use tokio::process::Command as tokioCommand;

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

#[derive(Serialize, Deserialize, Debug)]
struct RoutePeerInfo {
    peer_id: u64,
    cost: u64,
    hostname: Option<String>,
    udp_stun_info: String,
    easytier_version: String,
    network_length: u64,
}

#[derive(Serialize, Deserialize, Debug)]
struct RouteTable {
    peer_infos: HashMap<u32, RoutePeerInfo>,
    ipv4_peer_id_map: HashMap<String, u64>,
}

#[derive(Serialize, Deserialize, Debug)]
struct PeerRouteServiceImpl {
    route_table_with_cost: RouteTable,
}

#[derive(Serialize, Deserialize, Debug)]
struct PeerRoute {
    my_peer_id: u64,
    service_impl: PeerRouteServiceImpl,
}

#[derive(Serialize, Deserialize, Debug)]
struct MyResponse {
    response: PeerRoute,
}

#[tauri::command(rename_all = "snake_case")]
async fn get_members_by_cli() -> String {
    let cli_path = get_tool_exe_path("\\easytier\\easytier-cli.exe");
    match tokioCommand::new(&cli_path)
        .arg("peer")
        .arg("list")
        .creation_flags(0x08000000)
        .output()
        .await
    {
        Ok(output) => {
            if output.status.success() {
                let output_str = String::from_utf8_lossy(&output.stdout);
                return output_str.trim().to_string();
            } else {
                let output_str = String::from_utf8_lossy(&output.stderr);
                log::error!("{}", output_str.trim().to_string());
                return "_EasytierGameCliFailedToConnect_".to_string();
            }
        }
        Err(_e) => {
            log::error!("get member list error");
            return "".to_string();
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn get_route_by_cli() -> String {
    let cli_path = get_tool_exe_path("\\easytier\\easytier-cli.exe");
    match tokioCommand::new(&cli_path)
        .arg("route")
        .creation_flags(0x08000000)
        .output()
        .await
    {
        Ok(output) => {
            if output.status.success() {
                let output_str = String::from_utf8_lossy(&output.stdout);
                return output_str.trim().to_string();
            } else {
                let output_str = String::from_utf8_lossy(&output.stderr);
                log::error!("{}", output_str.trim().to_string());
                return "_EasytierGameCliFailedToConnect_".to_string();
            }
        }
        Err(_e) => {
            log::error!("get route list error");
            return "".to_string();
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn download_easytier_zip(app_handle: tauri::AppHandle ,download_url: String, file_name: String) {
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

    let mut file = match File::create(&path) {
        Err(why) => panic!("couldn't create {}", why),
        Ok(file) => file,
    };
    let context_size: u64 = response.content_length().unwrap();
    while let Some(item) = response.chunk().await.unwrap() {
        match file.write_all(&item) {
            Ok(_) => {
                app_handle.emit("download_core_progress", [item.len() as u64, context_size]).expect("error to emit download_core_progress");
            },Err(why) => {
                log::error!("error to write file: {}", why);
                app_handle.emit("download_core_progress_error", why.to_string()).expect("error to emit download_core_progress_error");
                return
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

#[tauri::command(rename_all = "snake_case")]
fn run_command(app_handle: tauri::AppHandle, args: Vec<String>, is_server: Option<bool>) {
    let is_server = is_server.unwrap_or(false);
    let (tx, rx) = mpsc::channel();

    let app_handle1 = app_handle.clone();
    let app_handle2 = app_handle.clone();

    let args2 = args.clone();
    let mut thread_id_str = "thread-id";
    if is_server {
        thread_id_str = "server-thread-id";
    }
    let mut command_output_str = "command-output";
    if is_server {
        command_output_str = "server-command-output";
    }
    thread::spawn(move || {
        let core_path = get_tool_exe_path("\\easytier\\easytier-core.exe");
        // trace, debug, info, warn, error, off
        let mut child = Command::new(&core_path)
            .args(args)
            .creation_flags(0x08000000)
            .stdout(Stdio::piped())
            .spawn()
            .expect("failed to execute process");

        println!("child id: {}", child.id());
        app_handle1
            .emit(thread_id_str, child.id())
            .expect("failed to emit id event");
        app_handle1
            .emit(command_output_str, args2.join(" "))
            .expect("error output args");
        let stdout = child.stdout.take().expect("failed to capture stdout");
        let reader = BufReader::new(stdout);

        for line in reader.lines() {
            match line {
                Ok(line) => match tx.send(line) {
                    Ok(_) => {}
                    Err(e) => {
                        log::error!("error sending line: {}", e);
                        break;
                    }
                },
                Err(e) => {
                    log::error!("error reading line: {}", e);
                    break;
                }
            }
        }
        println!("end");
    });

    thread::spawn(move || {
        while let Ok(line) = rx.recv() {
            app_handle2
                .emit(command_output_str, line)
                .expect("failed to emit event");
        }
    });
}

#[tauri::command(rename_all = "snake_case")]
fn stop_command(child_id: u32) {
    if child_id != 0 {
        let output = Command::new("taskkill")
            .arg("/F")
            .arg("/PID") // 使用 -9 信号强制终止进程
            .arg(child_id.to_string())
            .creation_flags(0x08000000)
            .output()
            .expect("Failed to execute command");

        // 检查命令执行的结果
        if output.status.success() {
            println!("Process {} terminated successfully.", child_id);
        } else {
            eprintln!("Failed to terminate process {}.", child_id);
        }
    } else {
        println!("child id is 0");
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn fetch_easytier_list() -> Vec<Vec<[String; 3]>> {
    // 获取release列表
    if let Ok(release) = fetch_releases().await {
        let mut release_list = Vec::new();
        for re in release {
            let mut assets_list = Vec::new();
            for asset in re.assets {
                if asset.name.contains("windows-x86_64") {
                    assets_list.push([
                        re.tag_name.clone(),
                        asset.name.clone(),
                        asset.browser_download_url.clone(),
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
            println!("autostart enabled: {}", enabled);
            return enabled;
        }
        Err(e) => {
            log::error!("autostart enabled: false -> {}", e);
            return false;
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
        let ts = planIfTaskScheduler::new()?;
        let com = ts.get_com();
        let sb = ScheduleBuilder::new(&com).unwrap();

        let exe = std::env::current_exe()?;
        let exe = exe.to_str().unwrap();

        let settings = PrincipalSettings {
            display_name: "".to_string(),
            group_id: None,
            id: "".to_string(),
            logon_type: LogonType::InteractiveToken,
            run_level: RunLevel::Highest,
            user_id: Some(whoami::username()),
        };
        sb.create_logon()
            .author("heixiansen")?
            .trigger("trigger", enabled)?
            .action(Action::new("auto start", exe, "", &TASKAUTOSTART_ARG))?
            .in_folder("easytierGame")?
            .principal(settings)?
            .delay(Duration {
                seconds: Some(6),
                ..Default::default()
            })?
            .build()?
            .register("auto start", TaskCreationFlags::CreateOrUpdate as i32)?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 获取命令行参数
    let _args: Vec<String> = std::env::args().collect();

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
            // if !args.contains(&String::from(TASKAUTOSTART_ARG)) {
            //     let main_window = app.get_webview_window("main").unwrap();
            //     main_window.show().expect("failed to show window");
            //     main_window.set_focus().expect("failed to set focus");
            // }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            run_command,
            stop_command,
            get_core_version,
            fetch_easytier_list,
            fetch_game_releases,
            download_easytier_zip,
            get_members_by_cli,
            get_route_by_cli,
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
