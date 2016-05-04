
(function() {
  var Blueprint;

  if (typeof Blueprint === 'undefined') {
    Blueprint = require('../src');
  }

  describe('Records', function() {
    var prefix, record, user_b;
    prefix = Date.now().toString();
    user_b = void 0;
    record = void 0;
    before(function(done) {
      Blueprint.Init({
        application_id: '5543850719b6366c23000001',
        port: 8080
      });
      return Blueprint.Register({
        email: prefix + '_b@test.goblueprint.co',
        password: '1234567890a',
        name: prefix + ' Test User B'
      }).then(function(error, user) {
        user_b = user;
        return Blueprint.Register({
          email: prefix + '@test.goblueprint.co',
          password: '1234567890a',
          name: prefix + ' Test User'
        }).then(function(error, user) {
          return done();
        });
      });
    });
    it('Can Create Record', function(done) {
      var record;
      record = Blueprint.createRecord('post', {
        category_id: 1,
        timestamp: prefix,
        nested_content: {
          boolean: true
        },
        title: 'Hello there!',
        content: 'This is a sample record.'
      });
      record.addReadGroup(Blueprint.PublicGroup());
      record.addWriteGroup(Blueprint.getPrivateGroup());
      record.addDestroyGroup(Blueprint.getPrivateGroup());
      return record.save().then(function(error, record) {
        if (error) {
          throw new Error('Server ed error');
        }
        if (!record.get('id')) {
          throw new Error('Record does not have an id');
        }
        if (record.get('nested_content')['boolean'] !== true) {
          throw new Error('Nested object is not properly formatted');
        }
        return done();
      });
    });
    it('Can Query Records', function(done) {
      return Blueprint.findRecords('post', {
        category_id: 1
      }).then(function(error, records) {
        var record;
        var index;
        if (error) {
          throw new Error('Server ed error');
        }
        if (records.length === 0) {
          throw new Error('Query ed empty array');
        }
        for (index in records) {
          record = records[index];
          if (!record.get('id')) {
            throw new Error('ed object do not have an id');
          }
        }
        return done();
      });
    });
    it('Can Query Record and Update it', function(done) {
      return Blueprint.findRecord('post', {
        timestamp: prefix
      }).then(function(error, r) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        record = r;
        record.set('title', 'This is a test ' + prefix);
        return record.save().then(function(error, record) {
          if (error) {
            throw new Error('Server ed Error [1]');
          }
          if (record.get('title') !== 'This is a test ' + prefix) {
            throw new Error('ed object did not have the correct title');
          }
          return done();
        });
      });
    });
    it('Can add user to record permissions', function(done) {
      record.addReadGroup(user_b);
      record.addWriteGroup(user_b);
      record.addDestroyGroup(user_b);
      return record.save().then(function(error, record) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        return done();
      });
    });
    it('Can remove user from record permissions', function(done) {
      record.removeReadGroup(user_b);
      record.removeWriteGroup(user_b);
      record.removeDestroyGroup(user_b);
      return record.save().then(function(error, record) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        return done();
      });
    });
    it('Can toggle user permissions without saving', function(done) {
      record.addReadGroup(user_b);
      record.addWriteGroup(user_b);
      record.addDestroyGroup(user_b);
      record.removeReadGroup(user_b);
      record.removeWriteGroup(user_b);
      record.removeDestroyGroup(user_b);
      return done();
    });
    return it('Can Query Record and Delete it', function(done) {
      return Blueprint.findRecord('post', {
        timestamp: prefix
      }).then(function(error, record) {
        if (error) {
          throw new Error('Server ed Error [0]');
        }
        record.set('title', 'This is a test ' + prefix);
        return record["delete"]().then(function(error, record) {
          if (error) {
            throw new Error('Server ed Error [1]');
          }
          return done();
        });
      });
    });
  });

}).call(this);
