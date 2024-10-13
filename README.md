# EasyiterGame
基于easytier的简易游戏联机启动器

1. 开发环境如何运行
   拉取仓库，使用命令行  pnpm install  安装包
   安装完成后， 使用 pnpm tauri dev 进行rust编译 等待启动

2. 生产环境发布
   执行 pnpm tauri build
   产物位于 src-tauri/target/release 下 easytier-game.exe
