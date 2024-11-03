use planif::enums::TaskCreationFlags;
use planif::schedule::TaskScheduler as planIfTaskScheduler;
use planif::schedule_builder::{Action, ScheduleBuilder};
use planif::settings::{Duration, LogonType, PrincipalSettings, RunLevel};
use reqwest::{Client, Error};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Write};
use std::os::windows::process::CommandExt;
use std::process::{Command, Stdio};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    mpsc, Arc,
};
use std::{path, thread};
use sysinfo::System;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;
use windows::core::{BSTR, VARIANT};
use windows::Win32::Foundation::VARIANT_BOOL;
use windows::Win32::System::Com::*;
use windows::Win32::System::TaskScheduler::*;

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

    // 发送HTTP GET请求
    let response = client
        .get(&url)
        .header("User-Agent", "Tauri-fetch")
        .send()
        .await?;
    // 反序列化响应体为Release列表
    response.json::<Vec<Release>>().await
}

#[tauri::command(rename_all = "snake_case")]
fn get_core_version() -> String {
    match Command::new("easytier/easytier-core.exe")
        .arg("--version")
        .creation_flags(0x08000000)
        .output()
    {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            return output_str.trim().to_string();
        }
        Err(_e) => return "".to_string(),
    }
}

#[tauri::command(rename_all = "snake_case")]
fn get_cli_version() -> String {
    match Command::new("easytier/easytier-cli.exe")
        .arg("--version")
        .creation_flags(0x08000000)
        .output()
    {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            return output_str.trim().to_string();
        }
        Err(_e) => return "".to_string(),
    }
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
fn get_members_by_cli() -> String {
    match Command::new("easytier/easytier-cli.exe")
        .arg("peer")
        .arg("list")
        .creation_flags(0x08000000)
        .output()
    {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            return output_str.trim().to_string();
        }
        Err(_e) => return _e.to_string(),
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn download_easytier_zip(download_url: String, file_name: String) {
    let target = format!("{}", download_url);
    let response = reqwest::get(target)
        .await
        .expect("error to download easytier url");
    let file_path = format!("./easytier/{}", file_name);

    let easytier_dir = path::Path::new("./easytier");
    if !easytier_dir.exists() {
        fs::create_dir_all(&easytier_dir).unwrap();
    }

    let path = path::Path::new(&file_path);

    let mut file = match File::create(&path) {
        Err(why) => panic!("couldn't create {}", why),
        Ok(file) => file,
    };

    let content = response.bytes().await.expect("error to bytes easytier");
    println!("下载完成，开始写入");
    file.write_all(&content).expect("error to write easytier");
    println!("写入完成");
    unzip(path);
    match fs::remove_file(path) {
        Ok(_) => println!("删除zip文件成功"),
        Err(_) => println!("删除zip文件失败"),
    }
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

        let easytier_dir = path::Path::new("./easytier");
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
fn run_command(
    app_handle: tauri::AppHandle,
    args: Vec<String>,
    stop_signal: tauri::State<Arc<AtomicBool>>,
) {
    let (tx, rx) = mpsc::channel();
    stop_signal.store(false, Ordering::Relaxed);
    let app_handle1 = app_handle.clone();
    let app_handle2 = app_handle.clone();
    let stop_signal1 = Arc::clone(&stop_signal);
    let stop_signal2 = Arc::clone(&stop_signal);
    let args2 = args.clone();
    thread::spawn(move || {
        // trace, debug, info, warn, error, off
        let mut child = Command::new("easytier/easytier-core.exe")
            .args(args)
            .creation_flags(0x08000000)
            .stdout(Stdio::piped())
            .spawn()
            .expect("failed to execute process");

        println!("child id: {}", child.id());
        app_handle1
            .emit("thread-id", child.id())
            .expect("failed to emit id event");
        app_handle1
            .emit("command-output", args2.join(" "))
            .expect("error output args");
        let stdout = child.stdout.take().expect("failed to capture stdout");
        let reader = BufReader::new(stdout);

        for line in reader.lines() {
            match line {
                Ok(line) => {
                    tx.send(line).expect("failed to send line");
                }
                Err(e) => {
                    eprintln!("error reading line: {}", e);
                    break;
                }
            }
        }
        stop_signal1.store(true, Ordering::Relaxed);
        println!("end");
    });

    thread::spawn(move || {
        while let Ok(line) = rx.recv() {
            if stop_signal2.load(Ordering::Relaxed) {
                break;
            }
            app_handle2
                .emit("command-output", line)
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
        return release_list;
    } else {
        return Vec::new();
    }
}

fn toggle_window_visibility<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or_default() {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
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
            println!("Path of this executable is: {}", exe_path.display());
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
            println!("Error: {}", e);
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
        task_service
            .Connect(
                &VARIANT::default(),
                &VARIANT::default(),
                &VARIANT::default(),
                &VARIANT::default(),
            )
            ?;

        // 指定要删除的任务文件夹路径
        let folder_path = BSTR::from("\\easytierGame");
        // let root = BSTR::from("\\");
        let task_name = BSTR::from("auto start");
        let mut penabled = VARIANT_BOOL::from(false);
        let bool_ptr: *mut VARIANT_BOOL = &mut penabled;

        // 获取任务文件夹F
        let task_folder: ITaskFolder = task_service
            .GetFolder(&folder_path)
            ?;
        let task = task_folder
            .GetTask(&task_name)
            ?;
        task.Definition()
            ?
            .Triggers()
            ?
            .get_Item(1)
            ?
            .Enabled(bool_ptr)
            ?;
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
            println!("autostart enabled: false -> {}", e);
            return false;
        }
    }
}

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
            .action(Action::new("auto start", exe, "", ""))?
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

pub const AUTOSTART_ARG: &str = "--autostart";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let stop_signal = Arc::new(AtomicBool::new(false)); // 创建一个原子布尔值，用于控制命令的停止
    let stop_signal_clone = Arc::clone(&stop_signal); // 创建一个原子布尔值的克隆，用于传递给命令
    let context = tauri::generate_context!();
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![AUTOSTART_ARG]),
        ))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            #[cfg(not(target_os = "android"))]
            let _tray_menu = TrayIconBuilder::with_id("main")
                .menu_on_left_click(false)
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
            Ok(())
        })
        .manage(stop_signal_clone)
        .invoke_handler(tauri::generate_handler![
            run_command,
            stop_command,
            get_core_version,
            fetch_easytier_list,
            download_easytier_zip,
            get_cli_version,
            get_members_by_cli,
            search_pid_by_pname,
            get_exe_directory,
            spawn_autostart,
            autostart_is_enabled
        ])
        .run(context)
        .expect("error while running tauri application");
}
