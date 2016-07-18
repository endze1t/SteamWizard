"using strict";
var numDisplayedItems = 10;
var visibleAssets = {};

/**************************************
*************** UTIL ******************
**************************************/
function getInspectLink($marketListingRow) {
    if($marketListingRow[0].inspectLink)
       return $marketListingRow[0].inspectLink;
   
    var element = $marketListingRow.find(".market_actionmenu_button")[0];
    if (!element)
         return null;
         
    element.click();
    var inspectLink =  $('#market_action_popup_itemactions').find('a').attr("href");
    $("#market_action_popup").css('display','none');
    
    $marketListingRow[0].inspectLink = inspectLink;
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
				finishFloatButton($getFloatButton, result.data);
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
		setTimeout(function(){
			value.click();
		}, index * 50);
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
			finishScreenshotButton($getScreenshotButton, result.image_url);
		}else if (result.status == steamwizard.EVENT_STATUS_FAIL){
			$getScreenshotButton.text(result.msg).addClass('steam_wizard_load_button_failed');
			$getScreenshotButton.click(onGetScreenshot);
		}
	});
}

function finishFloatButton($getFloatButton, floatvalue){
	if (floatvalue != null){
		$getFloatButton.off().addClass('btn_grey_white_innerfade');
		$getFloatButton.empty().append(ui.createWearValueSpan(floatvalue.wear.toFixed(15)));
	}
}
function finishScreenshotButton($getScreenshotButton, screenshotlink){
	if (screenshotlink){
		$getScreenshotButton.off();
		$getScreenshotButton.text('Open Screenshot');
		$getScreenshotButton.removeClass('btn_grey_white_innerfade').addClass('btn_blue_white_innerfade');
		$getScreenshotButton.click(function(){ui.showScreenshotOverlay(screenshotlink);});
	}
}

function initButtons() {
	visibleAssets = {};
	if (getInspectLink($("#searchResultsRows .market_recent_listing_row").first())){
		$("#searchResultsRows").find(".market_listing_row").each(function(index, marketListingRow) {
			var $marketListingRow = $(marketListingRow);
			
                        var container = $("<div>").insertBefore($marketListingRow.find(".market_listing_item_name_block"));
                        container.addClass('market_listing_right_cell steam_wizard_market_cell');
                        
			//button which gets float
			var $getFloatButton = ui.createGreenSteamButton("Get Float");
			$getFloatButton.click(onGetFloat);
			$getFloatButton.addClass('steam_wizard_load_button_float');
                        $getFloatButton.appendTo(container);

			//button which gets screenshot
			var $getScreenshotButton = ui.createGreenSteamButton("Get Screen");
			$getScreenshotButton.click(onGetScreenshot);
			$getScreenshotButton.addClass('steam_wizard_load_button_screenshot');
                        $getScreenshotButton.appendTo(container);
			
			
			setTimeout(function(){
				//load cached floats
				var inspectLink = getInspectLink($marketListingRow);
				visibleAssets[util.getAssetID(inspectLink)] = $marketListingRow;
				
				var cachedFloatValue = steamwizard.getFloatValueCached(inspectLink);
				finishFloatButton($getFloatButton, cachedFloatValue);
				
				
				//load cached screenshot
				var cachedScreenshot = steamwizard.getScreenshotCached(inspectLink);
				finishScreenshotButton($getScreenshotButton, cachedScreenshot);
			}, index * 20);
		});
	}
	$(".steam_wizard_status_panel_button_container").show();
}
/**************************************
******* MARKET CUSTOMIZATIONS *********
**************************************/
function getNumMarketItems(){
	var loadedVal = window.localStorage.getItem("steam_wizard_num_market_items");
	return (loadedVal===null) ? 10 : loadedVal;
}
function saveNumMarket(index){
	window.localStorage.setItem("steam_wizard_num_market_items", index);
}

