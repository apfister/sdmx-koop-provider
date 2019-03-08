## sdmx-koop-provider
Transform responses from an SDMX API to a Feature Service that can be used in the ArcGIS platform.

## Getting Started
- `git clone` this repo
- `npm install`
- start the server with `npm start`
- your server is now available at `http://localhost:8080/sdmx`

## Using the Koop Provider

### Getting info
Visiting `http://localhost:8080/sdmx` will list the available sources in your [config/default.json](config/default.json). You can get details of each source at `http://localhost:8080/sdmx/{sourceKey}`. This endpoint will give you some reference data that you can use to construct your Feature Service URL.

 For example: `http://localhost:8080/sdmx/unicef`

### Using provider URLs in ArcGIS
After you have your provider running, you can drop in the Feature Server URLs into various ArcGIS Online clients. You can copy and paste the URL into the [ArcGIS Online Map Viewer](https://doc.arcgis.com/en/arcgis-online/create-maps/add-layers.htm#ESRI_SECTION2_314AA95D5A074ACD91AA6AA1DD9F9E5C), or [add it as an item to your ArcGIS Online account](https://doc.arcgis.com/en/arcgis-online/manage-data/add-items.htm#ESRI_SECTION1_1A21D51E1AFC41EA9974209BD94E50C0) using the URL.