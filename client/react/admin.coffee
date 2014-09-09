React = require "react"
BackboneMixin = require "../bb.mixin"

{div, ul, li, a, thead, tbody, tr, th, td, h3} = React.DOM
{Col, Row, TabbedArea, TabPane, Table, Button} = require "react-bootstrap"

debug = require("debug")("sqladmin:admin")

aceeditor = require "../aceeditor"

AppData = require("../appdata")


DatabaseList = React.createClass {

  mixins: [BackboneMixin]

  getBackboneModels: () ->
    [AppData, AppData.get("databases")]

  onItemClick: (dbname) ->
    return () ->
      AppData.setDatabase dbname

  render: () ->
    items = AppData.get("databases").map (db) =>
      dbname = db.get "name"
      activeClass = if dbname is AppData.get("db") then "active" else ""
      itemOpts = {
        className: "list-group-item #{activeClass}"
        href:"javascript:;"
        onClick: @onItemClick(dbname)
      }
      a itemOpts, db.get "name"
    div {},
      h3 {}, "Databases"
      div { className: "list-group" },
        items

}


SchemaTable = React.createClass {
  mixins: [BackboneMixin]
  onItemClick: (name) ->
    return () ->
      AppData.setSchema name

  getBackboneModels: () ->
    [AppData, AppData.get("schemas")]
  render: ->
    currentSchema = AppData.get "schema"
    Table { striped: true, bordered: true, hover: true },
      thead {},
        tr {},
          th {}, "Schema"
      tbody {},
        AppData.get("schemas").map (table) =>
          schemaName = table.get "name"
          if schemaName is currentSchema
            bsStyle = "success"
          tr {},
            td {},
              Button {
                bsStyle: bsStyle
                onClick: @onItemClick(schemaName)
              }, schemaName

}

SchemaList = React.createClass {
  mixins: [BackboneMixin]
  onItemClick: (name) ->
    return () ->
      AppData.setSchema name

  getBackboneModels: () ->
    [AppData, AppData.get("schemas")]

  render: ->
    items = AppData.get("schemas").map (schema) =>
      name = schema.get "name"
      activeClass = if name is AppData.get("schema") then "active" else ""
      itemOpts = {
        className: "list-group-item #{activeClass}"
        href:"javascript:;"
        onClick: @onItemClick(name)
      }
      a itemOpts, name
    div {},
      h3 {}, "Schemas"
      div { className: "list-group" },
        items

}

TablesList = React.createClass {
  mixins: [BackboneMixin]

  getBackboneModels: () ->
    [AppData, AppData.get("tables")]
  render: ->
    Table { striped: true, bordered: true, hover: true },
      thead {},
        tr {},
          th {}, "Table Name"
      tbody {},
        AppData.get("tables").map (table) ->
          tr {},
            td {}, table.get "name"
}


RawInterface = React.createClass {

  runQuery: () ->
    debug "runQuery"
    AppData.get("rawdata").run @refs.editor.getValue()

  render: ->
    div {},
      Row {},
        Col {xs: 12, sm: 10},
          aceeditor {
            ref: "editor"
            content: "SELECT * FROM information_schema.tables"
            mode: "sql"
            style: { height: 200 }
          }
        Col {xs: 12, sm: 2},
          Button {
            className: "col-xs-12"
            bsStyle: "primary"
            onClick: @runQuery
          }, "Run"
      Row {},
        RawTable {}

}

RawTable = React.createClass {

  mixins: [BackboneMixin]

  getBackboneModels: () ->
    [AppData.get("rawdata").get("dataset")]

  render: ->
    dataset = AppData.get("rawdata").get("dataset")
    if dataset.length is 0
      return div {}, "No Results"

    headerKeys = []
    headers = []

    model = dataset.at(0)

    for key of model.attributes
      headerKeys.push key
      headers.push th {}, key

    div {},
      h3 {}, "Output"
      Table {
        responsive: true
        striped: true
        bordered: true
        hover: true
      },
        thead {},
          tr {},
            headers
        tbody {},
          dataset.map (row) ->
            columns = []
            for k in headerKeys
              columns.push td {}, row.attributes[k]
            tr {},
              columns


}



DatabaseTabs = React.createClass {
  render: ->
    TabbedArea {
      defaultActiveKey: 1
#      activeKey: if AppData.get("schema") is "" then 1 else undefined
    },
#      TabPane {key: 1, tab: "Schemas"},
#        SchemaList {}
      TabPane {
        key: 1,
        tab: "Tables",
        disabled: AppData.get("schema") is ""
      },
        TablesList {}

      TabPane {
        key: 2
        tab: "Raw"
      },
        RawInterface {}


}



module.exports = React.createClass {
  render: () ->
    div { className: "container"},
      Col { xs: 12, sm: 3 },
        DatabaseList { }
        SchemaList {}

      Col { xs: 12, sm: 9 },
        DatabaseTabs { }
}
