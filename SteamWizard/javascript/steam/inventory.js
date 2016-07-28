"using strict";


function onGetFloat(){
        if(!steamwizard.isLoggedIn()) {
            ui.showLoginOverlay();
            return;
        }

	var $itemActions = $(this.closest('.item_actions'));
	var inspectLink = $itemActions.find('a').first().attr('href');
	
	$getFloatButton = $itemActions.find(".steam_wizard_get_float_button").first();
	$getFloatButton.off();
        $getFloatButton.find('span').text('loading...');
	
	steamwizard.getFloatValue(inspectLink, function(result){
		if (result.status == steamwizard.EVENT_STATUS_DONE){
			$getFloatButton.find('span').text(result.data.wear);
		}else if (result.status == steamwizard.EVENT_STATUS_FAIL){
			$getFloatButton.find('span').text('Failed');
			$getFloatButton.click(onGetFloat);
		}
	});
}
function onGetScreenshot(){
        if(!steamwizard.isLoggedIn()) {
            ui.showLoginOverlay();
            return;
        }
        
	var $itemActions = $(this.closest('.item_actions'));
	var inspectLink = $itemActions.find('a').first().attr('href');
	
	var $getScreenshotButton = $itemActions.find(".steam_wizard_get_screen_button").first();
	$getScreenshotButton.off();
	$getScreenshotButton.find('span').text('loading...');
	
	steamwizard.getScreenshot(inspectLink, function(result){
		if (result.status == steamwizard.EVENT_STATUS_PROGRESS){
			$getScreenshotButton.find('span').text(result.msg);
		}else if (result.status == steamwizard.EVENT_STATUS_DONE){
			$getScreenshotButton.find('span').text('Open Screenshot');
			$getScreenshotButton.click(function(){ui.showScreenshotOverlay(result.image_url);});
			$getScreenshotButton[0].click();
		}else if (result.status == steamwizard.EVENT_STATUS_FAIL){
			$getScreenshotButton.find('span').text(result.msg);
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
	$inspectButton = $itemActions.find("a[href^='steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20']");
	var inspectLink = $inspectButton.attr('href');
	
	if (inspectLink){
		var $getFloatButton = createButton('Get Float').addClass('steam_wizard_get_float_button steam_wizard');
		var $getScreenButton = createButton('Get Screenshot').addClass('steam_wizard_get_screen_button steam_wizard');
		
		$getScreenButton.click(onGetScreenshot);
		$getFloatButton.click(onGetFloat);
		
		$inspectButton.after($getFloatButton);
		$inspectButton.after($getScreenButton);
	}
};

var addImgChangeListener = function(selector, callback){
	var $target = $(selector);
	var observer = new MutationObserver(function(mutations) {
		if($target.find(".steam_wizard").length == 0)
			callback($target);
	});
	observer.observe($target[0] , { childList : true});
}

function init(){
	console.log('init');
	addImgChangeListener("#iteminfo0_item_actions", onIteminfoVisible);
	addImgChangeListener("#iteminfo1_item_actions", onIteminfoVisible);
            
        ui.buildScreenshotOverlay();
        ui.buildLoginOverlay(function(e) {
        ui.removeOverlay();
        
        /* TODO: LOADING INDICATION */
        steamwizard.login(function() {
        });
    });

}

$(document).ready(function(){
        
    /* TODO: LOADING INDICATION */
    steamwizard.ready(function() {
        init();
    });
});