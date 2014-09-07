browserify = require "browserify"
coffeeify = require "coffeeify"
fs = require "fs"
opts = {
  basedir: "./react/"
  extensions: [".js", ".coffee", ".json"]
}
b = browserify(opts)
b.transform coffeeify, { global: true }
b.add "./index.coffee"
stream = b.bundle()
write = fs.createWriteStream("./public/app.js")
stream.pipe(write)
