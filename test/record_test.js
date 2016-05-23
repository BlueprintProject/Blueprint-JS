'use strict';

if (typeof Blueprint === 'undefined') {
  global.Blueprint = require('../src');
}

var prefix = Date.now().toString();
var userB = void 0;
var record = void 0;

var handleError = function(error) {
  throw Error(JSON.stringify(error));
};

describe('Records', function() {
  before(function(done) {
    Blueprint.Init({
      applicationId: '000000000000000000000001',
      port: 8080
    });

    Blueprint.Register({
      email: prefix + '_b@test.goblueprint.co',
      password: '1234567890a',
      name: prefix + ' Test User B'
    }).then(function(user) {
      userB = user;

      Blueprint.Register({
        email: prefix + '@test.goblueprint.co',
        password: '1234567890a',
        name: prefix + ' Test User'
      }).then(function() {
        done();
      });

    });
  });



  it('Can Create Record', function(done) {
    var record;
    record = new Blueprint.Data.Record('toys', {
      'timestamp': prefix,
      'nested_content': {
        'boolean': true
      },
      'kind': 'Rope',
      'price': 1.99
    });

    record.addReadGroup(Blueprint.PublicGroup());
    record.addWriteGroup(Blueprint.PrivateGroup());
    record.addDestroyGroup(Blueprint.PrivateGroup());

    record.save().then(function(record) {
      if (!record.get('id')) {
        throw new Error('Record does not have an id');
      }
      if (record.get('nested_content').boolean !== true) {
        throw new Error('Nested object is not properly formatted');
      }
      done();
    }).fail(handleError);
  });

  it('Can Query Records', function(done) {
    Blueprint.Data.Find('toys', {
      'kind': 'Rope'
    }).then(function(records) {
      var record;
      var index;

      if (records.length === 0) {
        throw new Error('Query ed empty array');
      }
      for (index in records) {
        record = records[index];
        if (!record.get('id')) {
          throw new Error('ed object do not have an id');
        }
      }
      done();
    }).fail(handleError);
  });

  it('Can Query Record and Update it', function(done) {
    Blueprint.Data.FindOne('toys', {
      'timestamp': prefix
    }).then(function(r) {
      record = r;
      record.set('comment', 'This is a test ' + prefix);
      record.save().then(function(record) {
        if (record.get('comment') !== 'This is a test ' + prefix) {
          throw new Error('ed object did not have the correct title');
        }
        done();
      }).fail(handleError);
    }).fail(handleError);
  });

  it('Can add user to record permissions', function(done) {
    record.addReadGroup(userB);
    record.addWriteGroup(userB);
    record.addDestroyGroup(userB);
    record.save().then(function() {
      done();
    }).fail(handleError);
  });

  it('Can remove user from record permissions', function(done) {
    record.removeReadGroup(userB);
    record.removeWriteGroup(userB);
    record.removeDestroyGroup(userB);
    record.save().then(function() {
      done();
    }).fail(handleError);
  });

  it('Can toggle user permissions without saving', function(done) {
    record.addReadGroup(userB);
    record.addWriteGroup(userB);
    record.addDestroyGroup(userB);
    record.removeReadGroup(userB);
    record.removeWriteGroup(userB);
    record.removeDestroyGroup(userB);
    done();
  });

  it('Can Query Record and Destroy it', function(done) {
    Blueprint.Data.FindOne('toys', {
      'timestamp': prefix
    }).then(function(record) {
      record.set('title', 'This is a test ' + prefix);
      record.destroy().then(function() {
        done();
      }).fail(handleError);
    }).fail(handleError);
  });

});
