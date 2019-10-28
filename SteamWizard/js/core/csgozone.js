define(["util/constants", "port"], function(constants, port) {

    var csgozone = {
        PLUGIN_API_URL         : 'https://www.csgozone.net/_service/plugin',
        AFFILIATES_REQUEST     : 'type=market-affiliates',
        AFFILIATES_LOWEST_PRICE: 'type=market-affiliate-lowest-price&code={0}&itemname={1}',
        RESOURCE_REQUEST       : 'type={0}',
        
        log: function(version) {
            var content = 'ad';
            content += version == null ? '' : ('&extension_version=' + version);
            $.ajax(csgozone.PLUGIN_API_URL + '?' + content);
        },

        affiliates: function(callback) {
            $.ajax({type: "POST", 
                    url: csgozone.PLUGIN_API_URL, 
                    data: csgozone.AFFILIATES_REQUEST})
            .done(function(data) {
                callback(data);
            }).fail(function(jqXHR, textStatus, errorThrown) { 
                callback({success: false, error: textStatus});
            });
        },
        
        getAffiliateLowestPrice: function(code, itemname, callback) {
            $.ajax({type: "POST", 
                    url: csgozone.PLUGIN_API_URL, 
                    data: csgozone.AFFILIATES_LOWEST_PRICE.format(code, encodeURIComponent(itemname))})
            .done(function(data) {
                callback(data);
            }).fail(function(jqXHR, textStatus, errorThrown) { 
                callback({success: false, error: textStatus});
            });
        },
        
        /* requirejs plugin api functions */
        load: function(name, parentRequire, onload, config) {
            var handler = function(result) {
                if(result.type === constants.msg.RESOURCE_SUCCESS)
                   onload(result.resource.data);
                else if(onload.onerror)
                   onload.onerror();
            };
            
            port.getResource(name, csgozone.PLUGIN_API_URL, csgozone.RESOURCE_REQUEST.format(name), handler);
        }
        
    };
    
    return csgozone;
});
