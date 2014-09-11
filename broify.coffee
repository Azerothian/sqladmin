

debug = require("debug")("broify")

Promise = require "native-or-bluebird"
browserify = require "browserify"
bgshim = require 'browserify-global-shim'
fs = require "fs"
mkdirp = require "mkdirp"
path = require "path"
glob = require "glob"
slash = require "slash"
coffeeify = require "coffeeify"

appName = "app"


srcDir = "./client/react/"
targetDir = "./server/public/react/"
filesGlob = "#{srcDir}**/*.*"


stripExtension = (file) ->
  dirName = path.dirname file
  baseName = path.basename file, path.extname(file)
  return path.join dirName, baseName


createFile = (file) ->
  return new Promise (resolve, reject) ->
    extless = stripExtension(file)

    rel = path.relative srcDir, extless

    target = "#{slash(path.join(targetDir, rel))}.js"

    dirTarget = path.dirname target
    opts = {
      basedir: srcDir
      extensions: [".js", ".coffee", ".json"]
      #debug: true
      externalRequireName: "breq"
    }

    b = browserify(opts)

    b.transform coffeeify, { global: true }

    ## Exclude React
    globalShim = {
      react: 'React || React'
      jquery: '$ || jQuery'
      "react-atom-fork": 'React || React'
    }

    globalShim = bgshim.configure globalShim

    b.transform globalShim, { global: true }

    b.external "react"
    b.external "jquery"


    file = slash("./#{path.relative(srcDir, extless)}")
    debug "file", file
    ## include file
    b.require(file, { expose: appName })

    stream = b.bundle()

    ## write file
    debug "begin bundle"
    mkdirp dirTarget, () ->
      write = fs.createWriteStream(target)
      write.on "close", () ->
        debug "fin", file
        resolve()
      stream.pipe(write)



promises = []

files = glob.sync filesGlob
for file in files
  #mixins dont need browserified nor libs
  #if file.indexOf("mixin") < 0 && file.indexOf("lib") < 0
  promises.push createFile(file)

if require.main is module
  Promise.all(promises).then () ->
    debug "complete"
else
  module.exports = Promise.all(promises)
