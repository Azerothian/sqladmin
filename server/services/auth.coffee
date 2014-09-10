
debug  = require("debug")("sqladmin:services:root")
module.exports = (app, logic) ->
  return {
    get:
      "/login": logic.react.renderDynamic { path: "login" }
      "/logout": (req, res, next) ->
        req.session.destroy (err) ->
          res.redirect "/"
    post:
      "/login": (req, res, next) ->
        req.session.connectionOptions = req.body.connectionOptions
        req.session.databaseType = req.body.databaseType
        #TODO: use coffeemapper to copy to vars to reduce an attack vector
        req.session.save()
        res.json { success: true }

  }
