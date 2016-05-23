// jshint ignore: start
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        compress: {
          dead_code: true,
          drop_debugger: true,
          global_defs: {
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
        transform: ['coffeeify'],
        plugin: ['bundle-collapser/plugin'],
        exclude: ['src/utils/node_request.js']
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          quiet: false,
          clearRequireCache: false
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
    },
    jsdoc: {
      dist: {
        src: ['src/**/*.js', 'test/*.js'],
        options: {
          destination: 'doc'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-jsdoc')

  grunt.registerTask('default', ['browserify', 'uglify']);
  grunt.registerTask('doc', ['jsdoc'])
  return grunt.registerTask('test', ['mochaTest', 'browserify', 'connect', 'mocha']);
};
