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
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Emitter;
use tauri::Manager;
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
    match Command::new("easytier-core.exe")
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
    match Command::new("easytier-cli.exe")
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
    response: PeerRoute
}



#[tauri::command(rename_all = "snake_case")]
fn get_members_by_cli() -> String {
    match Command::new("easytier-cli.exe")
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
    let target = format!("https://ghp.ci/{}", download_url);
    let response = reqwest::get(target)
        .await
        .expect("error to download easytier url");
    let file_path = format!("./{}", file_name);
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
        let out_file_path = path::Path::new("./").join(outpath.file_name().clone().unwrap());
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
    // if !path::Path::new("easytier-core.exe").exists() {
    //     app_handle.emit("command-output", "easytier-core.exe 不存在");
    //     return
    // }
    let (tx, rx) = mpsc::channel();
    stop_signal.store(false, Ordering::Relaxed);
    let app_handle1 = app_handle.clone();
    let app_handle2 = app_handle.clone();
    let stop_signal = Arc::clone(&stop_signal);
    let args2 = args.clone();
    thread::spawn(move || {
        let mut child = Command::new("easytier-core.exe")
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

        println!("end");
    });

    thread::spawn(move || {
        while let Ok(line) = rx.recv() {
            if stop_signal.load(Ordering::Relaxed) {
                break;
            }
            app_handle2
                .emit("command-output", line)
                .expect("failed to emit event");
        }
    });
}

#[tauri::command(rename_all = "snake_case")]
fn stop_command(child_id: u32, stop_signal: tauri::State<Arc<AtomicBool>>) {
    println!("stop command");
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
    }
    stop_signal.store(true, Ordering::Relaxed);
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let stop_signal = Arc::new(AtomicBool::new(false)); // 创建一个原子布尔值，用于控制命令的停止
    let stop_signal_clone = Arc::clone(&stop_signal); // 创建一个原子布尔值的克隆，用于传递给命令
    let context = tauri::generate_context!();
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        // .on_window_event(move |window, event| {
        //     if let WindowEvent::CloseRequested { api, .. } = event {
        //         println!("close window");
        //         unsafe {
        //             if !IS_CLOSE && window.label() == "main" {
        //                 api.prevent_close();
        //                 window.emit("window-close-event", "").unwrap();
        //             }
        //         }
        //     }
        // })
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
            get_members_by_cli
        ])
        .run(context)
        .expect("error while running tauri application");
}
