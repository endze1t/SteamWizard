var background = {
    pluginEnabled: window.localStorage.getItem('steam_wizard_enabled'),
    connections: [],
    
    updateIcon: function(enabled) {
        var icon = enabled ? "images/icon_128.png" : "images/icon_128_off.png";
        chrome.browserAction.setIcon({path: icon});
    },

    handleMessage: function(request, port) {
        switch(request.msg) {
            case "getPluginStatus":
                 port.postMessage({msg: 'pluginStatus', status : background.pluginEnabled});
                 break;
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
        
        for(var i=0; i < background.connections.length; i++)
            background.connections[i].postMessage({msg: 'pluginStatus', status : background.pluginEnabled});
        
        console.log("message sent");
    }
}

background.updateIcon(background.pluginEnabled);
chrome.browserAction.onClicked.addListener(background.handleIconClick);
chrome.runtime.onConnect.addListener(background.handleConnect);