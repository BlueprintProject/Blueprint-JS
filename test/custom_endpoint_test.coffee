if typeof Blueprint == 'undefined'
  Blueprint = require('../src')
describe 'Custom Endpoint', ->
  prefix = Date.now().toString()
  user_b = undefined
  record = undefined
  file = undefined
  before (done) ->
    # Setup
    Blueprint.Init
      application_id: '5543850719b6366c23000001'
      port: 8080
    # Create a user
    Blueprint.Register(
      email: prefix + '_c@test.goblueprint.co'
      password: '1234567890a'
      name: prefix + ' Test User C').then (error, user) ->
      done()
      
    
  # Create
  it 'Can Run Custom Endpoint', (done) ->
    Blueprint.performEndpoint('example', testing: true).then (error, response) ->
      if !error
        done()
      
    
  
