"using strict";

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
	
	onGetFloatButtonClick(inspectLink, function(result){
		if (result.status == EVENT_STATUS_DONE){
			$getFloatButton.text(result.floatvalue);
			$getFloatButton.removeClass('btn_grey_white_innerfade').addClass('btn_blue_white_innerfade');
		}else if (result.status == EVENT_STATUS_FAIL){
			$getFloatButton.text('Failed').addClass('steam_wizard_load_button_failed');
			$getFloatButton.click(onGetFloat);
		}
	});
}

function onGetAllFloats() {
    if (checkNoToken())
		return;
    
    $('.steam_wizard_load_button_float').each(function(index, value){
        value.click();
    });
}

function onGetScreenshot() {
    var $marketListingRow = $(this.closest('.market_listing_row'));
	var inspectLink = getInspectLink($marketListingRow);
	
	var $getScreenshotButton = $marketListingRow.find(".steam_wizard_load_button_screenshot").first();
	$getScreenshotButton.off();
	$getScreenshotButton.text('loading...').addClass('btn_grey_white_innerfade');
	
	onGetScreenshotButtonClick(inspectLink, function(result){
		if (result.status == EVENT_STATUS_PROGRESS){
			$getScreenshotButton.text(result.msg).addClass('btn_grey_white_innerfade');
		}else if (result.status == EVENT_STATUS_DONE){
			$getScreenshotButton.text('Open Screenshot');
			$getScreenshotButton.removeClass('btn_grey_white_innerfade').addClass('btn_blue_white_innerfade');
			$getScreenshotButton.click(function(){showScreenshotPopup(result.image_url);});
			$getScreenshotButton[0].click();
		}else if (result.status == EVENT_STATUS_FAIL){
			$getScreenshotButton.text(result.msg).addClass('steam_wizard_load_button_failed');
			$getScreenshotButton.click(onGetScreenshot);
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
    
    if(!$('#searchResults_btn_prev').hasClass('pagebtn disabled'))
        $('#searchResults_btn_prev').on('click', handlePaging);
    else
        $('#searchResults_btn_prev').off('click', handlePaging);
        
    
    if(!$('#searchResults_btn_next').hasClass('pagebtn disabled'))
        $('#searchResults_btn_next').on('click', handlePaging);
    else
        $('#searchResults_btn_prev').off('click', handlePaging);
}

function removeButtons() {
    $("#searchResultsRows").find('.steam_wizard_load_button_float').remove();
    $("#searchResultsRows").find('.steam_wizard_load_button_screenshot').remove();
    $("#searchResultsRows").find('.steam_wizard_load_button_float_all').remove();
    
    $('#searchResults_links').find('.market_paging_pagelink').off('click', handlePaging);
    $('#searchResults_btn_prev').off('click', handlePaging);
    $('#searchResults_btn_prev').off('click', handlePaging);
}


function init() {
	STEAM_WIZARD_CONFIG.changeListeners.push(function(enabled){
		if(enabled)
		   initButtons();
		else
		   removeButtons();
	});
}

$(document).ready(function() {
	init();
});
