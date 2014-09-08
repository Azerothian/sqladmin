
debug  = require("debug")("sqladmin:services:root")
module.exports = (app, logic) ->
  return {
    get:
      "/": (req, res, next) ->
        if !req.session.knexOptions?
          res.redirect "/login"
        else
          logic.react.renderDynamic "admin", {}, req, res, next

      "/login": (req, res, next) ->
        logic.react.renderDynamic "login", {}, req, res, next
      "/logout": (req, res, next) ->
        req.session.destroy (err) ->
          res.redirect "/"

      "/api/database": (req, res, next) ->

      "/api/databases": (req, res, next) ->
        knex = require("knex")(req.session.knexOptions)
        knex.raw("SELECT datname as name FROM pg_database WHERE datistemplate = false;").then (result) ->
          debug "result", result.rows
          res.json result.rows
        , () ->
          debug "rejected", arguments

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
