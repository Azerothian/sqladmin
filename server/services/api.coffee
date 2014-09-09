
extend = (object, properties) ->
  for key, val of properties
    object[key] = val
  object

knexjs = require("knex")


getKnex = (knexOptions, dbname) ->
  options = extend({}, knexOptions)
  if dbname?
    options.connection = extend({}, knexOptions.connection)
    options.connection.database = dbname
  return knexjs(options)



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
      "/api/schemas": (req, res, next) ->
        if !req.query.dbname
          next()
        knex = getKnex(req.session.knexOptions, req.query.dbname)
        knex("information_schema.tables")
          .distinct("table_schema as name")
          .orderBy('table_schema', 'desc')
          .then (result) ->
            res.json result

      "/api/tables": (req, res, next) ->
        if !req.query.dbname || !req.query.schema
          next()
        knex = getKnex(req.session.knexOptions, req.query.dbname)
        knex("information_schema.tables")
          .select("table_name as name")
          .where({ table_schema: req.query.schema })
          .orderBy('table_name', 'desc')
          .then (result) ->
            res.json result
        , () ->
          debug "rejected", arguments


      "/api/databases": (req, res, next) ->
        knex = getKnex(req.session.knexOptions)
        debug "getting databases", req.session.knexOptions
        knex.raw("SELECT datname as name FROM pg_database WHERE datistemplate = false;").then (result) ->
          #debug "result", result.rows
          res.json result.rows
        , () ->
          debug "rejected", arguments
    post:
      "/api/raw": (req, res, next) ->
        if !req.body.query || !req.body.dbname
          next()
        knex = getKnex(req.session.knexOptions, req.body.dbname)
        knex.raw(req.body.query).then (result) ->
          res.json result.rows
        , (err) ->
          debug "rejected", err
          res.json [{ ErrorMessage: err.message }] 

  }
