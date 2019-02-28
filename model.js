/*
  model.js

  This file is required. It must export a class with at least one public function called `getData`

  Documentation: http://koopjs.github.io/docs/usage/provider
*/
const request = require('request').defaults({
  gzip: true,
  json: true
});
const config = require('config');
const sdmxReferenceConfig = require('./sdmx-all-references.json');
const countryGeom = require('./config/country-geometry.json');

const format = require('string-format');
format.extend(String.prototype, {});

const fs = require('fs');

function Model(koop) {}

// Public function to return data from the
// Return: GeoJSON FeatureCollection
//
// Config parameters (config/default.json)
// req.
//
// URL path parameters:
// req.params.host (if index.js:hosts true)
// req.params.id  (if index.js:disableIdParam false)
// req.params.layer
// req.params.method
Model.prototype.getApiDetail = function (req, callback) {
  callback(null, {});
}

// Public function to return data from the
// Return: GeoJSON FeatureCollection
//
// Config parameters (config/default.json)
// req.
//
// URL path parameters:
// req.params.host (if index.js:hosts true)
// req.params.id  (if index.js:disableIdParam false)
// req.params.layer
// req.params.method
Model.prototype.refreshConfig = function (req, callback) {
  let outputFields = [];
  const concepts = sdmxReferenceConfig.data.conceptSchemes[0].concepts;
  // console.log(sdmxReferenceConfig.data.conceptSchemes);
  for (var i=0;i < concepts.length; i++) {
    const concept = concepts[i];
    outputFields.push({
      name: concept.id,
      alias: concept.name.en,
      type: 'esriFieldTypeString'
    });
  }

  callback(null, outputFields);
}

// Public function to return data from the
// Return: GeoJSON FeatureCollection
//
// Config parameters (config/default.json)
// req.
//
// URL path parameters:
// req.params.host (if index.js:hosts true)
// req.params.id  (if index.js:disableIdParam false)
// req.params.layer
// req.params.method
Model.prototype.getData = function (req, callback) {
  // sample URL 
  // https://api.data.unicef.org/sdmx/Rest/data/UNICEF,CME_DF,1.0/AFG.MRY0T4._T../?dimensionAtObservation=AllDimensions

  const sdmxBaseUrl = config.unicefDataBaseApi.url;
  
  // console.log('req.params', req.params);
  // console.log('req.query', req.query);
  if (!req.params || !req.params.id){
    return callback({message: 'indicator not specified'});
  } 
  
  const sdmxParams = req.params.id.split(':');
  if (sdmxParams.length === 0) {
    return callback({message: 'no parameters specified'});
  }

  if (sdmxParams[0].length !== 3) {
    return callback({message: 'country code must be 3 characters'});
  }

  const countryCode = sdmxParams[0];
  const indicator = sdmxParams[1];
  const sex = sdmxParams[2];

  // {countryCode}.{indicatorCode}.{sexCode}.{otherCode}
  let params = {};
  sdmxParams.forEach(param => {
    if (sdmxParams[0]) {
      params['countryCode'] = sdmxParams[0];
    }
    if (sdmxParams[1]) {
      params['indicatorCode'] = sdmxParams[1];
    }
    if (sdmxParams[2]) {
      params['sexCode'] = sdmxParams[2];
    }
    if (sdmxParams[3]) {
      params['otherCode'] = sdmxParams[3];
    }
  });
  
  console.log(sdmxBaseUrl);
  const requestUrl = sdmxBaseUrl.format(params);
  console.log(requestUrl);

  request({url: requestUrl, headers: config.unicefDataBaseApi.headers }, (err, res, body) => {
    if (err) return callback(err);
    const observations = body.data.dataSets[0].observations;
    const dimensionProps = body.data.structure.dimensions.observation;
    const attributeProps = body.data.structure.attributes.observation;
    const fields = parseFieldsAndLookups(dimensionProps, attributeProps);
    fields.push({
      name: 'OBS_VALUE',
      alias: 'Observation Value',
      type: 'esriFieldTypeString'
    });
    
    // TESTING outputs
    // console.log(parsed);
    // fs.writeFileSync('testing/fields.json', JSON.stringify(parsed.fields));
    // fs.writeFileSync('testing/lookups.json', JSON.stringify(parsed.lookups));

    const features = createFeatures(observations, dimensionProps, attributeProps);
    const fc = {
      type: 'FeatureCollection',
      features: features
    }

    fc.metadata = {
      name: body.data.structure.name.en
    };

    callback(null, fc);
  });  
}

function createFeatures(observations, dimensionProps, attributeProps) {
  let features = [];
  for (obs in observations) {
    let feature = { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates:[]} };
    
    const dimSplits = obs.split(':');
    const attributes = observations[obs];

    for (var i=0;i < dimSplits.length;i++) {
      const currentKeyInt = parseInt(dimSplits[i]);
      const foundDim = dimensionProps.filter(dim => dim.keyPosition === i)[0];
      if (foundDim) {
        if (foundDim.id === 'TIME_PERIOD') {
          feature.properties[`${foundDim.id}_CODE`] = foundDim.values[currentKeyInt].id;
          feature.properties[foundDim.name.en.toUpperCase().replace(' ', '_')] = 'world';
        } else {
          feature.properties[`${foundDim.id}_CODE`] = foundDim.values[currentKeyInt].id;
          feature.properties[foundDim.name.en.toUpperCase().replace(' ', '_')] = foundDim.values[currentKeyInt].name.en;
        } 
      }           
    }
    
    const obsValue = attributes[0];
    feature.properties['OBS_VALUE'] = obsValue;

    attributes.shift();

    for (var i=0;i < attributes.length;i++) {
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

    feature.geometry.coordinates = getCountryGeometry(feature.properties.REF_AREA_CODE);

    features.push(feature);
  }

  return features;
}

function getCountryGeometry(iso3cd) {
  let coords = [0,0];
  for (var i=0;i < countryGeom.length;i++) {
    const c = countryGeom[i];
    if (c.ISO3CD === iso3cd) {
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
      alias: obs.id,
      type: 'esriFieldTypeString'
    });

    fields.push({
      name: obs.name.en.toUpperCase().replace(' ', '_'),
      alias: obs.name.en,
      type: 'esriFieldTypeString'
    }); 
  });

  attributeProps.forEach(obs => {
    fields.push({
      name: `${obs.id}_CODE`,
      alias: obs.id,
      type: 'esriFieldTypeString'
    });

    fields.push({
      name: obs.name.en.toUpperCase().replace(' ', '_'),
      alias: obs.name.en,
      type: 'esriFieldTypeString'
    });   
  });

  return fields;
}

module.exports = Model;