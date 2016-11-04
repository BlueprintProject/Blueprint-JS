
Blueprint = require("../")

Pet = require("./models/pet")
Toy = require("./models/toy")
Owner = require("./models/owner")

Owner.FindOne('name': 'Hunter').then (owner) ->

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

Owner.FindOne('name': 'Hunter').then (owner) ->
  owner.set("protected.test", "Hello this is a test")

  console.log owner.get("protected.test")
  console.log owner._object
