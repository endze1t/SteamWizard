var background = (function() {
    var storage = (function() {
        var sizes = {};
        var store = {};
        var limit = {};
        
        limit[namespace.NAMESPACE_SCREENSHOT] = 100;
        limit[namespace.NAMESPACE_MARKET_INSPECT] = 1000;
        
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

                if(sizes[namespace] && sizes[namespace] >= limit[namespace] * 2)
                   this.cleanup(namespace, sizes[namespace] - limit[namespace]);
            },
            get: function(namespace, key) {
                if(store[namespace] === undefined)
                   return null;
               
                return key ? store[namespace][key] : store[namespace];
            },
            remove: function(namespace, key) {       
                if(store[namespace] === undefined) {
                   return;
                }
                
                var lskey = lsKey(namespace, key);
                localStorage.removeItem(lskey);
                delete store[namespace][key];
            },
            cleanup: function(namespace, deleteCount) {
                console.log(sizes[namespace], Object.keys(store[namespace]).length, namespace, deleteCount);
                for(var i in store[namespace]) {
                    this.remove(namespace, i);
                    
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
	
	var screenshotStatus = {
		user_has_premium : 0
	};
	function updateScreenshotStatus(data){
		screenshotStatus = data;
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
                case msg.BACKGROUND_DO_LOGIN:
                   $.ajax({type: "POST", url: request.PLUGIN_API_URL, data: request.LOGIN_REQUEST, xhrFields: {withCredentials: true}})
                    .done(function(data) {
                        port.postMessage({msg: msg.LOGIN_SUCCESS, data: data, requestid : request.requestid});
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        port.postMessage({msg: msg.LOGIN_FAILED, textStatus: textStatus, errorThrown: errorThrown, requestid : request.requestid});
                    });
                    break;
                    
                case msg.BACKGROUND_GET_PLUGIN_STATUS:
                    response = {msg: msg.PLUGIN_STATUS, status : background.pluginEnabled};
                    break;

                case msg.BACKGROUND_GET_STORAGE:
                    response = {msg: msg.STORAGE, namespace: request.namespace, value: storage.get(request.namespace)};
                    break;
                    
                case msg.BACKGROUND_SET_ITEM:
                    storage.add(request.namespace, request.key, request.value);
                    /* notify all listening threads that a new item was added */
                    background.broadcastMessage({msg: msg.BROADCAST_ITEM, namespace: request.namespace, key: request.key, value: request.value}, port);
                    break;
                    
                case msg.BACKGROUND_SET_INSPECT_STATUS:
                    updateStatus(request.data);
                    background.broadcastMessage({msg: msg.BROADCAST_INSPECT_STATUS, data: request.data});
                    break;
                    
		case msg.BACKGROUND_SET_SCREENSHOT_STATUS:
                    updateScreenshotStatus(request.data);
                    background.broadcastMessage({msg: msg.BROADCAST_SCREENSHOT_STATUS, data: request.data});
                    break;
                    
                case msg.BACKGROUND_INCREASE_INSPECT_USAGE:
                    inspectStatus.usage += request.amount;
                    if(inspectStatus.limit)
                       background.broadcastMessage({msg: msg.BROADCAST_INSPECT_USAGE, data: inspectStatus.limit - inspectStatus.usage});
                    break;
                    
                case msg.BACKGROUND_GET_TOKEN:
                    response = {msg: msg.TOKEN, token: storage.get(namespace.NAMESPACE_CONFIG, 'token')};
                    break;
                    
                case msg.BACKGROUND_SET_TOKEN:
                    storage.add(namespace.NAMESPACE_CONFIG, 'token', request.token);
                    background.broadcastMessage({msg: msg.BROADCAST_TOKEN, data: request.token});
                    break;
                    
                case msg.BACKGROUND_REVOKE_TOKEN:
                    storage.remove(namespace.NAMESPACE_CONFIG, 'token');
                    background.broadcastMessage({msg: msg.BROADCAST_REVOKE_TOKEN});
                    break;
            }
            
            if(response != null) {
               response.requestid = request.requestid;
               port.postMessage(response);
            }
        },

        handleConnect: function(port) {
            var index = background.connections.indexOf(port);
            if(index > -1)
               background.connections.splice(index, 1);
                
            background.connections.push(port);

            port.onMessage.addListener(background.handleMessage);
            port.onDisconnect.addListener(background.handleDisconnect);
        },

        handleDisconnect: function(port) {
            console.log("Disconnected: " + port.name);
            var index = background.connections.indexOf(port);
            if(index > -1)
               background.connections.splice(index, 1);
            
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
