Promise = require "native-or-bluebird"
debug = require("debug")("sqladmin:router")
slash = require "slash"
path = require "path"

expressRequestParams = ["get", "post", "put", "delete"]

isFunction = (functionToCheck) ->
  return functionToCheck && ({}).toString.call(functionToCheck) is '[object Function]'


module.exports = (expressApp, obj) ->
  return new Promise (resolve, reject) ->
    baseUri = "/"
    if obj.prefix?
      debug "baseUri", baseUri, obj.prefix
      baseUri = path.join baseUri, obj.prefix


    for i in expressRequestParams
      if obj[i]?
        for p, func of obj[i]
          uri = slash path.join(baseUri, p)
          debug "enabling path", uri

          params = [uri]
          if obj.before?
            if isFunction(obj.before)
              params.push obj.before(i, p)
            else
              if obj.before[i]?
                if obj.before[i][p]?
                  params.push obj.before[i][p]

          params.push func

          expressApp[i].apply expressApp, params

    resolve()
