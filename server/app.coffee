Promise = require "native-or-bluebird"
http = require "http"
express = require "express"
ect = require 'ect'
session = require "express-session"
cookieParser = require "cookie-parser"
bodyParser = require "body-parser"
Promise = require "bluebird"
lusca = require "lusca"

debug = require("debug")("sqladmin:app")
config = require "./config"
router = require "./router"
logic = require "./logic"

ex = new Promise (resolve, reject) ->
  expressApp = express()

  ## SET VIEW RENDERER
  expressApp.set "views", config.paths.views
  expressApp.set 'view engine', 'ect'
  ectRenderer = ect { watch: false, root: config.paths.views, ext : '.ect' }
  expressApp.engine 'ect', ectRenderer.render

  ##END - SET VIEW RENDERER

  ## APPLY MISSLEWARE
  missleware = [
    cookieParser(config.express.cookies)
    bodyParser.json()
    bodyParser.urlencoded()
    session(config.express.session)
    lusca(config.lusca)
  ]

  for val in missleware
    expressApp.use val
  ##END - APPLY MISSLEWARE

  services = require("./services")(expressApp, logic())
  promises = []

  for key, val of services
    promises.push router(expressApp, val)

  Promise.all(promises).then () ->
    expressApp.use express.static(config.paths.public)
    debug "Starting Application #{config.express.port}"
    http.createServer(expressApp).listen(config.express.port)
    debug "resolve"
    resolve()


if require.main is module
  ex.then () ->
    debug "complete"

module.exports = ex
