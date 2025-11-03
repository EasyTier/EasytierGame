pnpm run build
rustup default nightly

pnpm tauri build -- -Z  build-std --target x86_64-win7-windows-msvc
rustup default stable
pnpm tauri build

@REM 复制文件夹src-tauri\easytier 到 src-tauri\target\release目录下 覆盖目录下同名目录
xcopy /s /y /i src-tauri\easytier src-tauri\target\release\easytier
@REM 复制 src-tauri\帮助.txt 和 src-tauri\uninstall.exe 到 src-tauri\target\release目录下 覆盖目录下同名文件
xcopy /y src-tauri\帮助.txt src-tauri\target\release\帮助.txt
xcopy /y src-tauri\uninstall.exe src-tauri\target\release\uninstall.exe
@REM 复制文件夹src-tauri\easytier到 src-tauri\target\x86_64-win7-windows-msvc\release目录下 覆盖目录下同名目录
@REM 复制 src-tauri\帮助.txt 和 src-tauri\uninstall.exe 到 src-tauri\target\x86_64-win7-windows-msvc\release目录下 覆盖目录下同名文件
xcopy /y src-tauri\帮助.txt src-tauri\target\x86_64-win7-windows-msvc\release\帮助.txt
xcopy /y src-tauri\uninstall.exe src-tauri\target\x86_64-win7-windows-msvc\release\uninstall.exe
xcopy /s /y /i src-tauri\easytier src-tauri\target\x86_64-win7-windows-msvc\release\easytier

pnpm run release
pnpm run release-win7