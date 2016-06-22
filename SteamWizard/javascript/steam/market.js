"using strict";

function createSteamButton(text){
	var $output = $("<div></div>");
	$output.addClass('btn_green_white_innerfade btn_small');
	$output.css({'padding':'5px','margin':'2px'});
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
	console.log('getting float using inspect link: ' + inspectLink);
}
function onGetScreenshot(){
	var $marketListingRow = this;
	var inspectLink = getInspectLink($marketListingRow);
	console.log('getting screenshot using inspect link: ' + inspectLink);
}

function init(){
	console.log('init()');
	$("#searchResultsRows").find(".market_listing_row").each(function(index, marketListingRow){
		var $marketListingRow = $(marketListingRow);
		
		//button which gets float
		var $getFloatButton = createSteamButton("Get Float");
		$getFloatButton.click(onGetFloat.bind($marketListingRow));
		$marketListingRow.find(".market_listing_item_name").after($getFloatButton);
		
		//button which gets screenshot
		var $getScreenshotButton = createSteamButton("Get Screen");
		$getScreenshotButton.click(onGetScreenshot.bind($marketListingRow));
		$getFloatButton.after($getScreenshotButton);
	});
}

$(document).ready(function(){
	init();
});