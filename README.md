# [EasyTier游戏联机启动器](https://github.com/EasyTier/EasytierGame)

## 简介

EasyTierGame游戏联机启动器，由`nuxt3` `typescript` `rust` `tauri` 开发
具有简易的界面，附带最新版easytier内核，联机游玩的时候无论是心理上和使用上都能给予您最舒服的体验，同时支持自定义配置文件启动，满足各种需求

## 下载

Github
Releases： [https://github.com/EasyTier/EasytierGame/releases](https://github.com/EasyTier/EasytierGame/releases)

- 只有绿色zip包，个人不喜欢安装包各种写注册表，解压即用就行，目录清爽干净

![game-step1](/assets/game-step1.png)


## 使用教程

- 第一次使用，输入一个“主机名”点击启动联机即可，后续可以自建服务器或者使用爱心群友提供的服务器
    ![game-step2](/assets/game-step2.png)

![game-step3](/assets/game-step3.png)

- 高级选项里有一些特殊配置，可以自行选择
    ![game-step4](/assets/game-step4.png)

- 如果还是无法满足您的需求，可以使用配置文件进行启动，具体如何配置，可以查看文档[配置文件](/guide/network/config-file.html)
    ![game-step5](/assets/game-step5.png)

- easytier内核升级后，可以点击内核管理按钮就可以进行内核切换和更新，但是需要出国或者github加速链接，如果无法更新，可以在群里获取
    ![game-step6](/assets/game-step6.png)

- 1.1.4更新了 配置分享功能 可以与朋友之间分享配置，方便联机


![game-step7](/assets/game-step7.png)

- 1.1.5 合并额外插件于 "增强工具" 窗口 新增了网卡跃点设置 关闭防火墙功能 ping功能
![game-step8](/assets/game-step8.png)

![game-step9](/assets/game-step9.png)

- 1.1.8 新增了 生成 easytier/config.json 的功能 会将一部分配置写入到 config.json 文件中，方便用户自定义配置，你可以在高级设置里启用和关闭这个功能(默认关闭)
**需要注意的是，如果config.json存在，每次启动easytierGame默认按照config.json的配置为准**
**解压zip后你可以查看 easytier/config_template.json 里的注释进行配置**
![game-step10](/assets/game-step10.png)

- 1.2.3新增了帮助.txt 位于“easytier/帮助.txt" 内含 无法打开界面和卸载EasytierGame的办法，新增 "easytier/clear_local_data.bat" 用于清除easytierGame的本地缓存数据（需要管理员模式运行）
![game-step11](/assets/game-step11.png)

## 特性

- 基于easytier组网工具开发，界面清晰简单
- 自带“更新”按钮，在easytier组网工具发布新版本时，点击更新即可（需要出国工具）
- 第一次使用，输入一个“主机名”点击启动联机即可，后续可以自建服务器或者使用群友的服务器
- 配置简单，也含有高级功能，同时也支持自定义配置文件启动
- 默认开启 **WinIPBroadcast** 不再怕联机找不到房间（例如：无主之地3）
- 已经测试 **艾尔登法环学习版**，**无主之地3**，**深岩银河**，**怪物猎人世界** 等都可稳定联机游玩

## 系统支持

支持Windows 11 、Windows 10 、 Windows 7

## 群聊交流
- 主群
![main_group_qrcode.jpg](/assets/main_group_qrcode.jpg)

- 游戏联机交流群
![group_qrcode.jpg](/assets/group_qrcode.jpg)


## 请不要将本程序和仓库代码用于任何违法用途，由此产生的一切后果，仓库所有者和参与开发的人员不承担任何责任

