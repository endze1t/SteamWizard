define(function() {
    "using strict";
      
    function _extractSticker(input) {
        var sticker = [];
        var regex = /<img.*?src="(.*?)">/g;
        var m = regex.exec(input);
        while(m != null) {
            sticker.push({image: m[1]});
            m = regex.exec(input);
        }

        var s = input.match('<img.*br>.*:(.*?)</');
        if(s[1] && s[1].split(",").length === sticker.length) {
           s = s[1].split(",");
           for(var i=0; i < s.length; i++)
               sticker[i].name = s[i].trim();
        }

        return sticker;
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
        
        parseStickerData: function(descriptions) {
            if(descriptions) {
                for(var k=0; k < descriptions.length; k++) {
                    if(descriptions[k].value && descriptions[k].value.indexOf("sticker_info") != -1)
                       return _extractSticker(descriptions[k].value);
                }
            }
        },
        
        getProperties: function(name) {
            var prop = {};

            prop.isKnife          = /^★/.test(name);
            prop.isSticker        = /^Sticker \|/.test(name);
            prop.isSouvenir       = /^Souvenir .*?\|/.test(name);
            prop.isMusic          = /^Music \|/.test(name);
            prop.isKey            = /Case Key/.test(name) || /eSports Key/.test(name);
            prop.isVanilla        = /CS:GO Case Key/.test(name);
            prop.isStatTrak       = /StatTrak™/.test(name);
            prop.isSealedGraffiti = /^Sealed Graffiti/.test(name);
            prop.isOffer          = /^Offer \|/.test(name);
            prop.isGraffiti       = /^Graffiti \|/.test(name);

            return prop;
        },
        
        eachDelayed: function(array, method, timeout, batch) {
            function create(item, method) {
                return function() {
                    method(item);
                };
            }
            
            if(!batch)
                batch = 1;
            
            var time = Date.now();
            
            for(var i=0; i < array.length; i++) {
                setTimeout(create(array[i], method), timeout*(i/batch));
            }
            
            setTimeout(function() {
                //alert('hi: ' + array[0] + ' ' + (Date.now() - time)/1000);
            }, timeout * array.length / batch);
        },
        
        chainCall: function(array, method, timeout, callback) {
            var time = Date.now();

            var index = 0;
            var batch = 1;
            
            (function doNext() {
                var callNext = false;
//                var selftime = Date.now();
                for(var i=0; i < batch && index < array.length; i++) {
                    callNext = method(array[index++]) !== false;
                }
                
                if(callNext)
                    setTimeout(doNext, timeout);
                else {
//                    console.log('done ' + (Date.now() - time));
                    if(callback)
                       callback();
                }
                
                //var t = Date.now();
                //console.log('selftime ' + (t - selftime) + ' ' + selftime + ' ' + t);
            })();
        },
        
        directCall: function(array, method) {
            var time = Date.now();
//            console.log('start ' + time);

            for(var i=0; i < array.length; i++)
                method(array[i]);
            
//            console.log('done ' + (Date.now() - time));
        },
        
        execDelayed: function(methods, delay) {
            function exec(method) {
                return function() {
                    method();
                };
            }
            
            for(var i=0; i < methods.length; i++) {
                setTimeout(exec(methods[i]), delay*i);
            }
        },
        
        hashnameToName: function(hashname) {
            if(hashname.endsWith("(Holo-Foil)"))
                return hashname.replace('(Holo-Foil)', '(Holo/Foil)');
            
            return hashname;
        },
        
        keys: {
            ENTER : 13,
            SHIFT : 16,
            CTRL  : 17,
            ALT   : 18
        }
    }
    
    return util;
});