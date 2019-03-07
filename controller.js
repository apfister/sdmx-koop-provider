/*
  controller.js
  This file is not required unless additional routes specified in routes.js
  If so, corresponding functions must be written to match those routes.
  Documentation: http://koopjs.github.io/docs/usage/provider
*/

function Controller (model) {
  this.model = model
}

Controller.prototype.getProviderDetail = function (req, res) {
  this.model.getProviderDetail(req, (err, resource) => {
    if (err) {
      res.status(500 || err.code).json(err);
    } else {
      res.json(resource);
    }
  });
};

module.exports = Controller;