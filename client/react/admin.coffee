React = require "react"
BackboneMixin = require "../bb.mixin"

{div, ul, li, a, thead, tbody, tr, th, td} = React.DOM
{Col, TabbedArea, TabPane, Table} = require "react-bootstrap"

debug = require("debug")("sqladmin:admin")


AppData = require("../appdata")


DatabaseList = React.createClass {

  mixins: [BackboneMixin]

  getBackboneModels: () ->
    [AppData, AppData.get("databases")]

  onItemClick: (dbname) ->
    return () ->
      AppData.set "selecteddb", dbname

  render: () ->
    items = AppData.get("databases").map (db) =>
      dbname = db.get "name"
      activeClass = if dbname is AppData.get("selecteddb") then "active" else ""
      itemOpts = {
        className: "list-group-item #{activeClass}"
        href:"javascript:;"
        onClick: @onItemClick(dbname)
      }
      a itemOpts, db.get "name"
    div { className: "list-group" },
      items

}

TablesList = React.createClass {
  mixins: [BackboneMixin]

  getBackboneModels: () ->
    [AppData.get("tables")]
  render: ->
    Table { striped: true, bordered: true, hover: true },
      thead {},
        tr {},
          th {}, "Schema"
          th {}, "Table Name"
      tbody {},
        AppData.get("tables").map (table) ->
          tr {},
            td {}, table.get "schema"
            td {}, table.get "name"
}


DatabaseTabs = React.createClass {
  render: ->
    TabbedArea {defaultActiveKey: 1},
      TabPane {key: 1, tab: "Tables"},
        TablesList {}
      TabPane {key: 1, tab: "Other"},
        div {}, "Other stuff"

}



module.exports = React.createClass {
  render: () ->
    div { className: "container"},
      Col { xs: 12, sm: 3 },
        DatabaseList { }
      Col { xs: 12, sm: 9 },
        DatabaseTabs { }
}
