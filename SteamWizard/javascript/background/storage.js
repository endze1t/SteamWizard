/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author Ahmed
 * Mar 11, 2017
 *
 */

define(["util/constants"], function(constants) {
    var sizes = {};
    var store = {};
    var limit = {};

    limit[constants.namespace.NAMESPACE_SCREENSHOT] = 100;
    limit[constants.namespace.NAMESPACE_MARKET_INSPECT] = 1000;

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
});