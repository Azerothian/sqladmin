React = require "react"

_ = require "underscore"
backbone = require "backbone"

database = require "../models/database"



{div, ul, li} = React.DOM


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

  getBackboneModels: () ->
    [@props.databases]

  componentDidMount: () ->
    @props.databases.fetch()


  render: () ->
    items = @props.databases.map (db) ->
      li {}, db.name
    ul {},
      items

}





module.exports = React.createClass {
  render: () ->
    div { className: "container"},
      DatabaseList { databases: new database.collection() }
}
