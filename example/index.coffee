Blueprint = require("../")

Pet = require("./models/pet")
Toy = require("./models/toy")
Owner = require("./models/owner")

Owner.findOne('name': 'Hunter').then (owner) ->
  console.log("HERE")
  owner.findPetWithName('Wiley').then (pet) ->

    toy = new Toy(
      'kind': 'Rope'
      'price': 1.99)

    toy.addReadGroup Blueprint.publicGroup()

    toy.save().then ->
      pet.giveToy toy

      pet.save().then(->
        console.log 'Done'

      ).fail (error) ->
        console.log 'Error:', error

Owner.findOne('name': 'Hunter').then (owner) ->
  console.log owner.get("name"), "<<>><<<<"

Owner.findOne(
  '$sort': {"name": 1},
  'name': {'$ne': null},
  '$limit': 3,
  {"$or": [
    {
      'name': "Hunter",
      'created_at': {
        "$gte": 32,
        "$lte": 3905932503295
      }
    }, {
      'name': {"$ne": "Hunter"},
      'created_at': {
        "$gte": 3200000000000,
        "$lte": null
      },
    }
  ]}
).then (owner) ->
  owner.set("protected.test", "Hello this is a test")
  console.log "__"
  console.log owner.get("protected.test"), "<>"
  console.log owner.object, "<>"
