/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


define(["util/constants"], function(constants) {
    var eventListeners = [];
    
    var port = chrome.runtime.connect({name: "content_script_port_" + Date.now()});
        
    port.onMessage.addListener(function(msg) {
        for(var i = 0; i < eventListeners.length; i++)
            eventListeners[i](msg);
    });

    return {
        addEventListener: function(callback) {
            if(eventListeners.indexOf(callback) > -1)
               return;

            eventListeners.push(callback);
        },
        
        sendMessage: function(msg, callback) {
            chrome.runtime.sendMessage(msg, callback);
        },
    
        getItemInfo: function(inspect, callback, force, batch) {
            var msg = {
                type: constants.msg.BACKGROUND_GET_ITEMINFO,
                inspect: inspect,
                force: force,
                batch: batch
            };

            this.sendMessage(msg, callback);
        },
    
        getScreenshot: function(inspect) {
            var msg = {
                type: constants.msg.BACKGROUND_GET_SCREENSHOT,
                inspect: inspect,
            };

            this.sendMessage(msg);
        },
    
        getResource: function(name, url, content, callback) {
            var msg = {
                type: constants.msg.BACKGROUND_GET_RESOURCE,
                name: name,
                url: url,
                content: content
            };
            
            this.sendMessage(msg, callback);            
        },
        
        setOption: function(field, value) {
            var msg = {
                type: constants.msg.BACKGROUND_SET_OPTIONS,
                field: field,
                value: value
            };

            this.sendMessage(msg);  
        },
        
        addTradeupItem: function(item, callback) {
            var msg = {
                type: constants.msg.BACKGROUND_ADD_TRADEUPITEM,
                item: item
            };

            this.sendMessage(msg, callback);
        },
            
        /**
         * requirejs plugin
         * 
         * USAGE
         * -----
         * port!MSGID, KEY: VALUE, ....
         * 
         * MSGID must be defined in constants.msg
         * 
         **/
        load: function(name, parentRequire, onload, config) {
            var split = name.split(",");
            
            var msg = {
                type: constants.msg[split[0].trim()]
            };
            
            /* more parameters in form of KEY : VALUE */
            for(var i=1; i < split.length; i++) {
                var s = split[i].split(":");
                msg[s[0].trim()] = s[1].trim();
            }
            
            chrome.runtime.sendMessage(msg, function(response) {
                onload(response.data);
            });
        }
    };    
});