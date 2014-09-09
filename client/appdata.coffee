jQuery = require "jquery"
Backbone = require "backbone"
Backbone.$ = jQuery


debug = require("debug")("sqladmin:appdata")
require("debug").enable("*")


class Table extends Backbone.Model
  defaults:
    name: ""
    schema: ""
  url: "/api/table"

class TableCollection extends Backbone.Collection
  model: Table
  url: "/api/tables"

class Database extends Backbone.Model
  defaults:
    name: ""
  url: "/api/database"

class DatabaseCollection extends Backbone.Collection
  model: Database
  url: "/api/databases"


class Schema extends Backbone.Model
  defaults:
    name: ""
  url: "/api/schema"

class SchemaCollection extends Backbone.Collection
  model: Schema
  url: "/api/schemas"



class RawData extends Backbone.Model
  defaults:
    query: undefined
    db: undefined
  constructor: () ->
    super
    @set "dataset", new Backbone.Collection()
    @on "change:query", () =>
      if !@get("db")?
        debug "unable to send, no db set"
        return

      @get("dataset").reset()

      options = {
        url: "/api/raw"
        dataType: "json"
        type: "POST"
        contentType: "application/json"
        data: JSON.stringify {
          "_csrf": window._csrf
          "dbname": @get "db"
          "query": @get "query"
        }
        context: @
      }

      jQuery.ajax(options).done (data, status, xhr) ->
        if data? and data.length > 0
          @get("dataset").add data

class AppData extends Backbone.Model
  defaults:
    db: undefined
    schema: undefined
    rawQuery: undefined

  constructor: () ->
    super

    @set 'rawdata', new RawData()
    @set 'databases', new DatabaseCollection()
    @set 'tables', new TableCollection()
    @set 'schemas', new SchemaCollection()

    @get('databases').fetch()

    @on "change:db", () =>
      @get("rawdata").set "db", @get "db"

      @set "schema", undefined
      @get("schemas").reset()
      @get("tables").reset()
      @get('schemas').fetch {
        data: $.param {
          dbname: @get "db"
        }
      }
    @on "change:schema", () =>
      if @get("schema")?
        @get("tables").reset()
        @get('tables').fetch {
          data: $.param {
            dbname: @get "db"
            schema: @get "schema"
          }
        }

    @setDatabase("postgres")

  setDatabase: (dbname) =>
    @set "db", dbname


  setSchema: (name) =>
    @set "schema", name

module.exports = new AppData()
