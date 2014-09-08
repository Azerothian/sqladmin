
module.exports = (grunt) ->
  copyTargets = [
    { expand: true, cwd: './bootstrap/dist/', src: ['**'], dest: 'server/public/lib/bootstrap/' }
    { expand: true, cwd: './node_modules/react/dist/', src: ['**'], dest: 'server/public/lib/react/' }
    { expand: true, cwd: './node_modules/jquery/dist/', src: ['**'], dest: 'server/public/lib/jquery/' }
  ]

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    copy:
      build:
        files: copyTargets
    notify:
      complete:
        options:
          title: 'Project Compiled',  # optional
          message: 'Project has been compiled', #required
    simplemocha:
      options:
        globals: ['expect']
        timeout: 3000
        ignoreLeaks: false
        ui: 'bdd'
        reporter: 'tap'
      all:
        src: ['build/tests/**/*.js']

  grunt.loadNpmTasks 'grunt-nsp-package'
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-notify'
  grunt.loadNpmTasks 'grunt-simple-mocha'


  grunt.registerTask 'test', '', [ 'build', 'simplemocha' ]
  grunt.registerTask 'default', 'Compiles all of the assets and copies the files to the build directory.', ['validate-package','build' ]
  grunt.registerTask 'build', 'Builds the application', [ 'copy', 'broify', 'notify:complete' ]
  grunt.registerTask 'broify', 'Broifies it up', () ->
    done = this.async()
    require("./broify").then () ->
      done()
