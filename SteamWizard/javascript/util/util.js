define("util/util", function() {    
    "using strict";

    /*http://stackoverflow.com/a/18405800*/
    if (!String.prototype.format) {
            String.prototype.format = function() {
                    var args = arguments;
                    return this.replace(/{(\d+)}/g, function(match, number) {
                            return typeof args[number] != 'undefined'
                                    ? args[number]
                                    : match
                            ;
                    });
            };
    }

    var util = {
        getAssetID : function(inspectLink){
            var reg = /.*A(\d+).*/;
            var match = reg.exec(inspectLink);
            return match ? match[1] : null;
        }
    }
    
    return util;
});