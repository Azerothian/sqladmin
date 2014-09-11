
#db = require "../db"

debug  = require("debug")("sqladmin:services:api")
{extend, Promise} = require "../util"
knexjs = require "knex"

onError = (err, res) ->
  debug "onerror", err
  res.status(500)
    .json { ErrorMessage: err.message, Error: err }

knexStorage = {}

getKnex = (session, dbname = "") ->
  hostKey = "#{session.databaseType}@#{session.connectionOptions.host}:#{session.connectionOptions.port}/#{dbname}"
  if !knexStorage[hostKey]?
    options = {
      client: session.databaseType
      connection: extend {}, session.connectionOptions
    }
    if dbname?
      options.connection.database = dbname
    knexStorage[hostKey] = knexjs(options)
  return knexStorage[hostKey]




data = {}
data["pg"] = (session) ->

  raw = (query, dbname = "postgres") ->
    return new Promise (resolve, reject) ->
      debug "pg - raw", query
      knex = getKnex(session, dbname)
      debugger;
      return knex.raw(query).then (result) ->
        resolve(result)
      , reject

  return {
    database:
      get: () ->
        return new Promise (resolve, reject) ->
          q = "SELECT datname as name FROM pg_database WHERE datistemplate = false;"
          return raw(q).then (result) ->
            resolve(result.rows)
          , reject
    table:
      get: (dbname, schema) ->
        return getKnex(session, dbname)("information_schema.tables")
          .select("table_name as name")
          .where({ table_schema: schema })
          .orderBy('table_name', 'desc')
    schema:
      get: (dbname) ->
        return getKnex(session, dbname)("information_schema.tables")
            .distinct("table_schema as name")
            .orderBy('table_schema', 'desc')
    raw: (query, dbname) ->
      return new Promise (resolve, reject) ->
        return raw(query, dbname).then (result) ->
          resolve(result.rows)
        , reject
  }

data["mysql"] = (session) ->

  raw = (query, dbname) ->
    return new Promise (resolve, reject) ->
      debug "mysql - raw", query
      knex = getKnex(session, dbname)
      return knex.raw(query).then (result) ->
        #debug "mysql - raw", result
        resolve(result)
      , reject

  return {
    database:
      get: () ->
        return new Promise (resolve, reject) ->
          return raw("SHOW DATABASES;").then (result) ->
            propName = result[1][0].name
            d = []
            for r in result[0]
              d.push { name: r[propName] }
            resolve(d)
          , reject
    table:
      get: (dbname, schema) ->
        return new Promise (resolve, reject) ->
          return raw("SHOW FULL TABLES FROM #{dbname};").then (result) ->
            propName = result[1][0].name
            d = []
            for r in result[0]
              d.push { name: r[propName] }
            resolve(d)

          , reject
    schema:
      get: (dbname) ->
        return new Promise (resolve, reject) ->
          resolve([{ name: "mysql" }])
    raw: raw
  }


getDB = (session) ->
  return data[session.databaseType](session)


module.exports = (app, logic) ->

  return {
    before: (type, path) ->
      return (req, res, next) ->
        if !req.session.connectionOptions?
          res.redirect "/login"
        else
          next()
    get:
      "/": logic.react.renderDynamic { path: "admin", disableServer: true, title: "SqlAdmin - Administration" }

      "/api/schemas": (req, res, next) ->
        debug "get - /api/schemas"
        if !req.query.dbname
          next()

        resolve = (rows) ->
          res.json rows
        reject = (err) ->
          onError(err, res)

        getDB(req.session)
          .schema
          .get(req.query.dbname)
          .then resolve, reject

      "/api/tables": (req, res, next) ->
        debug "get - /api/tables"
        if !req.query.dbname || !req.query.schema
          next()
        resolve = (rows) ->
          res.json rows
        reject = (err) ->
          onError(err, res)
        getDB(req.session)
          .table
          .get(req.query.dbname, req.query.schema)
          .then resolve, reject

      "/api/databases": (req, res, next) ->
        debug "get - /api/databases"

        resolve = (rows) ->
          debug "/api/databases - rows ", rows
          res.json rows

        reject = (err) ->
          onError(err, res)

        getDB(req.session)
          .database
          .get()
          .then resolve, reject
          .catch reject

    post:
      "/api/raw": (req, res, next) ->
        debug "get - /api/raw", req.body.query
        if !req.body.query
          next()

        resolve = (rows) ->
          res.json rows
        reject = (err) ->
          res.json [{ ErrorMessage: err.message }]

        getDB(req.session).raw(req.body.query, req.body.dbname)
          .then resolve, reject



  }
