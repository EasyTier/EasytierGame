rustup default nightly
rem 使用rust nightly构建支持win7的版本，请先将根目录的windows.0.48.5 放入以下目录
rem C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\你自己的版本\lib\x64
rem C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\你自己的版本\lib\x86
rem C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\你自己的版本\atlmfc\lib\x64
rem C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\你自己的版本\atlmfc\lib\x86
pnpm tauri build -- -Z  build-std --target x86_64-win7-windows-msvc
rustup default stable
pnpm tauri build
pnpm run release
pnpm run release-win7