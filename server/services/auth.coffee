
debug  = require("debug")("sqladmin:services:root")
module.exports = (app, logic) ->
  return {
    get:
      "/login": (req, res, next) ->
        logic.react.renderDynamic { path: "login" }, req, res, next
      "/logout": (req, res, next) ->
        req.session.destroy (err) ->
          res.redirect "/"
    post:
      "/login": (req, res, next) ->
        req.session.knexOptions = {
          client: "pg"
          connection:
            host: req.body.host
            user: req.body.username
            password: req.body.password
            port: req.body.port
            database: "postgres"
        }
        req.session.save()
        res.json { success: true }

  }
