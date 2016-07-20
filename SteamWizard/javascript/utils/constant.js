

/* storage name spaces */
var namespace = {
    NAMESPACE_CONFIG: "config",
    NAMESPACE_SCREENSHOT: "screenshot",
    NAMESPACE_MARKET_INSPECT: "marketinspect",    
};

/***********************/
/* background messages */
/***********************/
var msg = {
    BACKGROUND_DO_LOGIN               : 100,
    BACKGROUND_GET_PLUGIN_STATUS      : 101,
    BACKGROUND_GET_STORAGE            : 102,
    BACKGROUND_GET_ITEM               : 103,
    BACKGROUND_SET_ITEM               : 104,
    BACKGROUND_GET_TOKEN              : 105,
    BACKGROUND_SET_TOKEN              : 106,
    BACKGROUND_REVOKE_TOKEN           : 107,
    BACKGROUND_SET_INSPECT_STATUS     : 108,
    BACKGROUND_SET_SCREENSHOT_STATUS  : 109,
    BACKGROUND_INCREASE_INSPECT_USAGE : 110,
    
    LOGIN_SUCCESS : 201,
    LOGIN_FAILED  : 202,
    PLUGIN_STATUS : 203,
    STORAGE       : 204,
    ITEM          : 205,
    TOKEN         : 206,
    USERNAME      : 207,
    
    /* services status */
    BROADCAST_ITEM              : 300,
    BROADCAST_TOKEN             : 301,
    BROADCAST_REVOKE_TOKEN      : 302,
    BROADCAST_INSPECT_STATUS    : 303,
    BROADCAST_SCREENSHOT_STATUS : 304,
    BROADCAST_INSPECT_USAGE     : 305,
};