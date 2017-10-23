/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

require.config({
    baseUrl: "../javascript",
    waitSeconds : 60,
    paths: {
            "text": "lib/require.text",
            "port": "async/port",
        "csgozone": "core/csgozone"
    },
});


/*http://stackoverflow.com/a/18405800*/
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}