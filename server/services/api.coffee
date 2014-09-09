
extend = (object, properties) ->
  for key, val of properties
    object[key] = val
  object

knexjs = require("knex")

debug  = require("debug")("sqladmin:services:api")
module.exports = (app, logic) ->

  return {
    before: (type, path) ->
      return (req, res, next) ->
        if !req.session.knexOptions?
          res.redirect "/login"
        else
          next()
    get:
      "/": (req, res, next) ->
        logic.react.renderDynamic { path: "admin", disableServer: true }, req, res, next

      "/api/tables": (req, res, next) ->
        if !req.query.dbname
          next()
        options = extend({}, req.session.knexOptions)
        options.connection = extend({}, req.session.knexOptions.connection)
        options.connection.database = req.query.dbname

        knex = knexjs(options)
        debug "getting tables", options
        knex("information_schema.tables").select("table_name as name", "table_schema as schema").orderBy('table_schema', 'desc').then (result) ->
          #debug "result", result
          res.json result
        , () ->
          debug "rejected", arguments


      "/api/databases": (req, res, next) ->

        knex = knexjs(req.session.knexOptions)
        debug "getting databases", req.session.knexOptions
        knex.raw("SELECT datname as name FROM pg_database WHERE datistemplate = false;").then (result) ->
          #debug "result", result.rows
          res.json result.rows
        , () ->
          debug "rejected", arguments

  }
