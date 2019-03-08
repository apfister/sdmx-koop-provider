## sdmx-koop-provider
Transform responses from an SDMX API to a Feature Service that can be used in the ArcGIS platform.

## Getting Started
- `git clone` this repo
- `npm install`
- decide on a configuration to use from the [dynamicConfig.json](config/dynamicConfig.json) file. copy the key. (ex: `unicef`)
- start the server by typing `NODE_ENV={configKey} npm start` where `{configKey}` is the key you copied from the previous step.
- your server is now available at `http://localhost:8080/sdmx`

## Using the Koop Provider

### Getting info
You can get details at `http://localhost:8080/sdmx/info`. This endpoint will give you some reference data that you can use to construct your Feature Service URL.

### Using provider URLs in ArcGIS
After you have your provider running, you can drop in the Feature Server URLs into various ArcGIS Online clients. You can copy and paste the URL into the [ArcGIS Online Map Viewer](https://doc.arcgis.com/en/arcgis-online/create-maps/add-layers.htm#ESRI_SECTION2_314AA95D5A074ACD91AA6AA1DD9F9E5C), or [add it as an item to your ArcGIS Online account](https://doc.arcgis.com/en/arcgis-online/manage-data/add-items.htm#ESRI_SECTION1_1A21D51E1AFC41EA9974209BD94E50C0) using the URL.