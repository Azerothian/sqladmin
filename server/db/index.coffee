debug = require("debug")("sqladmin:db:index")

{extend, Promise} = require("../util")

knexjs = require("knex")

PostgreSql = require "./postgres"

db = {}

module.exports = (dbtype, conn) ->
  if !db[dbtype]?
    db[dbtype] = {}
  host = "#{conn.host}:#{conn.port}"
  if !db[dbtype][host]?
    switch dbtype
      when "pg"
        db[dbtype][host] = PostgreSql(conn)
  return db[dbtype][host]
