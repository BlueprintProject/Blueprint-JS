Blueprint = require("../")

Pet = require("./models/pet")
Toy = require("./models/toy")
Owner = require("./models/owner")

Owner.findOne('name': 'Hunter').then (owner) ->
  
  owner.findPetWithName('Wiley').then (pet) ->

    toy = new Toy(
      'kind': 'Rope'
      'price': 1.99)

    toy.addReadGroup Blueprint.PublicGroup()

    toy.save().then ->
      pet.giveToy toy

      pet.save().then(->
        console.log 'Done'

      ).fail (error) ->
        console.log 'Error:', error

Owner.findOne('name': 'Hunter').then (owner) ->
  console.log owner.get("name")
