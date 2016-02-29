var MongoClient = require('mongodb').MongoClient;

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/prerender',
  ttl = process.env.PAGE_TTL || 86400;

var database;

MongoClient.connect(mongoUri, function(err, db) {
  db.collection("pages", function(er, collection) {
    collection.dropIndex({
      "createdAt": 1
    });
    collection.createIndex({
      "createdAt": 1
    }, {
      expireAfterSeconds: ttl
    });
  });

  database = db;
});


module.exports = {

  beforePhantomRequest: function(req, done) {
    console.log('prerender-mongo: beforePhantomRequest for ' + req.url);
    if (req.method !== 'GET') {
      return done();
    }

    database.collection('pages', function(err, collection) {
      collection.findOne({
        key: req.url
      }, function(err, item) {
        if (!err && item) {
          var value = item ? item.value : null;
          console.log('prerender-mongo: found item in cache');
          return done(err, value);
        }

        return done(err);
      });
    });
  },

  afterPhantomRequest: function(err, req, prerender_res) {
    console.log('prerender-mongo: afterPhantomRequest for ' + req.url);

    if (prerender_res.statusCode === 200) {
      console.log('prerender-mongo: adding prerender result to cache');
      database.collection('pages', function(err, collection) {
        var object = {
          key: req.url,
          value: prerender_res.body,
          createdAt: new Date()
        };
        collection.update({
          key: req.url
        }, object, {
          upsert: true
        }, function(err) {
          if (err) {
            console.warn(err);
          }
        });
      });
    }
  }
};
