/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


define(["background/storage", "util/common", "util/constants"], function(storage, util, constants) {
    "use strict";
    
    var NAMESPACE_INSPECT = constants.namespace.NAMESPACE_INSPECT;
    var NAMESPACE_SCREENSHOT = constants.namespace.NAMESPACE_SCREENSHOT;
    
    var steamwizard = {
        PLUGIN_API_URL     : 'https://www.steamwizard.net',
        INSPECT_REQUEST    : '/inspect',
        
        getItemInfo: function(inspectLink, callback) {
            var url = steamwizard.PLUGIN_API_URL + steamwizard.INSPECT_REQUEST;
            var data = 'link=' + encodeURIComponent(inspectLink);
            var assetid = util.getAssetID(inspectLink);
                    
            $.ajax({type: "POST", url: url, data: data})
                .done(function (data) {
                    if(data.success && data[assetid]) {
                       callback({success: true, iteminfo: data[assetid]});
                    } else
                       callback({success: false, error: 'Failed to load item info'});
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    callback({success: false, error: textStatus});
                });
        },
        
        getAllItemInfo: function(inspectLinks, callback) {
            var url = steamwizard.PLUGIN_API_URL + steamwizard.INSPECT_REQUEST;
            var data = '';
            for(var i=0; i < inspectLinks.length; i++)
                data += 'link=' + encodeURIComponent(inspectLinks[i]) + '&';
                        
            $.ajax({type: "POST", url: url, data: data})
                .done(function (data) {
                    callback(data);
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    callback({success: false, error: textStatus});
                });
        }
    };
    
    var csgozone = {
        PLUGIN_API_URL         : 'https://www.csgozone.net/_service/plugin',
        RESOURCE_REQUEST       : 'type={0}'
    };
    
    var batcher = {
        jobs: [],
        
        interval: null,
        
        queue: function(inspectLink, callback) {
            var assetid = util.getAssetID(inspectLink);
            this.jobs.push({assetid: assetid, inspect: inspectLink, callback: callback});
        },
        
        process: function() {
            if(this.jobs.length === 0)
                return;
            
            var inspect = [];
            var callbacks = {};
            
            while(this.jobs.length > 0) {
                var job = this.jobs.pop();
                inspect.push(job.inspect);
                callbacks[job.assetid] = job.callback;
            }
            
            steamwizard.getAllItemInfo(inspect, function(data) {
                for(var i in callbacks) {
                    if(data[i]) {
                        storage.set(NAMESPACE_INSPECT, i, data[i]);
                        callbacks[i]({success: true, iteminfo: data[i]});
                    } else {
                        callbacks[i]({success: false});
                    }
                }
            });
        },
        
        start: function() {
            if(this.interval)
                clearInterval(this.interval);
            
            this.interval = setInterval(function() {
                batcher.process();
            }, 200);
        }
    };
    
    var resourceCache = {
        cache: {},
        
        expired: function(name) {
            return this.cache[name].timestamp < Date.now() - 2 * 60 * 60 * 1000;
        },
        
        get: function(name) {
            if(!this.cache[name] || resourceCache.expired(name))
                return null;
            
            return this.cache[name].data;
        },
        
        set: function(name, data) {
            this.cache[name] = {data: data, timestamp: Date.now()};
        }
    };
    
    var engine = {
        getInspect: function(inspectLink, force, callback, batch) {
            var assetid = util.getAssetID(inspectLink);
            
            var cached = storage.get(NAMESPACE_INSPECT, assetid);
            
            if(cached)
               callback({success: true, iteminfo: cached});
            else if(force) {
                if(batch === false)
                    steamwizard.getItemInfo(inspectLink, callback);
                else
                    batcher.queue(inspectLink, callback);
            } else
                callback({success: false});
        },
        
        getScreenshot: function(inspectLink, force, callback) {
            
        },
        
        getResource: function(name, url, content, callback) {
            var cached = resourceCache.get(name);
            
            if (cached)
                callback({success: true, resource: cached});
            else
                $.ajax({type: "POST", url: url, data: content})
                    .done(function (data) {
                        resourceCache.set(name, data);
                        callback({success: true, resource: data});
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        callback({success: false, textStatus: textStatus, errorThrown: errorThrown});
                    });
        },
        
        getCSGOZONEResource: function(name, callback) {
            engine.getResource(name, csgozone.PLUGIN_API_URL, csgozone.RESOURCE_REQUEST.format(name), callback);
        },
        
        load: function() {
            
        }
    };
    
    /* run the batcher processor */
    batcher.start();
    
    return engine;
});