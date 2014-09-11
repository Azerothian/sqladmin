module.exports = {
  extend: (object, properties) ->
    for key, val of properties
      object[key] = val
    object
  Promise: require "native-or-bluebird"
  React: require "react"
}
