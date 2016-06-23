var turnedOff = window.localStorage.getItem('steam_wizard_enabled');

function updateIcon(){
	if(!turnedOff){
		chrome.browserAction.setIcon({path: "images/icon_128.png"});
	} else{
		chrome.browserAction.setIcon({path: "images/icon_128_off.png"});
	}
}

chrome.browserAction.onClicked.addListener(function(tab) {
	turnedOff = !turnedOff;
	window.localStorage.setItem('steam_wizard_enabled', turnedOff);
	updateIcon();
});

updateIcon();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.msg == "getTurnedOff")
		sendResponse({turnedOff:turnedOff});
});