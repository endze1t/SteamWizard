"using strict";

var util = {
    getAssetID : function(inspectLink){
        var reg = /.*A(\d+).*/;
        var match = reg.exec(inspectLink);
        return match ? match[1] : null;
    }
}