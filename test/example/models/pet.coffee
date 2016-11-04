Blueprint = require('../../')

module.exports = new Blueprint.Model 'pets', ->

  @giveToy = (toy) ->
    toys = @get('toy_ids')

    toys = [] if !toys

    toys.push toy.get('id')
