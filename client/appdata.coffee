jQuery = require "jquery"
Backbone = require "backbone"



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
  run: (query) =>

    db = @get("db")

    @get("dataset").reset()

    options = {
      url: "/api/raw"
      dataType: "json"
      type: "POST"
      contentType: "application/json"
      data: JSON.stringify {
        "_csrf": window._csrf
        "dbname": db
        "query": query
      }
      context: @
    }

    jQuery.ajax(options).done (data, status, xhr) ->
      if data? and data.length > 0
        @get("dataset").add data

  constructor: () ->
    super
    @set "dataset", new Backbone.Collection()


class AppData extends Backbone.Model
  defaults:
    db: undefined
    schema: undefined
    rawQuery: undefined

  constructor: () ->
    Backbone.$ = jQuery
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
      @get('schemas').fetch({
        data: $.param {
          dbname: @get "db"
        }
      }).done () =>
        schemas = @get("schemas")
        if schemas.length > 0
          @set 'schema', schemas.at(0).get "name"

    @on "change:schema", () =>
      if @get("schema")?
        @get("tables").reset()
        @get('tables').fetch({
          data: $.param {
            dbname: @get "db"
            schema: @get "schema"
          },
        })

    #@setDatabase("postgres")

  setDatabase: (dbname) =>
    @set "db", dbname


  setSchema: (name) =>
    @set "schema", name

module.exports = new AppData()
