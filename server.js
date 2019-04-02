if (process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// clean shutdown on `cntrl + c`
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

// Initialize Koop
const Koop = require('koop');
const koop = new Koop();
const redisCache = require('@koopjs/cache-redis');

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisAuth = process.env.REDIS_AUTH;

const redisOptions = {
  host: {
    host: redisHost,
    port: redisPort,
    auth_pass: redisAuth,
    tls: { servername: redisHost }
  }
};

koop.register(redisCache, redisOptions);

// Install the Sample Provider
const provider = require('./');
koop.register(provider);

if (process.env.DEPLOY === 'export') {
  module.exports = koop.server;
} else {
  // Start listening for HTTP traffic
  const config = require('config');

  // Set port for configuration or fall back to default
  const port = process.env.PORT || config.port || 8080;
  koop.server.listen(port);

  const message = `

  Koop Sample Provider listening on ${port}
  For more docs visit: https://koopjs.github.io/docs/usage/provider
  To find providers visit: https://www.npmjs.com/search?q=koop+provider

  Try it out in your browser: http://localhost:${port}/sample/FeatureServer/0/query
  Or on the command line: curl --silent http://localhost:${port}/sample/FeatureServer/0/query?returnCountOnly=true

  Press control + c to exit
  `;

  console.log(message);
}
