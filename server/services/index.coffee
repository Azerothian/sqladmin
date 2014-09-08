module.exports = (expressApp, logic) ->
  return {
    root: require("./root")(expressApp, logic)
  }
