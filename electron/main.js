const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

const TWOGIS_API_KEY = '38bc2215-d648-4334-a45c-b7267fe0427e';
process.env.TWOGIS_API_KEY = TWOGIS_API_KEY;

let mainWindow;
let nextServer;
let serverPort = 3000;

async function startServer() {
  console.log('Starting server in', isDev ? 'development' : 'production', 'mode');
  console.log('API Key configured:', TWOGIS_API_KEY ? 'Yes' : 'No');
  
  if (!isDev) {
    const { createServer } = require('http');
    const { parse } = require('url');
    const next = require('next');

    const nextApp = next({
      dev: false,
      dir: path.join(__dirname, '..'),
    });
    const handle = nextApp.getRequestHandler();

    await nextApp.prepare();

    nextServer = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    await new Promise((resolve, reject) => {
      nextServer.listen(serverPort, (err) => {
        if (err) {
          console.error('Failed to start server:', err);
          reject(err);
        } else {
          console.log(`> Next.js server ready on http://localhost:${serverPort}`);
          console.log(`> API available at http://localhost:${serverPort}/api/chat`);
          resolve();
        }
      });
    });
  } else {
    console.log('> Development mode: connecting to http://localhost:3000');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    title: 'Restaurant Assistant',
    icon: path.join(__dirname, '../icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    show: false,
    backgroundColor: '#0f0f0f',
  });

  const url = `http://localhost:${serverPort}`;
  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuTemplate = [
    {
      label: 'Application',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.reload();
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  await startServer();

  setTimeout(() => {
    createWindow();
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (nextServer) {
      nextServer.close();
    }
    app.quit();
  }
});

app.on('will-quit', () => {
  if (nextServer) {
    nextServer.close();
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
