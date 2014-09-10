debug = require("debug")("sqladmin:logic:react")
module.exports = {
  renderDynamic: (options) ->
    return (req, res, next) ->
      options.config = require("../config")
      if !options.props?
        options.props = {}

      options.props._csrf = res.locals._csrf
      res.render "react-dynamic", options



}
