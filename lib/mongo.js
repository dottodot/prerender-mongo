var MongoClient = require('mongodb').MongoClient;

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/prerender',
  ttl = process.env.PAGE_TTL || 86400;

var database;

MongoClient.connect(mongoUri, function(err, db) {
  db.collection("pages", function(er, collection) {
    collection.dropIndex({ "createdAt" : 1});
    collection.createIndex({
      "createdAt": 1
    }, {
      expireAfterSeconds: ttl
    });
  });

  database = db;
});


module.exports = {
  beforePhantomRequest: function(req, res, next) {
    if (req.method !== 'GET') {
      return next();
    }

    this.cache.get(req.url, function(err, result) {
      if (!err && result) {
        res.send(200, result);
      } else {
        next();
      }
    });
  },

  afterPhantomRequest: function(req, res, next) {
    if (req.prerender.statusCode === 200) {
      database.collection('pages', function(err, collection) {
        var object = {
          key: req.prerender.url,
          value: req.prerender.documentHTML,
          createdAt: new Date()
        };
        collection.update({
          key: req.prerender.url
        }, object, {
          upsert: true
        }, function(err) {
          console.log(err);
        });
      });
    }
    next();
  }
};
