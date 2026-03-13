import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development'
if (isDev) {
  app.disableHardwareAcceleration()
  app.commandLine.appendSwitch('disable-gpu')
}

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 1200,
    minHeight: 700,
    width: 1200,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  Menu.setApplicationMenu(null)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, '../dist/index.html')}`)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

type IpcHandler = (...args: any[]) => unknown;

const handlers: Record<string, IpcHandler> = {
  //enter methods like this
  //"methodpath:get" : file-exportname.methodname,

};

for (const [channel, handler] of Object.entries(handlers)) {
  ipcMain.handle(channel, (_event, ...args) => handler(...args));
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
