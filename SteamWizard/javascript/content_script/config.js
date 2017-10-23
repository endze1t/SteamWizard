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

require.config({
    baseUrl: "/javascript",
    waitSeconds : 60,
    
    paths: {
            "text": "lib/require.text",
            "port": "async/port",
        "csgozone": "core/csgozone"
    }
});

/* https://prezi.com/rodnyr5awftr/requirejs-in-chrome-extensions */
require.load = function (context, moduleName, url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", chrome.extension.getURL(url), true);
    xhr.onreadystatechange = function(e) {
        if(xhr.readyState === 4 && xhr.status === 200) {
            eval(xhr.responseText);
            context.completeLoad(moduleName);
        }
    };
    
    xhr.send();
};


/*http://stackoverflow.com/a/18405800*/
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}