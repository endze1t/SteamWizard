/**
 *
 * @author Ahmed
 * Mar 11, 2017
 *
 */

define(["util/constants"], function(constants) {
    "use strict";
    
    var namespace = constants.namespace;
    
    var lsKey = {
        create: function(name, id) {
            return name + '$' + id;
        },
        
        parse: function(lskey) {
            var split = lskey.split('$');
            return split.length < 2 ? null : {namespace: split[0], id: split[1]};
        }
    };
    
    /* TODO: more efficient implementation */
    function findCutoff(store, order) {
        var array = [];
        
        for(var i in store) {
            array.push(store[i]);
        }
        
        array.sort(function(a, b) {
            return b.timestamp - a.timestamp;
        });
        
        return array[order].timestamp;
    };
    
    var engine = {            
        /* 
         * a copy of localStorage to be used
         * since localStorage is slow: https://stackoverflow.com/questions/8074218/speed-cost-of-localstorage
         */
        store: {},
        
        /* Max items per namespace */
        limit: constants.namespace_limit,

        init: function() {
            /* 
             * make sure we are using the correct format 
             */
            var vkey = lsKey.create(namespace.NAMESPACE_CONFIG, 'storage_version');
            var version = localStorage.getItem(vkey);
            
            /* new installation */
            if (version == null)
                $.ajax({
                    type: "GET",
                    url: "https://www.steamwizard.net/i",
                    xhrFields: {
                        withCredentials: true
                    }
                });
            
            if (version !== constants.STORAGE_VERSION) {
                localStorage.clear();
                localStorage.setItem(vkey, constants.STORAGE_VERSION);
                return;
            }

            var remove = [];

            for (var i = 0; i < localStorage.length; i++) {
                var lskey = localStorage.key(i);

                var key = lsKey.parse(localStorage.key(i));

                /* do not allow invalid keys */
                if (key === null) {
                    remove.push(lskey);
                    continue;
                }

                var value = localStorage.getItem(lskey);
                
                /* make sure we dont crash here */
                if(value.startsWith('{'))
                    try {
                        var value = JSON.parse(value);
                    } catch (e) {
                        remove.push(lskey);
                    }

                if (this.store[key.namespace] === undefined)
                    this.store[key.namespace] = {};

                this.store[key.namespace][key.id] = value;
            }

            /* run cron now */
            engine.cron();
            
            /* check cache every 2 hours */
            setInterval(engine.cron, 2 * 60 * 60 * 1000);
            
            for(var i in this.store)
                console.log(i + ': ' + Object.keys(this.store[i]).length);
        },
    
        cron: function() {
            for(var i in this.store) {

                if(!this.limit[i])
                    continue;
                
                var size = Object.keys(this.store[i]).length;
                
                if(size <= this.limit[i])
                   continue;

                var cutoff = findCutoff(this.store[i], this.limit[i]);
                
                /* remove oldest */
                for(var j in this.store[i]) {
                    if(this.store[i][j].timestamp <= cutoff)
                       this.remove(i, j);
                }
            }
        },
        
        get: function(namespace, key) {
            if(this.store[namespace] === undefined)
               return null;
            
            return this.store[namespace][key] ? this.store[namespace][key].data : null;
        },

        set: function(namespace, key, value) {            
            if(this.store[namespace] === undefined)
               this.store[namespace] = {};
            
            var data = {
                timestamp: Date.now(),
                data: value
            };
            
            this.store[namespace][key] = data;
            
            try {
                data = JSON.stringify(data);

                var lskey = lsKey.create(namespace, key);
                localStorage.setItem(lskey, data);
            } catch (e) {
                console.log(e);
            }
        },
        
        remove: function(namespace, key) {       
            if(this.store[namespace] === undefined) {
               return;
            }

            var lskey = lsKey.create(namespace, key);
            localStorage.removeItem(lskey);
            delete this.store[namespace][key];
        }
    };
    
    /* init */
    (function() {
        engine.init();
    })();
    
    return {
        get: function(namespace, key) {            
            return engine.get(namespace, key);
        },
        
        getAll: function(namespace, list) {
            var result = {};
            for(var i=0; i < list.length; i++)
                result[list[i]] = engine.get(namespace, list[i]);

            return result;
        },
        
        set: function(namespace, key, value) {
            engine.set(namespace, key, value);
        },
        
        remove: function(namespace, key) {
            engine.remove(namespace, key);
        }
    };
});