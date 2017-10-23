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

define(function() {
    var constants = {};
    
    constants.STORAGE_VERSION = "2.0";
    
    constants.namespace = {
        NAMESPACE_CONFIG: "config",
        NAMESPACE_INSPECT: "inspect",
        NAMESPACE_SCREENSHOT: "screenshot"
    };
    
    constants.msg = {
        BACKGROUND_GET_ITEMINFO           : 100,
        BACKGROUND_GET_SCREENSHOT         : 101,
        BACKGROUND_GET_PLUGIN_STATUS      : 102,
        BACKGROUND_GET_OPTIONS            : 103,
        BACKGROUND_SET_OPTIONS            : 104,
        BACKGROUND_GET_RESOURCE           : 105,
        BACKGROUND_ADD_TRADEUPITEM        : 106,

        ITEMINFO         : 200,
        SCREENSHOT       : 201,
        PLUGIN_STATUS    : 202,
        PLUGIN_OPTIONS   : 203,
        ADVERT           : 208,
        RESOURCE_SUCCESS : 209,
        RESOURCE_FAILED  : 210,
        ADD_TRADEUPITEM_RESPONSE : 211,

        /* services status */
        BROADCAST_PLUGIN_STATUS     : 302,
        BROADCASE_PLUTIN_OPTIONS    : 303
    };
    
    return constants;
});
