import utils from '../../utils';
import Record from '../records/record';

class Model extends Record {
  static endpoint = '';

  constructor(baseData, preNested) {
    if (preNested) {
      super(null, baseData, true);
    } else {
      super(null, {});

      if (baseData) {
        this.update(baseData);
      }
    }
    this.endpoint = this.constructor.endpoint;

    console.log(this, "<<!!!");
  };

  static find(where) {
    var promise = new utils.promise();

    require('../records/find').Find(this.endpoint, where).then(function(results) {
      results = results.map((result) => {
        console.log(this, "<!!!");
        return new this.constructor(result);
      });

      return promise.send(void 0, results);
    }).fail(function(error) {
      return promise.send(error);
    });
    return promise;
  };

  static findOne(where) {
    var promise = new utils.promise();

    require('../records/find').FindOne(this.endpoint, where).then(function(result) {
      result = new this.constructor(result);
      console.log(this, "<!!!");

      return promise.send(void 0, result);
    }).fail(function(error) {
      return promise.send(error);
    });
    return promise;
  };

  update(data) {
    var results1 = [];

    for (var key in data) {
      var value = data[key];
      results1.push(obj.set(key, value));
    }
    return results1;
  };

}

module.exports = Model;
