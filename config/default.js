const fs = require('fs');
const defer = require('config/defer').deferConfig;

let env = 'unicef';
const inEnv = process.env.NODE_ENV;
// console.log('inEnv', inEnv);
if (inEnv) {
  env = process.env.NODE_ENV;
}
// console.log('inEnv', inEnv);

const filePath = __dirname + '/dynamicConfig.json';

const file = fs.readFileSync(filePath);

const config = JSON.parse(file);

module.exports =  config[env];