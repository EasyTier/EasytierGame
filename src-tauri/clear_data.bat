@echo off
chcp 65001 >nul
setlocal

REM 检查是否具有管理员权限
openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo 当前没有管理员权限，鼠标右键clear_data.bat，选择使用管理员模式运行...
    pause
    exit /b
)

REM 获取当前用户的 Local 目录路径
set "local_dir=%LOCALAPPDATA%"

REM 设置要删除的任务计划程序文件夹名称
set "folder_name=\easytierGame"
set "task_name=auto start"

REM 设置要删除的目标文件夹
set "target_data_dir=%local_dir%\com.tauri.easytier-game"
echo ---
REM 打印 Local 目录路径
echo 当前数据目录: %target_data_dir%
echo ---
echo 您确定要清除EasytierGame的本地数据吗? (y/n)
echo ---

REM 等待用户输入
set /p confirm=输入'y/n'进行确认:

if /i "%confirm%"=="y" (
    echo 清除数据中,请稍后...
    echo ---
    REM 删除任务计划程序文件夹
    echo delete auto_start task ...
    echo ---
    REM 获取文件夹中的所有任务
    schtasks /delete /tn "%folder_name%\%task_name%" /f
    schtasks /delete /tn "%folder_name%" /f

    if exist "%target_data_dir%" (
        REM 删除目标文件夹及其内容
        rd /s /q "%target_data_dir%"
    )
    echo 清楚本地缓存数据完毕.
    echo ---
    echo 您可以手动删除当前目录完成EasytierGame的卸载.
) else (
    echo 取消清理数据
)

pause
endlocal
