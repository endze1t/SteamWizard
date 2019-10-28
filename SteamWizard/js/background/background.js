/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

require(["background/data", "background/options", "util/constants"], function(data, options, constants) {
    var connections = [];
    
    var MSG = constants.msg;
 
    var updateIcon = function(enabled) {
        //var icon = enabled ? "images/icon_128.png" : "images/icon_128_off.png";
        //chrome.browserAction.setIcon({path: icon});
    };

//    var notificationOptions = {
//        type: 'basic',
//        iconUrl: 'images/logo_192.png', 
//        title: 'hello',
//        message: 'world',
//    };
//    
//    chrome.notifications.create(notificationOptions, function () {
//        console.log(arguments);
//    });

    var windowPort = function(html, width, height) {
        var This = this;
        
        This.tab = null;

        function createWindow(callback) {
            chrome.windows.create({
                url: chrome.runtime.getURL(html),
                type: "popup",
                width: width,
                height: height
            }, function(window) {
                This.tab = window.tabs[0];
                callback();
            });
        }
        
        this.sendMessage = function(msg, callback) {
            var attempts = 0;

            function trySend() {
                if(attempts++ >= 100) {
                    if(callback)
                        callback({success: false});
                    return;
                }

                /* make sure the window exist */
                if(This.tab === null) {
                    createWindow(trySend);
                    return;
                }

                chrome.tabs.get(This.tab.id, function(tab) {
                    /* if window is closed */
                    if(chrome.runtime.lastError) {
                        createWindow(trySend);
                    } else {
                        chrome.tabs.sendMessage(This.tab.id, msg, function(response) {
                            if(chrome.runtime.lastError) {
                                console.log(chrome.runtime.lastError);
                                setTimeout(trySend, attempts * 2);
                            } else {
                                chrome.windows.update(This.tab.windowId, {focused: true});
                                if(callback) {
                                    callback(response);
                                }
                            }
                        });
                    }
                });
            };

            trySend();
        };
    }
    
    var tradeupPort = (function() {
        var port = new windowPort("html/background/tradeup.html", 1300, 900);

        return {
            add: function(item, callback) {
                port.sendMessage(item, callback);
            }
        };
    })();
    
    var screenshotPort = (function() {
        var port = new windowPort("html/background/screenshot.html", 1200, 800);

        return {
            open: function(inspect) {
                port.sendMessage(inspect);
            }
        };
    })();
    
    function appendType(callback, onsuccess, onfailure) {
        return function(response) {
            if(response.success)
               response.type = onsuccess;
            else if(onfailure)
               response.type = onfailure;
            
            callback(response);
        };
    };
    
    var background = {
        handleMessage: function(msg, sender, callback) {            
            switch(msg.type) {
                case MSG.BACKGROUND_GET_ITEMINFO:
                    data.getInspect(msg.inspect, msg.force, appendType(callback, MSG.ITEMINFO), msg.batch);
                    break;
                case MSG.BACKGROUND_GET_SCREENSHOT:
                    screenshotPort.open(msg.item);
                    break;
                case MSG.BACKGROUND_GET_RESOURCE:
                    data.getResource(msg.name, msg.url, msg.content, appendType(callback, MSG.RESOURCE_SUCCESS, MSG.RESOURCE_FAILED));
                    break;
                case MSG.BACKGROUND_GET_PLUGIN_STATUS:
                    callback({type: MSG.PLUGIN_STATUS, data: {status: options.enabled, version: options.version}});
                    break;
                case MSG.BACKGROUND_GET_OPTIONS:
                    callback({type: MSG.PLUGIN_OPTIONS, data: options.get()});
                    break;
                case MSG.BACKGROUND_SET_OPTIONS:
                    options.set(msg.field, msg.value);
                    background.broadcastMessage({type: MSG.BROADCAST_PLUGIN_OPTIONS, data: options.get()});
                    break;
                case MSG.BACKGROUND_ADD_TRADEUPITEM:
                    tradeupPort.add(msg.item, appendType(callback, MSG.ADD_TRADEUPITEM_RESPONSE));
                    break;
            }
            
            if(callback)
               return true;
        },
        
        handlePortMessage: function(request, port) {
            background.handleMessage(request, function(response) {
                port.postMessage(response);
            });
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
//            pluginEnabled = !pluginEnabled;
//            updateIcon(pluginEnabled);
//            window.localStorage.setItem('steam_wizard_enabled', pluginEnabled);
//
//            background.broadcastMessage({msg: constants.msg.PLUGIN_STATUS, status : pluginEnabled});
        },
        
        broadcastMessage: function(msg, exclude) {
            for(var i=0; i < connections.length; i++) {
                if(connections[i] === exclude)
                   continue;
           
                connections[i].postMessage(msg);
            }
        }
    };
    
    (function() {
//        pluginEnabled = window.localStorage.getItem('steam_wizard_enabled') === null ? true : window.localStorage.getItem('steam_wizard_enabled');
//        updateIcon(pluginEnabled);
        
        chrome.runtime.onConnect.addListener(background.handleConnect);
        chrome.runtime.onMessage.addListener(background.handleMessage);
        
        chrome.browserAction.onClicked.addListener(background.handleIconClick);
    })();
});
