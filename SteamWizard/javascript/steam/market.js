"using strict";

function createSteamButton(text){
    var $output = $("<div></div>");
    $output.addClass('btn_green_white_innerfade btn_small steam_wizard_load_button');
    $output.text(text);
    return $output;
}

function getInspectLink($marketListingRow){
    $marketListingRow.find(".market_actionmenu_button")[0].click();
    var inspectLink =  $('#market_action_popup_itemactions').find('a').attr("href");
    $("#market_action_popup").css('display','none');
    return inspectLink;
}

function onGetFloat(){
    var $marketListingRow = this;
    var inspectLink = getInspectLink($marketListingRow);
    
    var $getFloatButton = $marketListingRow.find(".steam_wizard_load_button_float").first();
    $getFloatButton.off();
    $getFloatButton.text('loading...').addClass('btn_grey_white_innerfade');

    $.ajax({type: "POST", 
            url: "https://www.csgozone.net/_service/plugin", 
            data: "type=marketInspect&link="+ encodeURIComponent(inspectLink),
            xhrFields: {withCredentials: true}})
        .done(function(data) {
            if(data.success === false) {
               $getFloatButton.text('Failed').addClass('steam_wizard_load_button_failed');
               $getFloatButton.on();
               return;
            }
            
            $getFloatButton.text(data.wear.toFixed(15));
            $getFloatButton.removeClass('btn_grey_white_innerfade').addClass('btn_blue_white_innerfade');
        }).fail(function(jqXHR, textStatus, errorThrown) { 
            $getFloatButton.on();
        }).always(function() {         
            
        });
    console.log('getting float using inspect link: ' + inspectLink);
}

function onGetAllFloats(){
    $('.steam_wizard_load_button_float').each(function(index, value){
        value.click();
    });
}


function removeOverlay(){
	$(".steam_wizard_screen_overlay").hide();
}

function showScreenshotPopup(image_url){
	$(".steam_wizard_screen_overlay").show().find('img').attr('src', image_url);
}

function onGetScreenshot(){
	var $marketListingRow = this;
	var inspectLink = getInspectLink($marketListingRow);
	
	var $getScreenshotButton = $marketListingRow.find(".steam_wizard_load_button_screenshot").first();
	$getScreenshotButton.off();
	$getScreenshotButton.text('loading...');
	
	Screenshots.requestScreenshot(inspectLink, function(result){
		if (result.success) {
			if(result.result.status == Screenshots.STATUS_QUEUE){
				$getScreenshotButton.text('Queue: ' + result.result.place_in_queue);
			}else if (result.result.status == Screenshots.STATUS_DONE){
				$getScreenshotButton.text('Open Screenshot');

				$getScreenshotButton.click(function(){
					showScreenshotPopup(result.result.image_url);
				});
				
				$getScreenshotButton[0].click();
			}else{
				$getScreenshotButton.text('FAILED');
			}
		} else {
			$getScreenshotButton.text('FAILED');
		}
	});
}

function init(){
	console.log('init()');
	$("#searchResultsRows").find(".market_listing_row").each(function(index, marketListingRow){
		var $marketListingRow = $(marketListingRow);
		
		//button which gets float
		var $getFloatButton = createSteamButton("Get Float");
		$getFloatButton.click(onGetFloat.bind($marketListingRow));
		$getFloatButton.addClass('steam_wizard_load_button_float');
		$marketListingRow.find(".market_listing_item_name").after($getFloatButton);
		
		//button which gets screenshot
		var $getScreenshotButton = createSteamButton("Get Screen");
		$getScreenshotButton.click(onGetScreenshot.bind($marketListingRow));
		$getScreenshotButton.addClass('steam_wizard_load_button_screenshot');
		$getFloatButton.after($getScreenshotButton);
	});
	
	//button to load all floats
	if ($("#searchResultsRows").find(".market_listing_row").length > 0) {
		var $getAllFloatsButton = createSteamButton("Load All Floats");
                $getAllFloatsButton.addClass('steam_wizard_load_button_float_all')
		$getAllFloatsButton.css({'padding-top':'0px','padding-bottom':'0px'});
		$getAllFloatsButton.click(onGetAllFloats);
		 
		var $container = $(".market_listing_header_namespacer").parent();
		$container.empty();
		$container.append($getAllFloatsButton)
	}
	
        /* build sceenshot overlay */
        var $overlay = $('<div>');
	$('<img>').appendTo($overlay);
        
	var $overlayContainer = $('<div>');
        $overlayContainer.addClass('steam_wizard_screen_overlay');
	$overlayContainer.append($overlay);
	$overlayContainer.click(removeOverlay);
        $overlayContainer.hide();
        
	$('body').append($overlayContainer);
        
	//remove overlay on escape
	$(document).keyup(function(e) {
            if(e.keyCode === 27)
               removeOverlay();
	});
}

$(document).ready(function(){
	init();
});