debug = require("debug")("sqladmin:db:postgres")
knexjs = require "knex"
{extend, Promise} = require "../util"

connections = {}
module.exports = (connectionConfig) ->
  getConfig = (dbname = "postgres") ->
    config = {
      client: "pg"
      connection: connectionConfig
    }
    config.connection.database = dbname
    return config


  getKnex = (dbname) ->
    if !connections[dbname]?
      config = getConfig(dbname)
      connections[dbname] = knexjs config
    return connections[dbname]


  return {
    database:
      get: () ->
        return new Promise (resolve, reject) ->
          q = "SELECT datname as name FROM pg_database WHERE datistemplate = false;"
          debug "its knext time"
          knexjs({
            client: "pg"
            connection: {
              host: "127.0.0.1"
              port: 5432
              username: "postgres"
              password: "12qwaszx"
              database: "postgres"
            }
          }).raw(q).then (results) ->
            debug "its knext time - fin"
            resolve(result.rows)
          , reject
    table:
      get: (dbname, schema) ->
        return getKnex(dbname)("information_schema.tables")
          .select("table_name as name")
          .where({ table_schema: schema })
          .orderBy('table_name', 'desc')
    schema:
      get: (dbname) ->
        return getKnex(dbname)("information_schema.tables")
            .distinct("table_schema as name")
            .orderBy('table_schema', 'desc')
  }

###
{Base, BaseSubclass} = require "./base"
class PgDatabase extends BaseSubclass
  get: () ->
    return new Promise (resolve, reject) =>
      q = "SELECT datname as name FROM pg_database WHERE datistemplate = false;"
      debug "its knext time"
      @raw(q).then (results) ->
        debug "its knext time - fin"
        resolve(result.rows)
      , reject

class PgSchema extends BaseSubclass
  get: (dbname) ->
    #return new Promise (resolve, reject) =>
    return @getKnex(dbname)("information_schema.tables")
        .distinct("table_schema as name")
        .orderBy('table_schema', 'desc')
        #.then resolve, reject
class PgTable extends BaseSubclass
  get: (dbname, schema) ->
    #return new Promise (resolve, reject) =>
    return @getKnex(dbname)("information_schema.tables")
      .select("table_name as name")
      .where({ table_schema: schema })
      .orderBy('table_name', 'desc')
        #.then resolve, reject

class PostgreSql extends Base
  constructor: () ->
    @client = "pg"
    @defaultdb = "postgres"
    super
    @database = new PgDatabase(@)
    @schema = new PgSchema(@)
    @table = new PgTable(@)

module.exports = PostgreSql
###
