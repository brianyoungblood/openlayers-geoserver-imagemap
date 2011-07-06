/**
 * @requires OpenLayers/Layer/HTTPRequest.js
 */

/**
 * Class: OpenLayers.Layer.WMSImageMap
 * Implements a layer as an html map with info bound to each shape (as title attribute or mouse events).
 *
 * Inherits from:
 *  - <OpenLayers.Layer.HTTPRequest>
 */
OpenLayers.Layer.WMSImageMap = OpenLayers.Class(OpenLayers.Layer.HTTPRequest, {
    
     /**
     * Constant: DEFAULT_PARAMS
     * {Object} Hashtable of default parameter key/value pairs 
     */
    DEFAULT_PARAMS: { service: "WMS",
                      version: "1.1.1",
                      request: "GetMap",
                      styles: "",
                      exceptions: "application/vnd.ogc.se_inimage",
                      format: "text/html"
                     },
						
	/**
     * APIProperty: isBaseLayer
     * {Boolean} Default is false for WMSImageMap layer
     */
    isBaseLayer: false,
	
	/**
     * APIProperty: encodeBBOX
     * {Boolean} Should the BBOX commas be encoded? The WMS spec says 'no', 
     * but some services want it that way. Default false.
     */
    encodeBBOX: false,

    /**
     * Constructor: OpenLayers.Layer.WMSImageMap
     * Create a new WMSImageMap layer
     *
     * Parameters:
     * name - {String}
     * url - {String}
     * params - {Object}
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, params, options) {
		var newArguments = [];
        //uppercase params
        params = OpenLayers.Util.upperCaseObject(params);
        newArguments.push(name, url, params, options);
        OpenLayers.Layer.HTTPRequest.prototype.initialize.apply(this, newArguments);
        OpenLayers.Util.applyDefaults(
                       this.params, 
                       OpenLayers.Util.upperCaseObject(this.DEFAULT_PARAMS)
                       );            
    },

    /**
     * APIMethod: destroy
     * Deconstruct the layer
     */
    destroy: function() {        
        OpenLayers.Layer.HTTPRequest.prototype.destroy.apply(this, arguments); 
    },

    
    /**
     * APIMethod: clone
     * Create a clone of this layer
     *
     * Parameters:
     * obj - {Object} Is this ever used?
     * 
     * Returns:
     * {<OpenLayers.Layer.Grid>} An exact clone of this OpenLayers.Layer.Grid
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.WMSImageMap(this.name,
                                            this.url,
                                            this.params,
                                            this.options);
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.HTTPRequest.prototype.clone.apply(this, [obj]);        

        return obj;
    },    

    /**
     * Method: moveTo
     * This function is called whenever the map is moved. All the moving
     * of actual 'tiles' is done by the map, but moveTo's role is to accept
     * a bounds and make sure the data that that bounds requires is pre-loaded.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * zoomChanged - {Boolean}
     * dragging - {Boolean}
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        OpenLayers.Layer.HTTPRequest.prototype.moveTo.apply(this, arguments);
        
        bounds = bounds || this.map.getExtent();

        if (bounds != null) {
             if(!dragging)
				this.update(bounds);
            
        }
    },
	
	shiftLayer: function() {
		var layerContainer=this.map.layerContainerDiv;
		var top=layerContainer.style.top;
		var left=layerContainer.style.left;
		if(top.substring(0,1)=='-')
			top=top.substring(1);
		else
			top='-'+top;
		if(left.substring(0,1)=='-')
			left=left.substring(1);
		else
			left='-'+left;
		this.div.style.top=top;		
		this.div.style.left=left;		
	},
	
	update:function(bounds) {
		this.shiftLayer();
		
		var url=this.getURL(bounds);
		var tooltipLayer=this.div;
		var size=this.map.getSize();
		var request = new OpenLayers.Ajax.Request(
			url, 
			{
				method: 'get', 
				asynchronous: true,
				onComplete: function(response) {
					/*
					// create the tooltip container, if not already done
					var tooltipLayer=document.getElementById('tooltip');
					if(!tooltipLayer) {
						tooltipLayer=document.createElement('div');
						tooltipLayer.id='tooltip';
						tooltipLayer.style.position='absolute';
						// z-index so that the tooltip layer is over the map, but under the controls
						tooltipLayer.style.zIndex=900;
						// append the layer to the map viewport
						map.viewPortDiv.appendChild(tooltipLayer);
					}*/
					
					// create a dummy image to "host" the tooltip
					var img='<img border="0" src="/sites/all/modules/geoserver/imagemap/js/s.gif" width="'+size.w+'" height="'+size.h+'" usemap="#drupal"/>';
					// insert the tooltip and dummy image in the page
					tooltipLayer.innerHTML=response.responseText+img;						
				}, 
				onFailure: function(response) {
					alert('Error retrieving layer '+this.name);
				}
			}
		);
	},
	
	 /**
     * Method: getURL
     * Return a GetMap query string for this layer
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} A bounds representing the bbox for the
     *                                request.
     *
     * Returns:
     * {String} A string with the layer's url and parameters and also the
     *          passed-in bounds and appropriate tile size specified as 
     *          parameters.
     */
    getURL: function (bounds) {
        bounds = this.adjustBounds(bounds);
        
        var imageSize = this.map.getSize(); 
        var newParams = {
            'BBOX': this.encodeBBOX ?  bounds.toBBOX() : bounds.toArray(),
            'WIDTH': imageSize.w,
            'HEIGHT': imageSize.h
        };
        var requestString = this.getFullRequestString(newParams);
        return requestString;
    },
	
	 /**
     * APIMethod: mergeNewParams
     * Catch changeParams and uppercase the new params to be merged in
     *     before calling changeParams on the super class.
     * 
     *     Once params have been changed, we will need to re-init our tiles.
     * 
     * Parameters:
     * newParams - {Object} Hashtable of new params to use
     */
    mergeNewParams:function(newParams) {
        var upperParams = OpenLayers.Util.upperCaseObject(newParams);
        var newArguments = [upperParams];
        return OpenLayers.Layer.Grid.prototype.mergeNewParams.apply(this, 
                                                             newArguments);
    },

    /** 
     * Method: getFullRequestString
     * Combine the layer's url with its params and these newParams. 
     *   
     *     Add the SRS parameter from projection -- this is probably
     *     more eloquently done via a setProjection() method, but this 
     *     works for now and always.
     *
     * Parameters:
     * newParams - {Object}
     * altUrl - {String} Use this as the url instead of the layer's url
     * 
     * Returns:
     * {String} 
     */
    getFullRequestString:function(newParams, altUrl) {
        var projectionCode = this.map.getProjection();
        this.params.SRS = (projectionCode == "none") ? null : projectionCode;

        return OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(
                                                    this, arguments);
    },
    
    CLASS_NAME: "OpenLayers.Layer.WMSImageMap"
});
