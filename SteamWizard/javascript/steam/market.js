"using strict";

function createSteamButton(text){
	var $output = $("<div></div>");
	$output.addClass('btn_green_white_innerfade btn_small');
	$output.css({'padding':'5px','margin-left':'2px','font-size':'85.7%'});
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
function onGetAllFloats(){
	$('.loadFloatButton').each(function(index, value){
		value.click();
	});
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
		$getFloatButton.addClass('loadFloatButton');
		$marketListingRow.find(".market_listing_item_name").after($getFloatButton);
		
		//button which gets screenshot
		var $getScreenshotButton = createSteamButton("Get Screen");
		$getScreenshotButton.click(onGetScreenshot.bind($marketListingRow));
		$getFloatButton.after($getScreenshotButton);
	});
	
	
	//button to load all floats
	if ($("#searchResultsRows").find(".market_listing_row").length > 0){
		var $getAllFloatsButton = createSteamButton("Get All Floats");
		$getAllFloatsButton.css({'padding-top':'0px','padding-bottom':'0px'});
		$getAllFloatsButton.click(onGetAllFloats);
		 
		var $container = $(".market_listing_header_namespacer").parent();
		$container.empty();
		$container.append($getAllFloatsButton)
	}
}

$(document).ready(function(){
	init();
});