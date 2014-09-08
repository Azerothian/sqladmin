jQuery = require "jquery"
Backbone = require "backbone"
Backbone.$ = jQuery

class Database extends Backbone.Model
  defaults:
    name: ""
  url: "/api/database"

class DatabaseCollection extends Backbone.Collection
  model: Database
  url: "/api/databases"

module.exports = {
  model: Database,
  collection: DatabaseCollection
}
