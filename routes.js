/*
  routes.js
  This file is an optional place to specify additional routes to be handled by this provider's controller
  Documentation: http://koopjs.github.io/docs/usage/provider
*/
module.exports = [
  {
    path: '/sdmx',
    methods: [ 'get', 'post' ],
    handler: 'getSources'
  },
  {
    path: '/sdmx/:id',
    methods: [ 'get', 'post' ],
    handler: 'getSourceDetail'
  }
];