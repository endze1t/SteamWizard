"using strict";

/**************************************
*************** UTIL ******************
**************************************/
function getInspectLink($marketListingRow) {
    $marketListingRow.find(".market_actionmenu_button")[0].click();
    var inspectLink =  $('#market_action_popup_itemactions').find('a').attr("href");
    $("#market_action_popup").css('display','none');
    return inspectLink;
}

/**************************************
************** FLOATS *****************
**************************************/
function onGetFloat() {
    if(!steamwizard.isLoggedIn()) {
        ui.showLoginOverlay();
        return;
    }

    var $marketListingRow = $(this.closest('.market_listing_row'));
    var inspectLink = getInspectLink($marketListingRow);
    
    var $getFloatButton = $marketListingRow.find(".steam_wizard_load_button_float").first();
    $getFloatButton.off().text('loading...').addClass('btn_grey_white_innerfade');
	
	steamwizard.getFloatValue(inspectLink, function(result){
		if (result.status == steamwizard.EVENT_STATUS_DONE){
			$getFloatButton.empty().append(ui.createWearValueSpan(result.floatvalue));
			//$getFloatButton.removeClass('btn_grey_white_innerfade').addClass('btn_blue_white_innerfade');
		}else if (result.status == steamwizard.EVENT_STATUS_FAIL){
			$getFloatButton.text('Failed').addClass('steam_wizard_load_button_failed');
			$getFloatButton.click(onGetFloat);
		}
	});
}

function onGetAllFloats() {
    if(!steamwizard.isLoggedIn()) {
        ui.showLoginOverlay();
        return;
    }

    $('.steam_wizard_load_button_float').each(function(index, value){
        value.click();
    });
}

function onSortByFloats(){
	$(".market_recent_listing_row").sort(function(a,b){
		var floatA = parseFloat($(a).find(".steam_wizard_load_button_float").text());
		var floatB = parseFloat($(b).find(".steam_wizard_load_button_float").text());
		
		if(isNaN(floatA) && isNaN(floatB))
			return 0;
		else if (isNaN(floatA))
			return 1;
		else if (isNaN(floatB))
			return -1;
		
		if (floatA > floatB)
			return 1;
		else if (floatB > floatA)
			return -1;
		else
			return 0;
	}).each(function(index, value) {
		$value = $(value);
		$value.detach();
		$("#searchResultsRows").append($value);
	});
}

/**************************************
*********** SCREENSHOTS ***************
**************************************/
function onGetScreenshot() {
    if(!steamwizard.isLoggedIn()) {
        ui.showLoginOverlay();
        return;
    }

    var $marketListingRow = $(this.closest('.market_listing_row'));
	var inspectLink = getInspectLink($marketListingRow);
	
	var $getScreenshotButton = $marketListingRow.find(".steam_wizard_load_button_screenshot").first();
	$getScreenshotButton.off().text('loading...').addClass('btn_grey_white_innerfade');
	
	steamwizard.getScreenshot(inspectLink, function(result){
		if (result.status == steamwizard.EVENT_STATUS_PROGRESS){
			$getScreenshotButton.text(result.msg).addClass('btn_grey_white_innerfade');
		}else if (result.status == steamwizard.EVENT_STATUS_DONE){
			$getScreenshotButton.text('Open Screenshot');
			$getScreenshotButton.removeClass('btn_grey_white_innerfade').addClass('btn_blue_white_innerfade');
			$getScreenshotButton.click(function(){ui.showScreenshotOverlay(result.image_url);});
			$getScreenshotButton[0].click();
		}else if (result.status == steamwizard.EVENT_STATUS_FAIL){
			$getScreenshotButton.text(result.msg).addClass('steam_wizard_load_button_failed');
			$getScreenshotButton.click(onGetScreenshot);
		}
	});
}

