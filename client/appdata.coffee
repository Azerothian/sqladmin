jQuery = require "jquery"
Backbone = require "backbone"
Backbone.$ = jQuery


debug = require("debug")("sqladmin:appdata")

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

class AppData extends Backbone.Model
  defaults:
    selecteddb: "postgres"

  constructor: () ->
    super
    dbc = new DatabaseCollection()
    dbc.fetch()
    @set 'databases', dbc
    @set 'tables', new TableCollection()

    @on "add change remove", () =>
      options =  {
        dbname: @get "selecteddb"
      }
      @get('tables').fetch { data: $.param(options) }


module.exports = new AppData()
