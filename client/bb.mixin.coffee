debug = require("debug")("sqladmin:bbmixin")
_ = require "underscore"
module.exports = {
  componentDidMount: ->

    updateFunc = () =>
      debug "updateFunc"
      @forceUpdate()
    for model in @getBackboneModels()
      model.on "add change remove", _.throttle(updateFunc, 100), @

  componentWillUnmount: ->
    for model in @getBackboneModels()
      model.off null, null, @
}
