/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author Ahmed
 * April 7, 2017
 *
 */

define("async/xhr", function() {
    "use strict";

    return {
        GET: function(url, onload, onerror) {
            var xhr = new XMLHttpRequest();
            
            xhr.open('GET', url, true);
            
            xhr.onload = function() {
                if(onload)
                   onload(JSON.parse(xhr.responseText));
            };
            xhr.onerror = function() {
                if(onerror)
                   onerror();
            };

            xhr.send();
        },
        
        POST: function(url, content, onload, onerror) {
            var xhr = new XMLHttpRequest();
            
            xhr.open('POST', url, true);
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            
            xhr.onload = function() {
                if(onload)
                   onload(JSON.parse(xhr.responseText));
            };
            xhr.onerror = function() {
                if(onerror)
                   onerror();
            };
            
            if(content != null)
               xhr.send(content);
            else
               xhr.send();
        }
    }
});