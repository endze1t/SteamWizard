/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author Ahmed
 * Apr 7, 2017
 *
 */

define("port", ["util/constants"], function(constants) {
    "use strict";
    
    /* port to backend */
    var port = chrome.runtime.connect({name: 'loader'});
        
    /* backgroudn listener */
    var localListener = function(response, port) {
        var request = requests[response.requestid];
        
        if(request) {
            if(request.onload)
               request.onload(response);
   
            delete requests[response.requestid];
        }
    };
    port.onMessage.addListener(localListener);
    
    var requests = {};
    
    var requestid = 0;

    return {
        postMessage: function(request, onload) {
            request.requestid = requestid;
            port.postMessage(request);
            
            requests[requestid] = {
                onload: onload
            }
            
            requestid++;
        },
        
        /**
         * NAME FORMAT
         * -----------
         * 
         * MSGID, KEY: VALUE, ....
         * 
         * MSGID must be defined in constants.msg
         *  
         **/
        load: function(name, parentRequire, onload, config) {
            var split = name.split(",");
            
            var request = {
                msg: constants.msg[split[0].trim()],
                requestid: requestid
            };
            
            /* more parameters in form of KEY : VALUE */
            for(var i=1; i < split.length; i++) {
                var s = split[i].split(":");
                request[s[0].trim()] = s[1].trim();
            }
            
            port.postMessage(request);
            
            requests[requestid] = {
                onload: onload
            }
            
            requestid++;
        },
    };
});