module.exports = (expressApp, logic) ->
  return {
    auth: require("./auth")(expressApp, logic)
    api: require("./api")(expressApp, logic)
  }
