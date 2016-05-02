module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        compress: {
          dead_code: true,
          // discard unreachable code
          drop_debugger: true,
          // discard “debugger” statements
          global_defs: {
            // global definitions
            'DEBUG': false
          }
        }
      },
      build: {
        src: 'build/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    browserify: {
      js: {
        src: 'src/index.js',
        dest: 'build/<%= pkg.name %>.js'
      },
      options: {
        plugin: ['bundle-collapser/plugin'],
        exclude: ['src/utils/node_request.js']
      }
    },
    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          //captureFile: 'results.txt', // Optionally capture the reporter output to a file
          quiet: false,
          // Optionally suppress output to standard out (defaults to false)
          clearRequireCache: false  // Optionally clear the require cache before running tests (defaults to false)
        },
        src: ['test/**/*.js']
      }
    },
    connect: {
      server: {
        options: {
          port: 8888,
          base: '.'
        }
      }
    },
    mocha: {
      test: {
        options: {
          urls: ['http://localhost:8888/test/index.html'],
          run: true,
          slow: 200
        }
      }
    }
  });
  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-mocha-test');
  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-connect');
  // Default task(s).
  grunt.registerTask('default', [
    'browserify',
    'uglify'
  ]);
  grunt.registerTask('test', [
    'mochaTest',
    'browserify',
    'connect',
    'mocha'
  ]);
};