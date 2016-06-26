"using strict";

var STEAM_WIZARD_CONFIG = {
    pagingInterval: null,
    enabled: true,
	changeListeners : [],
    token: null,
};

EVENT_STATUS_PROGRESS = 1;
EVENT_STATUS_DONE = 2;
EVENT_STATUS_FAIL = 3;

/**************************************
************* OVERLAY *****************
**************************************/
function removeOverlay() {
	$(".steam_wizard_screen_overlay").hide();
	$(".steam_wizard_login_overlay").hide();
}

function showScreenshotOverlay(image_url) {
	$(".steam_wizard_screen_overlay").show().find('img').attr('src', image_url);
}

function buildScreenshotOverlay(){
    var $overlay = $('<div>');
    $('<img>').appendTo($overlay);

    var $overlayContainer = $('<div>');
    $overlayContainer.addClass('steam_wizard_screen_overlay');
    $overlayContainer.append($overlay);
    $overlayContainer.click(removeOverlay);
    $overlayContainer.hide();

    $('body').append($overlayContainer);
}

function buildLoginOverlay(){
    var $overlay = $('<div>');
	var $loginPopup = $('<div>');
		$loginPopup.appendTo($overlay);
	$loginPopup.addClass('steam_wizard_login_popup');
	$loginPopup.append($('<p>').text('This plugin relies on services from CS:GO Zone and Metjm, please login to either'));
	$loginPopup.append($("<a target='_blank' href='https://metjm.net/csgo/'></a>").append($('<div>').css('background-image','url(' + chrome.extension.getURL("images/logo_metjm.png") + ')')));
	$loginPopup.append($("<a target='_blank' href='https://www.csgozone.net/'></a>").append($('<div>').css('background-image','url(' + chrome.extension.getURL("images/logo_csgozone.png") + ')')));
        
	var button = createSteamButton('Ok, I\'m logged in');
	button.addClass('steam_wizard_login_button');
	button.click(function(e) {
		removeButtons();
		removeOverlay();
		/* TODO: LOADING INDICATION */
		$.when(csgozone.login(loginCallback), metjm.login(loginCallback)).then(function(){
			spreadToken();
			alertChangeListeners();
		});
	});

	$loginPopup.append(button);
	$loginPopup.click(function(e){
            e.stopPropagation();
	});
	
	var $loginOverlayContainer = $('<div>');
	$loginOverlayContainer.addClass('steam_wizard_login_overlay');
	$loginOverlayContainer.append($overlay);
	$loginOverlayContainer.click(removeOverlay);
	$loginOverlayContainer.hide();

    $('body').append($loginOverlayContainer);
}
/**************************************
*************** UTIL ******************
**************************************/
function createSteamButton(text) {
    var $output = $("<div></div>");
    $output.addClass('btn_green_white_innerfade btn_small steam_wizard_load_button');
    $output.text(text);
    return $output;
}

/**************************************
************** TOKEN ******************
**************************************/
function deleteFaultyToken(data){
	if(data.bad_token) {
		STEAM_WIZARD_CONFIG.token = null;
		window.localStorage.removeItem('steam_wizard_token');
   }
}
function checkNoToken(){
	if(STEAM_WIZARD_CONFIG.token == null) {
       $(".steam_wizard_login_overlay").show();
       return true;
    }
	return false;
}

function validateToken(token) {
    if(token == null)
       return false;
   
    try {
        var json = JSON.parse(atob(token));
    } catch(e) {
        return false;
    }
    
    if(json.timestamp == null || new Date().getTime() - json.timestamp > 2 * 24 * 60 * 60 * 1000)
       return false;
    
    return true;
}

function loginCallback(response) {
    if(response.success === true) {
       STEAM_WIZARD_CONFIG.token = response.token;
       window.localStorage.setItem('steam_wizard_token', response.token);
    }
}

function spreadToken(){
	/* make sure both services are enabled */
    if(STEAM_WIZARD_CONFIG.token !== null) {
       csgozone.setToken(STEAM_WIZARD_CONFIG.token);
       metjm.setToken(STEAM_WIZARD_CONFIG.token);
    }
}

/**************************************
************** FLOATS *****************
**************************************/
function onGetFloatButtonClick(inspectLink, callback) {
    csgozone.market(inspectLink, function(data) {
        if(data.success === true) {
			callback({status:EVENT_STATUS_DONE , floatvalue:data.wear.toFixed(15)});
        } else {
           callback({status:EVENT_STATUS_FAIL , msg:'Failed'});
           deleteFaultyToken(data);
        }
    });
}

/**************************************
************ SCREENSHOTS **************
**************************************/
function onGetScreenshotButtonClick(inspectLink, callback){
	metjm.requestScreenshot(inspectLink, function(result){
		if (result.success) {
			if(result.result.status == metjm.STATUS_QUEUE){
				callback({status:EVENT_STATUS_PROGRESS , msg: 'Queue: ' + result.result.place_in_queue});
			}else if (result.result.status == metjm.STATUS_DONE){
				callback({status:EVENT_STATUS_DONE , image_url: result.result.image_url});
			}else{
				callback({status:EVENT_STATUS_FAIL , msg:'Failed'});
			}
		} else {
			callback({status:EVENT_STATUS_FAIL , msg:'Failed'});
			deleteFaultyToken(result);
		}
	});
}

/**************************************
*************** INIT ******************
**************************************/
function alertChangeListeners(){
	for(var i = 0;i<STEAM_WIZARD_CONFIG.changeListeners.length;i++){
		STEAM_WIZARD_CONFIG.changeListeners[i](STEAM_WIZARD_CONFIG.enabled)
	}
}

function eventsInit() {
    /* make sure both services are enabled */
    spreadToken();
	
	buildScreenshotOverlay();
	buildLoginOverlay();
    
    var port = chrome.runtime.connect();
    port.onMessage.addListener(function(request, port) {
        switch(request.msg) {
            case 'pluginStatus':
                STEAM_WIZARD_CONFIG.enabled = request.status;
				alertChangeListeners();
				break;
        }
    });
    port.postMessage({msg: 'getPluginStatus'});
  
    //remove overlay on escape
    $(document).keyup(function(e) {
        if(e.keyCode === 27)
           removeOverlay();
    });
}

function eventsInit_(){
	var token = window.localStorage.getItem('steam_wizard_token');
    
    if(validateToken(token))
       STEAM_WIZARD_CONFIG.token = token;
    else
       window.localStorage.removeItem('steam_wizard_token');
   
    /* TODO: LOADING INDICATION */
    if(STEAM_WIZARD_CONFIG.token === null) {
       $.when(csgozone.login(loginCallback), metjm.login(loginCallback)).then(eventsInit);
    } else
        eventsInit();
}