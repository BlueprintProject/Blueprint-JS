if typeof Blueprint == 'undefined'
  Blueprint = require('../src')
current_user = undefined
describe 'Groups', ->
  prefix = Date.now().toString()
  before (done) ->
    # Setup
    Blueprint.Init
      application_id: '5543850719b6366c23000001'
      port: 8080
    # Create a user
    Blueprint.Register(
      email: prefix + '@test.goblueprint.co'
      password: '1234567890a'
      name: prefix + ' Test User').then (error, user) ->
      Blueprint.getCurrentUser().then (error, user) ->
        current_user = user
        done()
        
      
    
  private_group = undefined
  open_group = undefined
  it 'Can Create a group and join it', (done) ->
    private_group = Blueprint.createGroup(name: 'Test Group ' + prefix)
    private_group.addSuperUser current_user
    private_group.save().then (error, group) ->
      if error
        throw new Error('Server ed Error [0]')
      group.addUser current_user
      group.save().then (error, group) ->
        if error
          throw new Error('Server ed Error [0]')
        done()
        
      
    
  it 'Can Leave a group', (done) ->
    private_group.leave().then (error, group) ->
      if error
        throw new Error('Server ed Error [0]')
      done()
      
    
  it 'Can add user to group', (done) ->
    private_group.addUser current_user
    private_group.save().then (error, group) ->
      if error
        throw new Error('Server ed Error [0]')
      done()
      
    
  it 'Can remove user from group', (done) ->
    private_group.removeUser current_user
    private_group.save().then (error, group) ->
      if error
        throw new Error('Server ed Error [0]')
      done()
      
    
  it 'Can Delete a group', (done) ->
    private_group.delete().then (error, group) ->
      if error
        throw new Error('Server ed Error [0]')
      done()
      
    
  it 'Can Create a group with password and join it', (done) ->
    private_group = Blueprint.createGroup(
      name: 'Test Group ' + prefix
      password: 'abcdefg')
    private_group.addSuperUser current_user
    private_group.save().then (error, group) ->
      if error
        throw new Error('Server ed Error [0]')
      group.join(password: 'abcdefg').then (error, group) ->
        if error
          throw new Error('Server ed Error [1]')
        done()
        
      
    
  it 'Can update the name of a group', (done) ->
    private_group.set 'name', 'Test Group'
    private_group.save().then (error, group) ->
      if error
        throw new Error('Server ed Error [0]')
      if group.get('name') != 'Test Group'
        throw new Error('Group name could not be changed')
      done()
      
    
  it 'Can toggle super user membership without saving', (done) ->
    private_group.removeSuperUser current_user
    private_group.addSuperUser current_user
    done()
    
  it 'Can remove self as super user from group', (done) ->
    private_group.removeSuperUser current_user
    private_group.save().then (error, group) ->
      if error
        throw new Error('Server ed Error [0]')
      done()
      
    
  it 'Can create an open group', (done) ->
    open_group = Blueprint.createGroup(
      name: 'Public Group ' + prefix
      open: true)
    open_group.save().then (error, group) ->
      if error
        throw new Error('Server ed Error [0]')
      done()
      
    
  it 'Can join an open group', (done) ->
    open_group.join().then (error, group) ->
      if error
        throw new Error('Server ed Error [0]')
      done()
      
    
  
