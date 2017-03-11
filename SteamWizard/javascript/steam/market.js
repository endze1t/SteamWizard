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

function onSortByFloats() {
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
		var $value = $(value);
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
		$getFloatButton.empty().append(ui.createWearValueSpan(floatvalue.paintwear.toFixed(15)));
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
	$(".steam_wizard_radio_panel_numitems").find("input:radio").attr("disabled", false);
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
			ui.showGeneralOverlay("This will deplete your daily float request quota faster", "", "Ok", function(){
				ui.removeOverlay();
				showNumMarketItems(numItems)
				saveNumMarket(numItems);
				numDisplayedItems = numItems;
				window.localStorage.setItem("steam_wizard_quota_warning_displayed", true);
			});
		}else if (parseInt($("#searchResults_total").text().replace(".","")) > 10){
			showNumMarketItems(numItems)
			numDisplayedItems = numItems;
			saveNumMarket(numItems);
		}else{
			numDisplayedItems = numItems;
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
function timeUntil(date) {
	date = new Date(new Date().getTime() + date);

    var seconds = Math.floor((date - new Date()) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}

function removeButtons() {
    $("#searchResultsRows").find('.steam_wizard_load_button_float').remove();
    $("#searchResultsRows").find('.steam_wizard_load_button_screenshot').remove();
	$(".steam_wizard_status_panel_button_container").hide();
}

function steamWizardEventListener(request) {    
    switch(request.msg) {
        case msg.PLUGIN_STATUS:
            start();
            break;
		case msg.BROADCAST_ITEM:
			if (request.namespace == constant.NAMESPACE_MARKET_INSPECT && visibleAssets[request.key]){
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
			break;
		case msg.BROADCAST_INSPECT_STATUS:
			$("#steam_wizard_inspects_left_today").text(request.data.limit - request.data.usage + " / " + request.data.limit);
			$("#steam_wizard_inspects_left_today").removeClass('steam_wizard_rotating');
			if (request.data.premium == true){
				$("#steam_wizard_csgozone_prem_active").text("Reset in: "+timeUntil(request.data.reset));
				$("#steam_wizard_csgozone_prem_active").addClass('steam_wizard_prem_active');
			}else{
				$("#steam_wizard_csgozone_prem_active").text("- increase quota -");
				$("#steam_wizard_csgozone_prem_active").addClass('steam_wizard_prem_inactive');
				$("#steam_wizard_csgozone_prem_active").click(function(){
					ui.showGeneralOverlay("", "", "Ok", function(){
						ui.removeOverlay();
					});
					$("#steam_wizard_general_overlay_title").html("You can increase the daily limit to 20,000 by activating the \"Premium\" on <a style='text-decoration: underline;' target='_blank' href='http://csgozone.net/inspect'>csgozone</a>");
				});
			}
			break;
		case msg.BROADCAST_INSPECT_USAGE:
			$("#steam_wizard_inspects_left_today").text(request.data);
			$("#steam_wizard_inspects_left_today").removeClass('steam_wizard_rotating');
			break;
		case msg.BROADCAST_SCREENSHOT_STATUS:
			$("#steam_wizard_screenshots_premium_queue").removeClass('steam_wizard_rotating');
			if (request.data.user_has_premium){
				$("#steam_wizard_metjm_prem_active").addClass('steam_wizard_prem_active');
				$("#steam_wizard_screenshots_premium_queue").text('true');
			}else{
				$("#steam_wizard_metjm_prem_active").text('- activate -');
				$("#steam_wizard_metjm_prem_active").addClass('steam_wizard_prem_inactive');
				$("#steam_wizard_metjm_prem_active").click(function(){
					ui.showGeneralOverlay("", "", "Ok", function(){
						ui.removeOverlay();
					});
					$("#steam_wizard_general_overlay_title").html("You can activate priority queue by purchasing premium on <a style='text-decoration: underline;' target='_blank' href='http://metjm.net'>metjm.net</a>");
				});
				$("#steam_wizard_screenshots_premium_queue").text('false');
			}
			break;
		case msg.USERNAME:
			updateDisplayedUsername();
			break;
		case msg.BROADCAST_REVOKE_TOKEN:
			setButtonsLoggedOut();
			break;
    }
}

function setButtonsLoggedOut(){
	$("#steam_wizard_loggedin_as").text("not logged in.");
}

function start() {
    if(steamwizard.isEnabled())
        initButtons();
     else
        removeButtons();
}

function updateDisplayedUsername(){
	var username = steamwizard.getUsername(true);
	
	var $paragraph = $("#steam_wizard_loggedin_as_paragraph");
	var $refreshButton = $("#steam_wizard_refresh_login");
	$refreshButton.off();
	if(!username || username == "")
		username = "not logged in.";
	$paragraph.show();
	$("#steam_wizard_loggedin_as").text(username);
	$refreshButton.click(function(){
		setButtonsLoggedOut();
		steamwizard.refreshToken(function(){
			
		});
	});
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
			$radioPanel.addClass("steam_wizard_radio_panel_numitems");
			
			var loadedItemsNum = getNumMarketItems();
			$radioPanel[0].setChecked(loadedItemsNum);
			$container.before($radioPanel);
		}
	/*refresh login to change accounts*/
	updateDisplayedUsername();

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
