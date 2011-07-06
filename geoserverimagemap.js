/**
 * @file
 * Layer handler for Imagemap layers provided by GeoServer
 */

/**
 * Openlayer layer handler for Imagemap layer
 */
Drupal.openlayers.layer.geoserverimagemap = function (title, map, options) {
//  var styleMap = Drupal.openlayers.getStyleMap(map, options.drupalID);
//
//  /* TODO: have PHP take care of the casts here, not JS! */
//  if (options.params.buffer) {
//    options.params.buffer = parseInt(options.params.buffer, 10);
//  }
//  if (options.params.ratio) {
//    options.params.ratio = parseFloat(options.params.ratio);
//  }
//
//  options.params.drupalID = options.drupalID;
  
  var layer = new OpenLayers.Layer.WMSImageMap(
                    title, options.base_url,
                    {                        
                        layers: 'drupalwfs:drupal_imageoverlay',
                        styles: 'groups_imagemap',
                        srs: 'EPSG:900913'
                    }
                );
                
  

  
// var layer = new OpenLayers.Layer.WMSImageMap(title,
//    options.base_url, options.options, options.params);
////  layer.styleMap = styleMap;
  return layer;
};
