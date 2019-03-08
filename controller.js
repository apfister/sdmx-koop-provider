/*
  controller.js
  This file is not required unless additional routes specified in routes.js
  If so, corresponding functions must be written to match those routes.
  Documentation: http://koopjs.github.io/docs/usage/provider
*/

function Controller (model) {
  this.model = model
}

Controller.prototype.getSources = function (req, res) {
  this.model.getSources(req, (err, resource) => {
    if (err) {
      res.status(500 || err.code).json(err);
    } else {
      res.json(resource);
    }
  });
};

Controller.prototype.getSourceDetail = function (req, res) {
  this.model.getSourceDetail(req, (err, resource) => {
    if (err) {
      res.status(500 || err.code).json(err);
    } else {
      res.json(resource);
    }
  });
};

module.exports = Controller;