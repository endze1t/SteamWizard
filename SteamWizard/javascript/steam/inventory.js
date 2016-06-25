"using strict";

var addImgChangeListener = function(selector, callback){
	var $target = $(selector);
	var observer = new MutationObserver(function(mutations) {
		if($target.find(".steam_wizard").length == 0)
			callback($target);
	});
	observer.observe($target[0] , { childList : true});
}

function onGetFloat(){
	//todo: fetch float
}
function onGetScreenshot(){
	//todo: fetch screenshot
}

function createButton(text){
	var $button = $("<a>").addClass('btn_small btn_grey_white_innerfade steam_wizard');
	var $span = $("<span>").text(text);
	return $button.append($span);
}

function onIteminfoVisible($itemActions){
	$inspectButton = $itemActions.find("a");
	var inspectLink = $inspectButton.attr('href');
	
	if (inspectLink){
		var $getFloatButton = createButton('Get Float');
		var $getScreenButton = createButton('Get Screenshot');
		
		$getScreenButton.click(onGetScreenshot);
		$getScreenButton.click(onGetFloat);
		
		$inspectButton.after($getFloatButton);
		$inspectButton.after($getScreenButton);
	}
};

function init(){
	console.log('init');
	addImgChangeListener("#iteminfo0_item_actions", onIteminfoVisible);
	addImgChangeListener("#iteminfo1_item_actions", onIteminfoVisible);
}

$(document).ready(function(){
	init();
});