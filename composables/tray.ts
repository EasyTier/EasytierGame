import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import { TrayIcon } from '@tauri-apps/api/tray'
import { getCurrentWindow } from '@tauri-apps/api/window'
import pkg from '@/package.json'

const DEFAULT_TRAY_NAME = 'main'

async function toggleVisibility() {
  if (await getCurrentWindow().isVisible()) {
    await getCurrentWindow().hide()
  }
  else {
    await getCurrentWindow().show()
    await getCurrentWindow().setFocus()
  }
}

export async function useTray(init: boolean = false, beforExit) {
  let tray
  try {
    tray = await TrayIcon.getById(DEFAULT_TRAY_NAME)
    if (!tray) {
      tray = await TrayIcon.new({
        tooltip: `EasyTier\n${pkg.version}`,
        title: `EasyTier\n${pkg.version}`,
        id: DEFAULT_TRAY_NAME,
        menu: await Menu.new({
          id: 'main',
          items: await generateMenuItem(beforExit),
        }),
        action: async (e) => {
          toggleVisibility()
        },
      })
    }
  }
  catch (error) {
    console.warn('Error while creating tray icon:', error)
    return null
  }

  if (init) {
    tray.setTooltip(`EasyTier\n${pkg.version}`)
    tray.setMenuOnLeftClick(false)
    tray.setMenu(await Menu.new({
      id: 'main',
      items: await generateMenuItem(beforExit),
    }))
  }

  return tray
}

export async function generateMenuItem(beforExit: Function) {
  return [
    await MenuItemExit('退出', beforExit),
    await PredefinedMenuItem.new({ item: 'Separator' }),
    await MenuItemShow('显示 / 隐藏'),
  ]
}

export async function MenuItemExit(text: string, beforExit: Function) {
  return await MenuItem.new({
    id: "quit",
    text,
    action: async () => {
      if (beforExit) {
        await beforExit();
      }
      await getCurrentWindow().close();
    }
  })
}

export async function MenuItemShow(text: string) {
  return await MenuItem.new({
    id: 'show',
    text,
    action: async () => {
      await toggleVisibility()
    },
  })
}

// export async function setTrayMenu(items: (MenuItem | PredefinedMenuItem)[] | undefined = undefined) {
//   const tray = await useTray()
//   if (!tray)
//     return
//   const menu = await Menu.new({
//     id: 'main',
//     items: items || await generateMenuItem(),
//   })
//   tray.setMenu(menu)
// }

// export async function setTrayRunState(isRunning: boolean = false) {
//   const tray = await useTray()
//   if (!tray)
//     return
//   tray.setIcon(isRunning ? 'icons/icon-inactive.ico' : 'icons/icon.ico')
// }

// export async function setTrayTooltip(tooltip: string) {
//   if (tooltip) {
//     const tray = await useTray()
//     if (!tray)
//       return
//     tray.setTooltip(`EasyTier\n${pkg.version}\n${tooltip}`)
//     tray.setTitle(`EasyTier\n${pkg.version}\n${tooltip}`)
//   }
// }