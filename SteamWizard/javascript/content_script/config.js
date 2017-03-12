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

var STEAMWIZARD_VERSION = "1.0.1";

require.config({
    baseUrl: "/javascript",
    waitSeconds : 60,
    urlArgs: STEAMWIZARD_VERSION
});

require.load = function () {
    
};