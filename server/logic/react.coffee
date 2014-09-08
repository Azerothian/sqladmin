module.exports = {
  renderDynamic: (path, props, req, res, next) ->
    props._csrf = res.locals._csrf
    res.render "react-dynamic", {
      path: path
      config: require("../config")
      props: props
    }


}
