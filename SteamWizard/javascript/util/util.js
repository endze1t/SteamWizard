define("util/util", function() {
    "using strict";

    /*http://stackoverflow.com/a/18405800*/
    if (!String.prototype.format) {
        String.prototype.format = function () {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        };
    }
      
    function _extractSticker(input) {
        var sticker = [];
        var regex = /<img.*?src="(.*?)">/g;
        var m = regex.exec(input);
        while(m != null) {
            sticker.push({image: m[1]});
            m = regex.exec(input);
        }

        var s = input.match('>Sticker:(.*?)<');
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
        
        fetchGlobal: function(variable, callback) {
            var interval = null;
            
            var id = 'SteamWizard_Message_' + new Date().getTime();
            var $element = $('<div>').attr('id', id);
            $element.appendTo(document.body);
            
            // Event listener
            document.addEventListener(id, function listener(e) {
                if(callback && e.detail) {
                   callback(e.detail);
                   clearInterval(interval);
                   
                   /* remove event listener */
                   document.removeEventListener(id, listener);
                   
                   /* remove element from dom */
                   $element.remove();
                }
            });

            // inject code into "the other side" to talk back to this side;
            var script = document.createElement('script');
            //appending text to a function to convert it's src to string only works in Chrome
            script.textContent = '(' +
                    function(classname) {
                        document.getElementById(classname).onclick = function() {
                            var var_name = this.getAttribute('variable');
                            document.dispatchEvent(new CustomEvent(classname, {
                                detail: window[var_name]
                            }));
                        };
                    }
                + ')("'+ id +'");';

            //cram that sucker in 
            (document.head || document.documentElement).appendChild(script);

            script.remove();
            $element.attr('variable', variable);
            
            clearInterval(interval);
            var counter = 50;

            interval = setInterval(function () {
                $('#'+id)[0].click();

                if (counter-- < 1)
                    clearInterval(interval);
            }, 100);

            $('#'+id)[0].click();
        },
        
        getProperties: function(name) {
            var prop = {};

            prop.isKnife        = /^★/.test(name);
            prop.isSticker      = /^Sticker \|/.test(name);
            prop.isSouvenir     = /^Souvenir .*?\|/.test(name);
            prop.isMusic        = /^Music \|/.test(name);
            prop.isKey          = /Case Key/.test(name) || /eSports Key/.test(name);
            prop.isStatTrak     = /StatTrak™/.test(name);
            prop.isGraffiti     = /^Sealed Graffiti/.test(name);
            prop.isOffer        = /^Offer \|/.test(name);
            prop.isUsedGraffiti = /^Graffiti \|/.test(name);

            return prop;
        }
    }
    
    return util;
});