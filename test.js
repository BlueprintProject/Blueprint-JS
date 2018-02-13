var Blueprint = require('./');

Blueprint.init({
  applicationId: '000000000000000000000002',
});


var Post = new Blueprint.Model('posts', {
  text: {
    type: String,
  },

  title: {
    type: String,
  },

  comments: {
    association: {
      endpoint: 'comments',
      scope: ((object) => {return {
        post_id: object.get('id')
      }}),

      autoload: false,
      multi: true,
    }
  },

  profile: {
    association: {
      endpoint: 'profiles',
      scope: ((object) => {return {
        created_by: object.get('created_by')
      }}),

      autoload: true,
      multi: false,
    }
  }
});

var Message = new Blueprint.Model('messages', {
  text: {
    type: String,
  },

  profile: {
    association: {
      endpoint: 'profiles',
      scope: ((object) => {return {
        created_by: object.get('created_by')
      }}),

      autoload: true,
      multi: false,
    }
  }
});

var cable = Message.watch("591ddd98e043f032087057db");
cable.on("create", function(result) {
  //console.log(result);
  console.log(result.text);
  console.log(result._record.object.content)
});

/*
Post.find({}).then(function(records) {
  var record = records[0];
  record.addSubscriptionKey("23j88923j98j");

  record.set("test", new Date() / 1000);

  setTimeout(function(){
	record.save()
 }, 2000);

  record.flatten('post').then(function(data){
    console.log(data, "!!!");

    console.log(data.post.text);
    console.log(data.profile.get('first_name'));
    console.log(data.comments[0].text);
  });
  record.comments().then(function(comments){
    comments[0].profile().then(function(profile){
      console.log(profile.get('first_name'), 'said', comments[0].get('text'));
    })
  }).catch(function(e) {
    console.log(e);
  });

}).catch(function(e){
  console.log(e);
});
*/
