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
	var $itemActions = $(this.closest('.item_actions'));
	var inspectLink = $itemActions.find('a').first().attr('href');
	
	$getFloatButton = $itemActions.find(".steam_wizard_get_float_button").first();
	$getFloatButton.off();
    $getFloatButton.text('loading...');
	
	onGetFloatButtonClick(inspectLink, function(result){
		if (result.status == EVENT_STATUS_DONE){
			$getFloatButton.text(result.floatvalue);
		}else if (result.status == EVENT_STATUS_FAIL){
			$getFloatButton.text('Failed');
			$getFloatButton.click(onGetFloat);
		}
	});
}
function onGetScreenshot(){
	var $itemActions = $(this.closest('.item_actions'));
	var inspectLink = $itemActions.find('a').first().attr('href');
	
	var $getScreenshotButton = $itemActions.find(".steam_wizard_get_screen_button").first();
	$getScreenshotButton.off();
	$getScreenshotButton.text('loading...');
	
	onGetScreenshotButtonClick(inspectLink, function(result){
		if (result.status == EVENT_STATUS_PROGRESS){
			$getScreenshotButton.text(result.msg);
		}else if (result.status == EVENT_STATUS_DONE){
			$getScreenshotButton.text('Open Screenshot');
			$getScreenshotButton.click(function(){showScreenshotPopup(result.image_url);});
			$getScreenshotButton[0].click();
		}else if (result.status == EVENT_STATUS_FAIL){
			$getScreenshotButton.text(result.msg);
			$getScreenshotButton.click(onGetScreenshot);
		}
	});
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
		var $getFloatButton = createButton('Get Float').addClass('steam_wizard_get_float_button');
		var $getScreenButton = createButton('Get Screenshot').addClass('steam_wizard_get_screen_button');
		
		$getScreenButton.click(onGetScreenshot);
		$getFloatButton.click(onGetFloat);
		
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