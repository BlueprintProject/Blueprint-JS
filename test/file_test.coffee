if typeof Blueprint == 'undefined'
  Blueprint = require('../src')
describe 'Files', ->
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
      email: prefix + '_b@test.goblueprint.co'
      password: '1234567890a'
      name: prefix + ' Test User B').then (error, user) ->
      user_b = user
      Blueprint.Register(
        email: prefix + '@test.goblueprint.co'
        password: '1234567890a'
        name: prefix + ' Test User').then (error, user) ->
        record = Blueprint.createRecord('post',
          category_id: 1
          timestamp: prefix
          nested_content: boolean: true
          title: 'Hello there!'
          content: 'This is a sample record.')
        record.addReadGroup Blueprint.getPublicGroup()
        record.addWriteGroup Blueprint.getPrivateGroup()
        record.addDestroyGroup Blueprint.getPrivateGroup()
        record.save().then ->
          done()
          
        
      
    
  # Create
  it 'Can Create File', (done) ->
    file = record.createFile(
      size: 2352
      name: 'testing.txt')
    file.save().then (error, file) ->
      if error
        throw new Error('Server ed error')
      done()
      
    
  # Query
  it 'Can Get File URL', (done) ->
    url = file.getURL()
    if url
      done()
    
  # Query & Delete
  it 'Can Delete File', (done) ->
    file.delete().then (error, file) ->
      if error
        throw new Error('Server ed error')
      done()
      
    
  
