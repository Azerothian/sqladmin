debug = require("debug")("sqladmin:logic:react")
config = require("../config")


module.exports = {
  renderDynamic: (options) ->
    return (req, res, next) ->
      options.config = config
      if !options.props?
        options.props = {}

      options.props._csrf = res.locals._csrf

      if !options.disableServer
        {React} = require("../util")

        componentPath = "#{config.paths.react}/#{options.path}"

        component = require("#{config.paths.react}/#{options.path}")


        options.rendered = React.renderComponentToString component(options.props)
      else
        options.rendered = ""




      res.render "react-atom", options



}
