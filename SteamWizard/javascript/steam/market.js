"using strict";

var STEAM_WIZARD_CONFIG = {
    pagingInterval: null,
    enabled: true
}
function createSteamButton(text) {
    var $output = $("<div></div>");
    $output.addClass('btn_green_white_innerfade btn_small steam_wizard_load_button');
    $output.text(text);
    return $output;
}

function getInspectLink($marketListingRow) {
    $marketListingRow.find(".market_actionmenu_button")[0].click();
    var inspectLink =  $('#market_action_popup_itemactions').find('a').attr("href");
    $("#market_action_popup").css('display','none');
    return inspectLink;
}

function onGetFloat() {
    var $marketListingRow = $(this.closest('.market_listing_row'));
    var inspectLink = getInspectLink($marketListingRow);
     
    var $getFloatButton = $marketListingRow.find(".steam_wizard_load_button_float").first();
    $getFloatButton.off();
    $getFloatButton.text('loading...').addClass('btn_grey_white_innerfade');

    csgozone.market(inspectLink, function(data) {
        if(data.success === true) {
           $getFloatButton.text(data.wear.toFixed(15));
           $getFloatButton.removeClass('btn_grey_white_innerfade').addClass('btn_blue_white_innerfade');
        } else {
           $getFloatButton.text('Failed').addClass('steam_wizard_load_button_failed');
           $getFloatButton.click(onGetFloat);
        }
    });
}

function onGetAllFloats() {
    $('.steam_wizard_load_button_float').each(function(index, value){
        value.click();
    });
}

function removeOverlay() {
	$(".steam_wizard_screen_overlay").hide();
}

function showScreenshotPopup(image_url) {
	$(".steam_wizard_screen_overlay").show().find('img').attr('src', image_url);
}

function onGetScreenshot() {
	var $marketListingRow = $(this.closest('.market_listing_row'));
	var inspectLink = getInspectLink($marketListingRow);
	
	var $getScreenshotButton = $marketListingRow.find(".steam_wizard_load_button_screenshot").first();
	$getScreenshotButton.off();
	$getScreenshotButton.text('loading...').addClass('btn_grey_white_innerfade');
	Screenshots.requestScreenshot(inspectLink, function(result){
		if (result.success) {
			if(result.result.status == Screenshots.STATUS_QUEUE){
				$getScreenshotButton.text('Queue: ' + result.result.place_in_queue).addClass('btn_grey_white_innerfade');
			}else if (result.result.status == Screenshots.STATUS_DONE){
				$getScreenshotButton.text('Open Screenshot');
				$getScreenshotButton.removeClass('btn_grey_white_innerfade').addClass('btn_blue_white_innerfade');
				$getScreenshotButton.click(function(){
					showScreenshotPopup(result.result.image_url);
				});
				$getScreenshotButton[0].click();
			}else{
				 $getScreenshotButton.text('Failed').addClass('steam_wizard_load_button_failed');
			}
		} else {
			 $getScreenshotButton.text('Failed').addClass('steam_wizard_load_button_failed');
		}
	});
}

function handlePaging() {
    var searchResults_start = $('#searchResults_start').text();
    var counter = 0;
    clearInterval(STEAM_WIZARD_CONFIG.pagingInterval);
    STEAM_WIZARD_CONFIG.pagingInterval = setInterval(function() {
        /* limit to 5 trials */
        if($('#searchResults_start').text() === searchResults_start && counter++ < 5)
           return;

        initButtons();
        clearInterval(STEAM_WIZARD_CONFIG.pagingInterval);
    }, 1000);
}

function initButtons() {
    $("#searchResultsRows").find(".market_listing_row").each(function(index, marketListingRow) {
        var $marketListingRow = $(marketListingRow);

        //button which gets float
        var $getFloatButton = createSteamButton("Get Float");
        $getFloatButton.click(onGetFloat);
        $getFloatButton.addClass('steam_wizard_load_button_float');
        $marketListingRow.find(".market_listing_item_name").after($getFloatButton);

        //button which gets screenshot
        var $getScreenshotButton = createSteamButton("Get Screen");
        $getScreenshotButton.click(onGetScreenshot);
        $getScreenshotButton.addClass('steam_wizard_load_button_screenshot');
        $getFloatButton.after($getScreenshotButton);
    });

    //button to load all floats
    if ($("#searchResultsRows").find(".market_listing_row").length > 0) {
        var $getAllFloatsButton = createSteamButton("Load All Floats");
        $getAllFloatsButton.addClass('steam_wizard_load_button_float_all');
        $getAllFloatsButton.click(onGetAllFloats);
        $getAllFloatsButton.on('remove', function() {alert('removed');});

        var $container = $(".market_listing_header_namespacer").parent();
        $container.append($getAllFloatsButton);
    }
    
    /* other pages too */
    $('#searchResults_links').find('.market_paging_pagelink').on('click', handlePaging);
}

function removeButtons() {
    $("#searchResultsRows").find('.steam_wizard_load_button_float').remove();
    $("#searchResultsRows").find('.steam_wizard_load_button_screenshot').remove();
    $("#searchResultsRows").find('.steam_wizard_load_button_float_all').remove();
    
    $('#searchResults_links').find('.market_paging_pagelink').off('click', handlePaging);
}

function init() {
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


$(document).ready(function() {
    var port = chrome.runtime.connect();
    
    port.onMessage.addListener(function(request, port) {
        switch(request.msg) {
            case 'pluginStatus':
                STEAM_WIZARD_CONFIG.enabled = request.status;
                
            if(STEAM_WIZARD_CONFIG.enabled)
               initButtons();
            else
               removeButtons();
        }
    });
    
    port.postMessage({msg: 'getPluginStatus'});
    init();
});
