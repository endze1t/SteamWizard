var background = (function() {
    var obj = {
        storage: {},
        connections: [],
        pluginEnabled: null,

        updateIcon: function(enabled) {
            var icon = enabled ? "images/icon_128.png" : "images/icon_128_off.png";
            chrome.browserAction.setIcon({path: icon});
        },

        handleMessage: function(request, port) {
            var response;
            
            switch(request.msg) {
                case "getPluginStatus":
                    response = {msg: 'pluginStatus', status : background.pluginEnabled};
                    break;
                case "login":
                   $.ajax({type: "POST", url: request.PLUGIN_API_URL, data: request.LOGIN_REQUEST, xhrFields: {withCredentials: true}})
                    .done(function(data) {
                        port.postMessage({msg: 'loginDone', data: data, requestid : request.requestid});
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        port.postMessage({msg: 'loginFailed', textStatus: textStatus, errorThrown: errorThrown, requestid : request.requestid});
                    });
                    break;
                case "getStorage":
                    response = {msg: "storageResponse", namespace: request.namespace, value: background.storage[request.namespace]};
                    break;
                case "storeItem":
                    storage[request.namespace][request.key] = request.value;
                    try {
                        var value = request.value;
                        if(typeof value === 'object')
                           value = JSON.stringify(value);
                        
                        var lskey = request.namespace + '_' + request.key;
                        localStorage.setItem(lskey, value);
                        
                        /* notify all listening threads that a new item was added */
                        background.broadcaseMessage({msg: "newItem", namespace: request.namespace, key: request.key, value: request.value}, port);
                    } catch (e) {
                        console.log(e);
                    }
                    break;
            }
            
            if(response != null) {
               response.requestid = request.requestid;
               port.postMessage(response);
            }
        },

        handleConnect: function(port) {
            background.connections.push(port);

            port.onMessage.addListener(background.handleMessage);
            port.onDisconnect.addListener(background.handleDisconnect);
        },

        handleDisconnect: function(port) {
            var index = background.connections.indexOf(port);
            if(index > -1) {
               background.connections.splice(index, 1);
            }
        },

        handleIconClick: function(tab) {
            background.pluginEnabled = !background.pluginEnabled;
            background.updateIcon(background.pluginEnabled);
            window.localStorage.setItem('steam_wizard_enabled', background.pluginEnabled);

            background.broadcastMessage({msg: 'pluginStatus', status : background.pluginEnabled});
            
            console.log("message sent");
        },
        
        broadcastMessage: function(msg, exclude) {
            for(var i=0; i < background.connections.length; i++) {
                if(background.connections[i] === exclude)
                   continue;
           
                background.connections[i].postMessage(msg);
            }

        },

        /* reads localStorage and sorts items in order of their namespace */
        initStorage: function() {
            for(var i=0; i < localStorage.length; i++) {
                var lskey = localStorage.key(i);

                /* do not allow non namespaced items */
                if(!/^.+?_.+/.test(lskey))
                    localStorage.removeItem(lskey);

                var namespace = lskey.substr(0, key.indexOf('_'));

                var key = lskey.substr(namespace.length + 1);
                var value = localStorage.getItem(key);

                if(value.startsWith('{'))
                   try {
                       value = JSON.parse(value);
                   } catch (e) {}
               
                if(this.storage[namespace] == null)
                   this.storage[namespace] = {};

               this.storage[namespace][key] = value;
            }
        },

        init: function() {
            this.pluginEnabled = window.localStorage.getItem('steam_wizard_enabled') === null ? true : window.localStorage.getItem('steam_wizard_enabled')
            this.updateIcon(this.pluginEnabled);
            chrome.browserAction.onClicked.addListener(this.handleIconClick);
            chrome.runtime.onConnect.addListener(this.handleConnect);
        }
    };
    
    obj.init();
    return obj;
})();
