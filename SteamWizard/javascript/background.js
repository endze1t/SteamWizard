var background = (function() {
    var storage = (function() {
        var sizes = {};
        var store = {};
        var limit = {};
        
        limit[constant.NAMESPACE_SCREENSHOT] = 100;
        limit[constant.NAMESPACE_MARKET_INSPECT] = 1000;
        
        function lsKey(name, key) {
            return name + '$' + key;
        }
        function lsKeyReverse(lskey) {
            var split = lskey.split('$');
            return split.length < 2 ? null : {namespace: split[0], key: split[1]};
        }
        
        return {        
            /* reads localStorage and sorts items in order of their namespace */
            init: function() {
                for(var i=0; i < localStorage.length; i++) {
                    var lskey = localStorage.key(i);

                    /* do not allow invalid namespaced items */
                    var temp = lsKeyReverse(lskey);
                    if(temp === null){
                        localStorage.removeItem(lskey);
						continue;
					}

                    var namespace = temp.namespace;
                    var key = temp.key;
                    
                    var value = localStorage.getItem(lskey);

                    if(value.startsWith('{'))
                       try {
                           value = JSON.parse(value);
                       } catch (e) {}

                    if(store[namespace] === undefined)
                       store[namespace] = {};

                    store[namespace][key] = value;
                }

                for(var i in store)
                    sizes[i] = Object.keys(store[i]).length;
            },
            add: function(namespace, key, value) {            
                if(store[namespace] === undefined) {
                   sizes[namespace] = 0;
                   store[namespace] = {};
                }

                if(!store[namespace][key]) {
                    sizes[namespace]++;
                    store[namespace][key] = value;
                }
                
                try {
                    if(typeof value === 'object')
                       value = JSON.stringify(value);

                    var lskey = lsKey(namespace, key);
                    localStorage.setItem(lskey, value);
                } catch (e) {
                    console.log(e);
                }

                if(sizes[namespace] >= limit[namespace] * 2)
                   this.cleanup(namespace, sizes[namespace] - limit[namespace]);
            },
            get: function(namespace, key) {
                return key ? store[namespace][key] : store[namespace];
            },
            cleanup: function(namespace, deleteCount) {
                console.log(sizes[namespace], Object.keys(store[namespace]).length, namespace, deleteCount);
                for(var i in store[namespace]) {
                    var lskey = lsKey(namespace, i);
                    localStorage.removeItem(lskey);
                    delete store[namespace][i];
                    
                    if(--deleteCount <= 0)
                       break;
                }

                sizes[namespace] = Object.keys(store[namespace]).length;
            }
        };
    })();
    
    var inspectStatus = {
        usage: 0
    };
    var timeout;

    function updateStatus(data) {
        inspectStatus = data;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            /* TODO .. HOW ? */
        }, data.reset);
    }

    var obj = {
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
                    response = {msg: "storageResponse", namespace: request.namespace, value: storage.get(request.namespace)};
                    break;
                case "storeItem":
                    storage.add(request.namespace, request.key, request.value);
                    /* notify all listening threads that a new item was added */
                    background.broadcastMessage({msg: "newItem", namespace: request.namespace, key: request.key, value: request.value}, port);
                    break;
                case "inspectStatus":
                    updateStatus(request.data);
                    background.broadcastMessage({msg: "inspectStatus", data: request.data});
                    break;
                case "inspectUsage":
                    inspectStatus.usage -= request.amount;
                    if(inspectStatus.limit)
                       background.broadcastMessage({msg: "inspectLimit", data: inspectStatus.limit - inspectStatus.usage});
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

        init: function() {
            this.pluginEnabled = window.localStorage.getItem('steam_wizard_enabled') === null ? true : window.localStorage.getItem('steam_wizard_enabled')
            this.updateIcon(this.pluginEnabled);
            chrome.browserAction.onClicked.addListener(this.handleIconClick);
            chrome.runtime.onConnect.addListener(this.handleConnect);
            storage.init();
        }
    };
    
    obj.init();
    return obj;
})();
