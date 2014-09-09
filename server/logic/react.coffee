debug = require("debug")("sqladmin:logic:react")
module.exports = {
  renderDynamic: (options, req, res, next) ->

    options.config = require("../config")
    if !options.props?
      options.props = {}

    options.props._csrf = res.locals._csrf
    debug "renderDynamic", options
    res.render "react-dynamic", options


}
