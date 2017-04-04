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
        },
        
        timer: function(timestamp) {
            var div = $('<span>');
            
            var current = new Date().getTime();
            
            function _setTime() {
                var t = new Date().getTime() - current;
                div.text(util.formatTime(timestamp - t));                
            }
            
            setInterval(_setTime, 30000);
            
            _setTime();
            
            return div;
        },
        
        formatTime: function(timestamp) {
            var secs  = Math.floor(timestamp / 1000);
            var mins  = Math.floor(secs  / 60);
            var hours = Math.floor(mins  / 60);
            var days  = Math.floor(hours / 24);

            var time = '' + days > 0 ? days + ' days ' : '';
            time += hours > 0 ? (hours % 24) + ' hours ' : '';
            time +=  mins > 0 ? (mins % 60) + ' minutes ' : '';
//            time += (secs % 60) + ' seconds';

            return time;
        },
    }
    
    return util;
});