function initButtons() {
    $("#searchResultsRows").find(".market_listing_row").each(function(index, marketListingRow) {
        var $marketListingRow = $(marketListingRow);

        //button which gets float
        var $getFloatButton = ui.createGreenSteamButton("Get Float");
        $getFloatButton.click(onGetFloat);
        $getFloatButton.addClass('steam_wizard_load_button_float');
        $marketListingRow.find(".market_listing_item_name").after($getFloatButton);

        //button which gets screenshot
        var $getScreenshotButton = ui.createGreenSteamButton("Get Screen");
        $getScreenshotButton.click(onGetScreenshot);
        $getScreenshotButton.addClass('steam_wizard_load_button_screenshot');
        $getFloatButton.after($getScreenshotButton);
    });

    if ($("#searchResultsRows").find(".market_listing_row").length > 0) {
		//button to load all floats
        var $getAllFloatsButton = ui.createGreenSteamButton("Load All Floats");
        $getAllFloatsButton.addClass('steam_wizard_load_button_float_all');
        $getAllFloatsButton.click(onGetAllFloats);

        var $container = $(".market_listing_header_namespacer").parent();
        $container.append($getAllFloatsButton);
		
		//button to sort by floatvalue
		var $sortByFloatsButton = ui.createGreenSteamButton("Sort by Float");
        $sortByFloatsButton.addClass('steam_wizard_sort_by_float_button');
		$sortByFloatsButton.click(onSortByFloats);
		$container.append($sortByFloatsButton);
		
		//panel to show more than 10 items
		var $multipleChoicePanel = ui.createMultipleChoicePanel(numMarketItemsChoices.length, function(buttonIndex){
			setNumMarketItems(buttonIndex);
			showNumMarketItems(numMarketItemsChoices[buttonIndex]);
		});
		$multipleChoicePanel[0].iterateButtons(function(index, $button){
			$button.text(numMarketItemsChoices[index]);
		});
		$multipleChoicePanel[0].setButtonChecked(getNumMarketItemsIndex());
		$container.append($multipleChoicePanel);
		console.log($multipleChoicePanel);
    }
}
/**************************************
******* MARKET CUSTOMIZATIONS *********
**************************************/
var numMarketItemsChoices = [10, 25, 50, 100];
function getNumMarketItemsIndex(){
	var index = window.localStorage.getItem("steam_wizard_num_market_items");
	return (index===null || index < 0 || index > numMarketItemsChoices.length) ? 0 : index;
}
function setNumMarketItems(index){
	window.localStorage.setItem("steam_wizard_num_market_items", index);
}

function showNumMarketItems(num){
	var actualCode = '(function() {g_oSearchResults.m_cPageSize = ' + num + ';g_oSearchResults.GoToPage(0, true);} )();';
	var script = document.createElement('script');
	script.textContent = actualCode;
	(document.head||document.documentElement).appendChild(script);
	script.remove();
}

/**************************************
**************** MISC *****************
**************************************/

function removeButtons() {
    $("#searchResultsRows").find('.steam_wizard_load_button_float').remove();
    $("#searchResultsRows").find('.steam_wizard_load_button_screenshot').remove();
    $("#searchResultsRows").find('.steam_wizard_load_button_float_all').remove();
    $("#searchResultsRows").find('.steam_wizard_sort_by_float_button').remove();
}

function start() {
    if(steamwizard.isEnabled())
        initButtons();
     else
        removeButtons();
}

function init() {	
	//showNumMarketItems();
	
    ui.buildScreenshotOverlay();
    ui.buildLoginOverlay(function(e) {
        ui.removeOverlay();
        removeButtons();
        
        /* TODO: LOADING INDICATION */
        steamwizard.login(function() {
            start();
        });
    });

    /* for paging */
    var observer = new MutationObserver(function(mutation) {
        start();
    });
    observer.observe($('#searchResults_end')[0], {characterData: true, subtree: true});

    //remove overlay on escape
    $(document).keyup(function(e) {
        if(e.keyCode === 27)
           ui.removeOverlay();
    });
	
    steamwizard.onChange(start);
}

/**************************************
*************** INIT ******************
**************************************/
$(document).ready(function() {
        
    /* TODO: LOADING INDICATION */
    steamwizard.ready(function() {
        init();
        start();
    });
});
