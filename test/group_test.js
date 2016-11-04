'use strict';

if (typeof Blueprint === 'undefined') {
  global.Blueprint = require('../src');
}

var currentUser = void 0;

var handleError = function(error) {
  throw Error(JSON.stringify(error));
};

describe('Groups', function() {
  var prefix = Date.now().toString();
  before(function(done) {
    Blueprint.init({
      applicationId: '000000000000000000000001',
      port: 8080
    });
    Blueprint.register({
      email: prefix + '@test.goblueprint.co',
      password: '1234567890a',
      name: prefix + ' Test User'
    }).then(function() {
      Blueprint.getCurrentUser().then(function(user) {
        currentUser = user;
        done();
      }).fail(handleError);
    }).fail(handleError);
  });

  var privateGroup = void 0;
  var openGroup = void 0;

  it('Can Create a group and join it', function(done) {
    privateGroup = new Blueprint.Group({
      name: 'Test Group ' + prefix
    });
    privateGroup.addSuperUser(currentUser);
    privateGroup.save().then(function(group) {
      group.addUser(currentUser);
      group.save().then(function() {
        done();
      }).fail(handleError);
    });
  });

  it('Can Leave a group', function(done) {
    privateGroup.leave().then(function() {
      done();
    }).fail(handleError);
  });

  it('Can add user to group', function(done) {
    privateGroup.addUser(currentUser);
    privateGroup.save().then(function() {
      done();
    }).fail(handleError);
  });

  it('Can remove user from group', function(done) {
    privateGroup.removeUser(currentUser);
    privateGroup.save().then(function() {
      done();
    }).fail(handleError);
  });

  it('Can Delete a group', function(done) {
    privateGroup.destroy().then(function() {
      done();
    }).fail(handleError);
  });

  it('Can Create a group with password and join it', function(done) {
    privateGroup = new Blueprint.Group({
      name: 'Test Group ' + prefix,
      password: 'abcdefg'
    });
    privateGroup.addSuperUser(currentUser);
    privateGroup.save().then(function(group) {
      group.join({
        password: 'abcdefg'
      }).then(function() {
        done();
      }).fail(handleError);
    }).fail(handleError);
  });

  it('Can update the name of a group', function(done) {
    privateGroup.set('name', 'Test Group');
    privateGroup.save().then(function(group) {
      if (group.get('name') !== 'Test Group') {
        throw new Error('Group name could not be changed');
      }
      done();
    }).fail(handleError);
  });

  it('Can toggle super user membership without saving', function(done) {
    privateGroup.removeSuperUser(currentUser);
    privateGroup.addSuperUser(currentUser);
    done();
  });

  it('Can remove self as super user from group', function(done) {
    privateGroup.removeSuperUser(currentUser);
    privateGroup.save().then(function() {
      done();
    }).fail(handleError);
  });

  it('Can create an open group', function(done) {
    openGroup = new Blueprint.Group({
      name: 'Public Group ' + prefix,
      open: true
    });

    openGroup.save().then(function() {
      done();
    }).fail(handleError);

  });

  it('Can join an open group', function(done) {
    openGroup.join().then(function() {
      done();
    }).fail(handleError);
  });
});
