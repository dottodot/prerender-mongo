prerender-mongo
=======================

Prerender plugin for MongoDB caching, to be used with the prerender node application from [prerender](https://github.com/prerender/prerender)

This was inspired by [prerender-mongodb-cache](https://github.com/lammertw/prerender-mongodb-cache) but modified to include page expiration

How it works
------------

This plugin will store all prerendered pages into a MongoDB instance. By default it will connect to your MongoDB instance running on localhost and use the `pages` collection in `prerender` database and pages will be cached for 1 day.

How to use
----------

In your local prerender project run:

    $ npm install prerender-mongo --save

Then in the server.js that initializes the prerender:

    server.use(require('prerender-mongo'));

A custom mongo url can be set using env variables ```MONGOLAB_URI``` or ```MONGOHQ_URL```.

To change the page expiration use env variable ```PAGE_TTL```.
