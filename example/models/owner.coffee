Blueprint = require('../../')

module.exports = new Blueprint.Model 'owners', ->

  @findPetWithName = (name) ->
    require('./pet').findOne 'name': name
