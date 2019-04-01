/*
  model.js

  This file is required. It must export a class with at least one public function called `getData`

  Documentation: http://koopjs.github.io/docs/usage/provider
*/
const config = require('config');
const request = require('request').defaults({
  gzip: true,
  json: true
});
const _ = require('underscore');
const moment = require('moment');
const format = require('string-format');
format.extend(String.prototype, {});

const countryGeom = require('./config/country-geometry.json');

function Model(koop) {}

// Model.prototype.createKey = function(req) {
//   console.log('creating new key');
//   return 'newKey1';
// };

Model.prototype.getSources = function(req, callback) {
  Object.keys(config).forEach(key => {
    config[key]['sourceDetailUrl'] = `${req.protocol}://${req.get('host')}/sdmx/${key}`;
  });
  return callback(null, config);
};

Model.prototype.getSourceDetail = function(req, callback) {
  if (!config[req.params.id]) {
    const message = `source '${req.params.id}' not found. please use a key from the available list: ${Object.keys(
      config
    )}`;
    return callback({ message: message });
  }

  const provider = config[req.params.id];

  const sdmxReference = provider.referenceConfig;
  let params = {
    url: sdmxReference.url,
    headers: Object.assign(sdmxReference.headers, { origin: req.hostname, referer: req.hostname })
  };

  if (sdmxReference.encoding) {
    params['encoding'] = sdmxReference.encoding;
  }

  request(params, (err, res, body) => {
    if (err) return callback(err);

    const dimensions = body.data.dataStructures[0].dataStructureComponents.dimensionList.dimensions;
    const sdmxQueryKeyFormat = dimensions.map(dim => dim.id).join('.');
    const featureServiceUrl = `${req.protocol}://${req.get('host')}/sdmx/${
      req.params.id
    }/{sdmxQueryKey}/FeatureServer/0`;

    const keysWithPossibleValues = dimensions.map(dim => {
      const lookupObj = _.findWhere(body.data.codelists, { urn: dim.localRepresentation.enumeration });
      if (lookupObj && lookupObj.codes) {
        const possibleValues = lookupObj.codes.map(code => {
          let obj = {
            id: code.id,
            name: code.name.en
          };
          if (code.description) {
            obj.description = code.description.en;
          }
          return obj;
        });
        return {
          id: dim.id,
          possibleValues: possibleValues
        };
      } else {
        console.log(`no codes for ${dim.id}`);
      }
    });

    const exampleValues = [];
    keysWithPossibleValues.forEach(kpv => {
      exampleValues.push(kpv.possibleValues[0].id);
    });

    const sdmxQueryKey = exampleValues.join('.');
    const exampleFeatureServiceUrl = featureServiceUrl.format({ sdmxQueryKey });

    const out = {
      meta: {
        help:
          'To construct the `sdmxQueryKey` variable, you can use the `sdmxQueryKeyFormat` and replace values between the dots (.) with a value from the `possibleValues` array in the `keysWithPossibleValues` array.',
        exampleFeatureServiceUrl: exampleFeatureServiceUrl,
        exampleFeatureServiceQueryUrl: `${exampleFeatureServiceUrl}/query?where=1=1`,
        sdmxStructureUrl: provider.referenceConfig.url
      },
      data: {
        providerName: provider.name,
        featureServiceUrl: featureServiceUrl,
        featureServiceQueryUrl: `${featureServiceUrl}/query?where=1=1`,
        sdmxQueryKeyFormat: sdmxQueryKeyFormat,
        totalNumberOfKeys: dimensions.length,
        keysWithPossibleValues: keysWithPossibleValues
      }
    };
    callback(null, out);
  });
};

