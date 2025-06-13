const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.on('fs-exists', (e, p) => { e.returnValue = fs.existsSync(p); });
ipcMain.on('fs-mkdir', (e, p) => { if (!fs.existsSync(p)) fs.mkdirSync(p); e.returnValue = true; });
ipcMain.on('fs-readfile', (e, p) => { try { e.returnValue = fs.readFileSync(p, 'utf8'); } catch { e.returnValue = null; }});
ipcMain.on('fs-writefile', (e, p, data) => { fs.writeFileSync(p, data); e.returnValue = true; });
ipcMain.on('fs-writefile-buffer', (e, p, buf) => {
  try {
    fs.writeFileSync(p, Buffer.from(buf));
    e.returnValue = true;
  } catch (err) {
    console.error('Failed to write buffer', err);
    e.returnValue = false;
  }
});
ipcMain.on('fs-readdir', (e, p) => { try { e.returnValue = fs.readdirSync(p); } catch { e.returnValue = []; }});
ipcMain.on('fs-copyfile', (e, src, dest) => { fs.copyFileSync(src, dest); e.returnValue = true; });
ipcMain.on('open-external', (e, url) => { shell.openExternal(url); e.returnValue = true; });
ipcMain.on('user-info', (e) => { e.returnValue = os.userInfo().username; });

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
