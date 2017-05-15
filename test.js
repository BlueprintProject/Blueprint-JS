import Blueprint from './src';

const Model = new Blueprint.Model('profiles', {
  first_name: {
    default: 'First Name',
    type: String,
  },

  last_name: {
    default: 'Last Name',
    type: String
  },

  test_field: {
    type: Boolean,
    protected: true,
  },

  another_test: Number
});

class Profile extends Model {

  static async getCurrentUserProfile() {
    var user = await Blueprint.getCurrentUser();
    try {
      var profiles = await Profile.find({
        id: user.get('id')
      });

      if(profiles.length === 0) {
        return new Profile();
      } else {
        return profiles[0];
      }
    } catch(e) {
      throw e;
    }
  }

  name() {
    return 'Jer A';
  }

}

export default Profile;

var profile = new Profile();
profile.first_name = 'This is a test';

console.log(profile);

console.log("___________")

profile.sync();
console.log(profile._record.object);

Profile.findOne({test: true}).then(function(a) {
  console.log(a, a._record.object);
})
