var MongoClient = require('mongodb').MongoClient;

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost:27017',
  ttl = parseInt(process.env.PAGE_TTL,10) || 86400;

var database;

MongoClient.connect(mongoUri, function(err, client) {
  const db = client.db('prerender');
  db.collection("pages", function(er, collection) {
    collection.dropIndex({
      "createdAt": 1
    });
    collection.createIndex({
      "createdAt": 1
    }, {
      expireAfterSeconds: ttl
    });
    collection.createIndex({
      "key": 1
    })
  });

  database = db;
});


module.exports = {

  requestReceived: function(req, res, next) {
    if (req.method !== 'GET') {
      return next();
    }

    database.collection('pages', function(err, collection) {
      collection.findOne({
        key: req.prerender.url
      }, function(err, item) {
        if (!err && item) {
          var value = item ? item.value : null;
          res.send(200, value);
        } else {
          next();
        }
      });
    });
  },

  pageLoaded: function(req, res, next) {
    if (req.prerender.statusCode === 200) {
      database.collection('pages', function(err, collection) {
        var object = {
          key: req.prerender.url,
          value: req.prerender.content,
          createdAt: new Date()
        };
        collection.update({
          key: req.prerender.url
        }, object, {
          upsert: true
        });
      });
    }
    next();
  }
};
