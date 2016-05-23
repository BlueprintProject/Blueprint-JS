
(function() {
  var Blueprint, current_user;

  if (typeof Blueprint === 'undefined') {
    Blueprint = require('../src');
  }

  current_user = void 0;

  describe('Groups', function() {
    var open_group, prefix, private_group;
    prefix = Date.now().toString();
    before(function(done) {
      Blueprint.Init({
        application_id: '5543850719b6366c23000001',
        port: 8080
      });
      return Blueprint.Register({
        email: prefix + '@test.goblueprint.co',
        password: '1234567890a',
        name: prefix + ' Test User'
      }).then(function(error, user) {
        return Blueprint.getCurrentUser().then(function(error, user) {
          current_user = user;
          return done();
        });
      });
    });
    private_group = void 0;
    open_group = void 0;
    it('Can Create a group and join it', function(done) {
      private_group = Blueprint.createGroup({
        name: 'Test Group ' + prefix
      });
      private_group.addSuperUser(current_user);
      return private_group.save().then(function(error, group) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        group.addUser(current_user);
        return group.save().then(function(error, group) {
          if (error) {
            throw new Error('Server ed Error [0]');
          }
          return done();
        });
      });
    });
    it('Can Leave a group', function(done) {
      return private_group.leave().then(function(error, group) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        return done();
      });
    });
    it('Can add user to group', function(done) {
      private_group.addUser(current_user);
      return private_group.save().then(function(error, group) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        return done();
      });
    });
    it('Can remove user from group', function(done) {
      private_group.removeUser(current_user);
      return private_group.save().then(function(error, group) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        return done();
      });
    });
    it('Can Delete a group', function(done) {
      return private_group["delete"]().then(function(error, group) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        return done();
      });
    });
    it('Can Create a group with password and join it', function(done) {
      private_group = Blueprint.createGroup({
        name: 'Test Group ' + prefix,
        password: 'abcdefg'
      });
      private_group.addSuperUser(current_user);
      return private_group.save().then(function(error, group) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        return group.join({
          password: 'abcdefg'
        }).then(function(error, group) {
          if (error) {
            throw new Error('Server ed Error [1]');
          }
          return done();
        });
      });
    });
    it('Can update the name of a group', function(done) {
      private_group.set('name', 'Test Group');
      return private_group.save().then(function(error, group) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        if (group.get('name') !== 'Test Group') {
          throw new Error('Group name could not be changed');
        }
        return done();
      });
    });
    it('Can toggle super user membership without saving', function(done) {
      private_group.removeSuperUser(current_user);
      private_group.addSuperUser(current_user);
      return done();
    });
    it('Can remove self as super user from group', function(done) {
      private_group.removeSuperUser(current_user);
      return private_group.save().then(function(error, group) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        return done();
      });
    });
    it('Can create an open group', function(done) {
      open_group = Blueprint.createGroup({
        name: 'Public Group ' + prefix,
        open: true
      });
      return open_group.save().then(function(error, group) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        return done();
      });
    });
    return it('Can join an open group', function(done) {
      return open_group.join().then(function(error, group) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        return done();
      });
    });
  });

}).call(this);