Model.prototype.getData = function(req, callback) {
  console.log('GET DATA FIRED');
  if (!req.params && !req.params.host) {
    const message = `no 'source' specified. the correct format should be ${req.protocol}://${req.get(
      'host'
    )}/sdmx/{source}/{sdmxQueryKey}/FeatureServer/0`;
    return callback({ message: message });
  }

  // console.log('CONFIG', config);
  if (!config[req.params.host]) {
    const message = `source '${req.params.host}' not found. please use a key from the available list: ${Object.keys(
      config
    )}`;
    return callback({ message: message });
  }

  if (!req.params.id) {
    const message = `no 'sdmxKeyQuery' specified. `;
    return callback({ message: message });
  }

  // setup new feature collection to send back
  let fc = {
    type: 'FeatureCollection',
    features: []
  };

  fc.metadata = {
    name: 'from sdmx',
    idField: 'counterField',
    fields: [
      {
        name: 'counterField',
        alias: 'counterField',
        type: 'Integer'
      }
    ]
  };

  // parse the incoming info to setup the proper SDMX query URL
  const source = req.params.host;
  const provider = config[source];

  const queryKey = req.params.id;

  const params = {
    url: provider.dataConfig.url,
    headers: provider.dataConfig.headers
  };

  params.url = params.url.format({ queryKey });

  // request the data from the SDMX API
  request(
    params,
    (err, res, body) => {
      if (err) return callback(err);
      const statusCode = res.statusCode;
      if (statusCode === 403) {
        return callback({
          message: `unable to query. make sure that \'${queryKey}\' is a valid SDMX query key. -- API Response -- ${
            res.body
          }`
        });
      } else if (statusCode === 500) {
        return callback({
          message: `error from API with sdmx query key: \'${queryKey}\' -- API Response -- ${res.body}`
        });
      }

      let features = [];
      let fields = [];
      let layerName = '';
      if (res.statusCode !== 404) {
        const dimensionProps = body.data.structure.dimensions.observation;
        const attributeProps = body.data.structure.attributes.observation;
        fields = parseFieldsAndLookups(dimensionProps, attributeProps);
        fields.push({
          name: 'OBS_VALUE',
          alias: 'Observation Value',
          type: 'Double'
        });

        fc.metadata.fields = fc.metadata.fields.concat(fields);
        // console.log('fc.metadata.fields', fc.metadata.fields);

        const observations = body.data.dataSets[0].observations;

        const returnGeometry =
          req.query && typeof req.query.returnGeometry !== 'undefined' ? req.query.returnGeometry : true;

        features = createFeatures(
          observations,
          dimensionProps,
          attributeProps,
          returnGeometry,
          provider.dataConfig.geographyCodeField
        );
        fc.features = features;

        layerName = body.data.structure.name.en;

        fc.metadata.name = layerName;

        // 2 min
        fc.ttl = 120;

        return callback(null, fc);
      }
    },
    error => {
      return callback({ message: error }, null);
    }
  );
};

function createFeatures(observations, dimensionProps, attributeProps, returnGeom, geographyCodeField) {
  let features = [];
  let idCounter = 1;
  for (obs in observations) {
    let feature = { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [] } };

    const dimSplits = obs.split(':');
    const attributes = observations[obs];

    for (var i = 0; i < dimSplits.length; i++) {
      const currentKeyInt = parseInt(dimSplits[i]);
      const foundDim = dimensionProps.filter(dim => dim.keyPosition === i)[0];
      if (foundDim) {
        if (foundDim.id === 'TIME_PERIOD') {
          const tv = moment(foundDim.values[currentKeyInt].name.en, 'YYYY-MM');
          // feature.properties[`${foundDim.id}_CODE`] = foundDim.values[currentKeyInt].id;
          feature.properties[`${foundDim.id}_CODE`] = tv.format('YYYY-MM').toString();
          feature.properties[foundDim.name.en.toUpperCase().replace(' ', '_')] = tv.format('YYYY-MM').toString();
        } else {
          feature.properties[`${foundDim.id}_CODE`] = foundDim.values[currentKeyInt].id;
          feature.properties[foundDim.name.en.toUpperCase().replace(' ', '_')] = foundDim.values[currentKeyInt].name.en;
        }
      }
    }

    const obsValue = attributes[0];
    feature.properties['OBS_VALUE'] = obsValue;

    attributes.shift();

    for (var i = 0; i < attributes.length; i++) {
      const attValue = attributes[i];
      const foundAtt = attributeProps[i];
      if (attValue === null) {
        feature.properties[`${foundAtt.id}_CODE`] = null;
        feature.properties[foundAtt.name.en.toUpperCase().replace(' ', '_')] = null;
      } else {
        feature.properties[`${foundAtt.id}_CODE`] = foundAtt.values[attValue].id;
        feature.properties[foundAtt.name.en.toUpperCase().replace(' ', '_')] = foundAtt.values[attValue].name.en;
      }
    }

    if (returnGeom) {
      feature.geometry.coordinates = getCountryGeometry(feature.properties.REF_AREA_CODE, geographyCodeField);
    }

    feature.properties['counterField'] = idCounter++;

    features.push(feature);
  }

  return features;
}

function getCountryGeometry(countryCode, geographyCodeField) {
  let coords = [0, 0];
  for (var i = 0; i < countryGeom.length; i++) {
    const c = countryGeom[i];
    if (c[geographyCodeField] === countryCode) {
      coords = [c.X, c.Y];
    }
  }
  return coords;
}

function parseFieldsAndLookups(dimensionProps, attributeProps) {
  let fields = [];

  dimensionProps.forEach(obs => {
    fields.push({
      name: `${obs.id}_CODE`,
      alias: `${obs.id}_CODE`,
      type: 'String'
    });

    fields.push({
      name: obs.name.en.toUpperCase().replace(' ', '_'),
      alias: obs.name.en,
      type: 'String'
    });
  });

  attributeProps.forEach(obs => {
    fields.push({
      name: `${obs.id}_CODE`,
      alias: `${obs.id}_CODE`,
      type: 'String'
    });

    fields.push({
      name: obs.name.en.toUpperCase().replace(' ', '_'),
      alias: obs.name.en,
      type: 'String'
    });
  });

  return fields;
}

module.exports = Model;
