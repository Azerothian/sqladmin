debug = require("debug")("sqladmin:bbmixin")

module.exports = {
  componentDidMount: ->

    updateFunc = () =>
      debug "updateFunc"
      @forceUpdate()
    for model in @getBackboneModels()
      model.on "add change remove", updateFunc, @

  componentWillUnmount: ->
    for model in @getBackboneModels()
      model.off null, null, @
}
