require(["background/storage", "util/constants"], function(storage, constants) {
    var inspectStatus = {
        usage: 0
    };
    var timeout;

    function updateStatus(data) {
        inspectStatus = data;
//        clearTimeout(timeout);
//        timeout = setTimeout(function() {
//            /* TODO .. HOW ? */
//        }, data.reset);
    }

    var screenshotStatus = {
        user_has_premium : 0
    };
    
    function updateScreenshotStatus(data){
            screenshotStatus = data;
    }

    var connections = [], pluginEnabled = null;
        
    var updateIcon = function(enabled) {
        var icon = enabled ? "images/icon_128.png" : "images/icon_128_off.png";
        chrome.browserAction.setIcon({path: icon});
    };

    var background = {
        handleMessage: function(request, port) {
            var response;
            switch(request.msg) {                
                case constants.msg.BACKGROUND_DO_LOGIN:
                   $.ajax({type: "POST", url: request.PLUGIN_API_URL, data: request.LOGIN_REQUEST, xhrFields: {withCredentials: true}})
                    .done(function(data) {
                        port.postMessage({msg: constants.msg.LOGIN_SUCCESS, data: data, requestid : request.requestid});
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        port.postMessage({msg: constants.msg.LOGIN_FAILED, textStatus: textStatus, errorThrown: errorThrown, requestid : request.requestid});
                    });
                    break;
                    
                case constants.msg.BACKGROUND_GET_PLUGIN_STATUS:
                    response = {msg: constants.msg.PLUGIN_STATUS, status: pluginEnabled};
                    break;

                case constants.msg.BACKGROUND_GET_STORAGE:
                    response = {msg: constants.msg.STORAGE, namespace: request.namespace, value: storage.get(request.namespace)};
                    break;
                    
                case constants.msg.BACKGROUND_SET_ITEM:
                    storage.add(request.namespace, request.key, request.value);
                    /* notify all listening threads that a new item was added */
                    background.broadcastMessage({msg: constants.msg.BROADCAST_ITEM, namespace: request.namespace, key: request.key, value: request.value}, port);
                    break;
                    
                case constants.msg.BACKGROUND_SET_INSPECT_STATUS:
                    updateStatus(request.data);
                    background.broadcastMessage({msg: constants.msg.BROADCAST_INSPECT_STATUS, data: request.data});
                    break;
                    
		case constants.msg.BACKGROUND_SET_SCREENSHOT_STATUS:
                    updateScreenshotStatus(request.data);
                    background.broadcastMessage({msg: constants.msg.BROADCAST_SCREENSHOT_STATUS, data: request.data});
                    break;
                    
                case constants.msg.BACKGROUND_INCREASE_INSPECT_USAGE:
                    inspectStatus.usage += request.amount;
                    if(inspectStatus.limit)
                       background.broadcastMessage({msg: constants.msg.BROADCAST_INSPECT_USAGE, data: inspectStatus.limit - inspectStatus.usage});
                    break;
                    
                case constants.msg.BACKGROUND_GET_TOKEN:
                    response = {msg: constants.msg.TOKEN, token: storage.get(constants.namespace.NAMESPACE_CONFIG, 'token')};
                    break;
                    
                case constants.msg.BACKGROUND_SET_TOKEN:
                    storage.add(constants.namespace.NAMESPACE_CONFIG, 'token', request.token);
                    background.broadcastMessage({msg: constants.msg.BROADCAST_TOKEN, data: request.token});
                    break;
                    
                case constants.msg.BACKGROUND_REVOKE_TOKEN:
                    storage.remove(constants.namespace.NAMESPACE_CONFIG, 'token');
                    background.broadcastMessage({msg: constants.msg.BROADCAST_REVOKE_TOKEN});
                    break;
            }
            
            if(response != null) {
               response.requestid = request.requestid;
               port.postMessage(response);
            }
        },

        handleConnect: function(port) {
            var index = connections.indexOf(port);
            if(index > -1)
               connections.splice(index, 1);
                
            connections.push(port);

            port.onMessage.addListener(background.handleMessage);
            port.onDisconnect.addListener(background.handleDisconnect);
        },

        handleDisconnect: function(port) {
            var index = connections.indexOf(port);
            if(index > -1)
               connections.splice(index, 1);
        },

        handleIconClick: function(tab) {
            pluginEnabled = !pluginEnabled;
            updateIcon(pluginEnabled);
            window.localStorage.setItem('steam_wizard_enabled', pluginEnabled);

            background.broadcastMessage({msg: constants.msg.PLUGIN_STATUS, status : pluginEnabled});
            
            console.log("message sent");
        },
        
        broadcastMessage: function(msg, exclude) {
            for(var i=0; i < connections.length; i++) {
                if(connections[i] === exclude)
                   continue;
           
                connections[i].postMessage(msg);
            }
        },
    };
    
    (function() {
        pluginEnabled = window.localStorage.getItem('steam_wizard_enabled') === null ? true : window.localStorage.getItem('steam_wizard_enabled');
        updateIcon(pluginEnabled);
        chrome.browserAction.onClicked.addListener(background.handleIconClick);
        chrome.runtime.onConnect.addListener(background.handleConnect);
        storage.init();
    })();
});
