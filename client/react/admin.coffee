React = require "react"

_ = require "underscore"
backbone = require "backbone"

database = require "../models/database"

dbcollection = new database.collection()
debug = require("debug")("sqladmin:admin")

{div, ul, li, a} = React.DOM

{Col} = require "react-bootstrap"

BackboneMixin = {
  componentDidMount: ->
    func = (model) ->
      model.on "add change remove", @forceUpdate.bind(@, null), @
    @getBackboneModels().forEach func, @

  componentWillUnmount: ->

    func = (model) ->
      model.off null, null, @
    @getBackboneModels().forEach func, @
}


DatabaseList = React.createClass {
  mixins: [BackboneMixin]
  getInitialState: () ->
    {
      selected: "postgres"
    }

  getBackboneModels: () ->
    [@props.databases]

  componentDidMount: () ->
    @props.databases.fetch()


  render: () ->

    items = @props.databases.map (db) =>
      dbname = db.get "name"
      activeClass = if dbname is @state.selected then "active" else ""
      itemOpts = {
        className: "list-group-item #{activeClass}"
        href:"javscript:;"
      }
      a itemOpts, db.get "name"
    div { className: "list-group" },
      items

}

TablesList = React.createClass {
  
}


DatabaseTabs = React.createClass {
  getInitialState: () ->
    {
      selected: "tables"
    }
  setTab: (name) ->
    return () =>
      if @state.selected is not name
        @setState { selected: name }
  isTabActive: (name) ->
    return if @state.selected is name then "active" else ""

  createTab: (name, displayName) ->
    li { className: @isTabActive("tables") },
      a {
        href: "javascript:;",
        onClick: @setTab("tables")
      }, "Tables"

  render: () ->

    currentTab = undefined
    switch @state.selected
      when "tables"
        currentTab =


    div {},
      ul { className: "nav nav-tabs", role: "tablist" },
        @createTab("tables", "Tables")
      div { className: "tab-content" },
        currentTab
}



module.exports = React.createClass {
  getInitialState: () ->
    {
      database: "postgres"
    }
  onDatabaseSelect: (dbname) ->
    @setState { database: dbname }

  render: () ->
    div { className: "container"},
      Col { xs: 12, sm: 4 },
        DatabaseList { database: @state.database, databases: dbcollection, onSelect: onDatabaseSelect  }
      Col { xs: 12, sm: 8 },
        DatabaseTabs { database: @state.database }
}
