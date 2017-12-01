/**
 *
 * @author Ahmed
 * Mar 11, 2017
 *
 */

require.config({
    baseUrl: "/js",
    waitSeconds : 60,
    paths: {
            "text": "lib/require.text",
            "port": "async/port",
        "csgozone": "core/csgozone"
    }
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