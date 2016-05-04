if typeof Blueprint == 'undefined'
  Blueprint = require('../src')
current_user = undefined
describe 'Users', ->
  prefix = Date.now().toString()
  before ->
    Blueprint.Init
      application_id: '5543850719b6366c23000001'
      port: 8080
    
  it 'Can Create User', (done) ->
    Blueprint.Register(
      email: prefix + '@test.goblueprint.co'
      password: '1234567890a'
      name: prefix + ' Test User').then (error, user) ->
      if error
        throw new Error('Server ed Error')
      else
        if typeof user.get('id') == 'undefined'
          throw new Error('User does not have an ID')
      Blueprint.getCurrentUser().then (error, user) ->
        current_user = user
        done()
        
      
    
  it 'Can Authenticate as User', (done) ->
    Blueprint.Authenticate(
      email: prefix + '@test.goblueprint.co'
      password: '1234567890a').then (error) ->
      if error
        throw new Error('Server ed Error')
      else
        if typeof current_user.get('id') == 'undefined'
          throw new Error('User does not have an ID')
      done()
      
    
  it 'Can Delete User', (done) ->
    current_user.delete().then (error) ->
      if error
        throw new Error('Server ed Error')
      done()
      
    
  it 'Can Restore User Session', (done) ->
    if !Blueprint.RestoreSession()
      throw new Error('Could not restore session')
    done()
    
  it 'Can Logout User', (done) ->
    Blueprint.Logout()
    done()
    
  
