/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


define(["background/storage", "util/constants"], function(storage, constants) {
    var NAMESPACE_CONFIG = constants.namespace.NAMESPACE_CONFIG;
    
    var options = {
        /*
         * Is plugin enabled
         */
        enabled: true,
        
        /*
         * Autoload float values from server
         */
        autoload_floats: true,
        
        /*
         * current version of plugin
         */
        version: chrome.runtime.getManifest().version,
        
        /*
         * amount of items to display on the market
         */
        market_display_count: 10,
        
        /*
         * batch requests when asking for float values
         */
        batch_requests: true,
    };
    
    /* initialize */
    (function() {
        for(var i in options) {
            var stored = storage.get(NAMESPACE_CONFIG, i);

            if(stored)
                options[i] = stored;
        };
    })();
    
    return {
        /* returns all options */
        get: function() {
            return options;
        },
        
        /* sets a field */
        set: function(field, value) {
            options[field] = value;
            storage.set(NAMESPACE_CONFIG, field, value);
        }
    };
});