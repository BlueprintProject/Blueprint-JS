
(function() {
  var Blueprint;

  if (typeof Blueprint === 'undefined') {
    Blueprint = require('../src');
  }

  describe('Files', function() {
    var file, prefix, record, user_b;
    prefix = Date.now().toString();
    user_b = void 0;
    record = void 0;
    file = void 0;
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
          return record.save().then(function() {
            return done();
          });
        });
      });
    });
    it('Can Create File', function(done) {
      file = record.createFile({
        size: 2352,
        name: 'testing.txt'
      });
      return file.save().then(function(error, file) {
        if (error) {
          throw new Error('Server ed error');
        }
        return done();
      });
    });
    it('Can Get File URL', function(done) {
      var url;
      url = file.getURL();
      if (url) {
        return done();
      }
    });
    return it('Can Delete File', function(done) {
      return file["delete"]().then(function(error, file) {
        if (error) {
          throw new Error('Server ed error');
        }
        return done();
      });
    });
  });

}).call(this);
