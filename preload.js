const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

const base = __dirname;
const paths = {
  logPath: path.join(base, 'changelog.json'),
  dataPath: path.join(base, 'data.json'),
  importInfoPath: path.join(base, 'import-info.json'),
  docsDir: path.join(base, 'uploads'),
  ticketsPath: path.join(base, 'tickets.json')
};

contextBridge.exposeInMainWorld('paths', paths);

contextBridge.exposeInMainWorld('api', {
  exists: (p) => ipcRenderer.sendSync('fs-exists', p),
  mkdir: (p) => ipcRenderer.sendSync('fs-mkdir', p),
  readFile: (p) => ipcRenderer.sendSync('fs-readfile', p),
  writeFile: (p, data) => ipcRenderer.sendSync('fs-writefile', p, data),
  writeFileBuffer: (p, buf) => ipcRenderer.sendSync('fs-writefile-buffer', p, buf),
  readdir: (p) => ipcRenderer.sendSync('fs-readdir', p),
  copyFile: (src, dest) => ipcRenderer.sendSync('fs-copyfile', src, dest),
  openExternal: (url) => ipcRenderer.sendSync('open-external', url),
  userName: () => ipcRenderer.sendSync('user-info')
});