function showWarningOrDisplayNumItems(numItems){
	var quotaWarningDisplayed = window.localStorage.getItem("steam_wizard_quota_warning_displayed");
	if (numItems != numDisplayedItems){
		if (numItems > 10 && !quotaWarningDisplayed){
			console.log(numItems);
			ui.showGeneralOverlay("This will deplete your daily float request quota faster", "", "Ok", function(){
				ui.removeOverlay();
				showNumMarketItems(numItems)
				saveNumMarket(numItems);
				numDisplayedItems = numItems;
				window.localStorage.setItem("steam_wizard_quota_warning_displayed", true);
			});
		}else{
			numDisplayedItems = numItems;
			showNumMarketItems(numItems)
			saveNumMarket(numItems);
		}
	}
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
	$(".steam_wizard_status_panel_button_container").hide();
}

function steamWizardEventListener(request) {    
    switch(request.msg) {
        case 'pluginStatus':
            start();
            break;
		case 'newItem':
			if (request.namespace == constant.NAMESPACE_MARKET_INSPECT && visibleAssets[request.key]){
				console.log('received float');
				var cachedFloatValue = steamwizard.getFloatValueCachedFromAssetid(request.key);
				var $getFloatButton = $(visibleAssets[request.key]).find(".steam_wizard_load_button_float");
				finishFloatButton($getFloatButton, cachedFloatValue);
			} else if (request.namespace == constant.NAMESPACE_SCREENSHOT && visibleAssets[request.key]) {
				var cachedScreenshot = steamwizard.getScreenshotCachedFromAssetid(request.key);
				var $getScreenshotButton = $(visibleAssets[request.key]).find(".steam_wizard_load_button_screenshot");
				if (cachedScreenshot != null){
					finishScreenshotButton($getScreenshotButton, result.image_url);
				}
			}
			console.log(request);
			break;
		case 'inspectStatus':
			$("#steam_wizard_inspects_left_today").text(request.data.limit - request.data.usage + " / " + request.data.limit);
			$("#steam_wizard_inspects_left_today").removeClass('steam_wizard_rotating');
			if (request.premium == true)
				$("#steam_wizard_csgozone_prem_active").addClass('steam_wizard_prem_active');
			else
				$("#steam_wizard_csgozone_prem_active").addClass('steam_wizard_prem_inactive');
			break;
		case 'inspectLimit':
			$("#steam_wizard_inspects_left_today").text(request.data);
			$("#steam_wizard_inspects_left_today").removeClass('steam_wizard_rotating');
			break;
		case 'screenshotStatus':
			console.log(request);
			$("#steam_wizard_screenshots_premium_queue").removeClass('steam_wizard_rotating');
			if (request.data.user_has_premium){
				$("#steam_wizard_metjm_prem_active").addClass('steam_wizard_prem_active');
				$("#steam_wizard_screenshots_premium_queue").text('true');
			}else{
				$("#steam_wizard_metjm_prem_active").addClass('steam_wizard_prem_inactive');
				$("#steam_wizard_screenshots_premium_queue").text('false');
			}
			break;
    }
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
	ui.buildGeneralOverlay();
	ui.buildSteamWizardStatusPanel();
    ui.buildLoginOverlay(function(e) {
        ui.removeOverlay();
        removeButtons();
        
        /* TODO: LOADING INDICATION */
        steamwizard.login(function() {
            start();
        });
    });
	
	/* other buttons */
		if ($("#searchResultsRows").find(".market_listing_row").length > 0) {
			//button to load all floats
			var $getAllFloatsButton = ui.createGreenSteamButton("Load All Floats");
			$getAllFloatsButton.addClass('steam_wizard_load_button_float_all');
			$getAllFloatsButton.click(onGetAllFloats);

			var $container = $(".steam_wizard_status_panel_button_container");
			$container.append($getAllFloatsButton);
			
			//button to sort by floatvalue
			var $sortByFloatsButton = ui.createGreenSteamButton("Sort by Float");
			$sortByFloatsButton.addClass('steam_wizard_sort_by_float_button');
			$sortByFloatsButton.click(onSortByFloats);
			$container.append($sortByFloatsButton);
			
			//button to show more than 10 items
			var $radioPanel = ui.createRadioPanel([10,25,50,75,100], function(newNumItems){
				showWarningOrDisplayNumItems(newNumItems);
			});
			
			var loadedItemsNum = getNumMarketItems();
			$radioPanel[0].setChecked(loadedItemsNum);
			$container.after($radioPanel);
		}

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
	
    steamwizard.addEventListener(steamWizardEventListener);
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
