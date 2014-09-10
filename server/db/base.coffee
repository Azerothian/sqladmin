debug = require("debug")("sqladmin:db:base")
knexjs = require("knex")

{extend, Promise} = require("../util")

class Base
  constructor: (@connectionConfig) ->
    @connections = {}

  getKnex: (dbname) =>
    if !@connections[dbname]?
      config = @getConfig(dbname)
      debug "config", config
      @connections[dbname] = knexjs config

    return @connections[dbname]

  getConfig: (dbname = @defaultdb) =>
    return {
      client: @client
      connection: extend {
        database: dbname
      }, @connectionConfig
    }

  raw: (query, dbname) =>
    return new Promise (resolve, reject) =>
      debug "raw: #{query}"
      k = @getKnex(dbname)
      k.raw.apply(k, [query]).then (result) ->
        debug "raw: #{query}"
        resolve(result.rows)
      , reject

class BaseSubclass
  constructor: (@base) ->

  getKnex: () =>
    return @base.getKnex.apply @base, arguments
  raw: () =>
    return @base.raw.apply @base, arguments


module.exports = {
  Base: Base
  BaseSubclass: BaseSubclass
}
