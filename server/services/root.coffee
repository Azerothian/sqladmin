module.exports = (app, logic) ->
  return {
    get:
      "/": (req, res, next) ->
        if !req.session.knexOptions?
          res.redirect "/login"
        else
          logic.react.renderDynamic "admin", {}, req, res, next

      "/login": (req, res, next) ->
        logic.react.renderDynamic "login", {}, req, res, next
      "/logout": (req, res, next) ->
        req.session.destroy (err) ->
          res.redirect "/"

      "/api/database": (req, res, next) ->

    post:
      "/login": (req, res, next) ->
        req.session.knexOptions = {
          client: req.body.databasetype
          connection:
            host: req.body.host
            user: req.body.username
            password: req.body.password
            port: req.body.port
        }
        req.session.save()
        res.json { success: true }

  }
