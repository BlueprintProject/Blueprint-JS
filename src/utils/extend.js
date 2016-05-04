
(function() {
  module.exports = function(target) {
    var sources;
    sources = [].slice.call(arguments, 1);
    sources.forEach(function(source) {
      var prop, results;
      results = [];
      for (prop in source) {
        results.push(target[prop] = source[prop]);
      }
      return results;
    });
    return target;
  };

}).call(this);
