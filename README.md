## sdmx-koop-provider
Transform responses from an SDMX API to a Feature Service that can be used in the ArcGIS platform.

## Getting Started
- `git clone` this repo
- `npm install`
- start the server with `npm start`
- your server is now available at `http://localhost:8080/sdmx`

## Setting up the Redis Cache
This provider utilizes a Redis cache. At the moment, no other types of caches are supported. Using Redis deployed on Microsoft Azure has been a very easy setup and is highly recommended. However, you need only supply the following environmnet variables in order for the provider to function.
- REDIS_HOST
    - ex: `azure-redis-resource.redis.cache.windows.net`
- REDIS_PORT
    - ex: `6380`
- REDIS_AUTH
    - ex: `superSecretAuthenticationGoesHere`
- REDIS_TTL
    - this will specify, in seconds, how long you want a dataset to "live" for in the cache. after this value, the `getData()` method will fire again to request a "fresh" dataset
    - ex: `10`

If you are using Microsoft Azure, you can set these variables in the "Application Settings" section of your App Service web app

## Using the Koop Provider

### Getting info
Visiting `http://localhost:8080/sdmx` will list the available sources in your [config/default.json](config/default.json). You can get details of each source at `http://localhost:8080/sdmx/{sourceKey}`. This endpoint will give you some reference data that you can use to construct your Feature Service URL.

 For example: `http://localhost:8080/sdmx/unicef`

### Using provider URLs in ArcGIS
After you have your provider running, you can drop in the Feature Server URLs into various ArcGIS Online clients. You can copy and paste the URL into the [ArcGIS Online Map Viewer](https://doc.arcgis.com/en/arcgis-online/create-maps/add-layers.htm#ESRI_SECTION2_314AA95D5A074ACD91AA6AA1DD9F9E5C), or [add it as an item to your ArcGIS Online account](https://doc.arcgis.com/en/arcgis-online/manage-data/add-items.htm#ESRI_SECTION1_1A21D51E1AFC41EA9974209BD94E50C0) using the URL.