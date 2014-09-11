app = require "app"
BrowserWindow = require "browser-window"
Menu = require "menu"
MenuItem = require('menu-item')



debug = require("debug")("client:index")

app.on 'windows-all-closed', () ->
  if process.platform != 'darwin' # not sure if i like this?
    app.quit()

mainWindow = null

menuData = [{
  label: "File"
  submenu: [{
    label: 'Reload'
    click: ->
      debug "reload"
      mainWindow.reloadIgnoringCache()
  }, {
    label: 'Toggle DevTools'
    click: ->
      debug "toggle"
      mainWindow.toggleDevTools()
  },{
    label: 'Quit'
    click: ->
      debug "quit"
      app.quit()
  }]
}]

require("../server/app").then () ->
  app.on 'ready', () ->
    require('crash-reporter').start()
    menu = Menu.buildFromTemplate menuData
    Menu.setApplicationMenu menu

    # Create the browser window.
    mainWindow = new BrowserWindow {
      width: 800
      height: 600
      frame: true
    }

    # and load the index.html of the app.
    mainWindow.loadUrl 'http://localhost:6655/'
    #mainWindow.openDevTools()
    mainWindow.show()
    # Emitted when the window is closed.
    mainWindow.on 'closed', () ->
      mainWindow = null
