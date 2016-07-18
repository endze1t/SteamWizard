var ui = {
    /**************************************
    *************** Buttons ***************
    **************************************/
    createGreenSteamButton: function(text) {
        var $output = $("<div></div>");
        $output.addClass('btn_green_white_innerfade btn_small steam_wizard_load_button');
        $output.text(text);
        return $output;
    },
        
    createGreySteamButton: function(text) {
        var $output = $("<div></div>");
        $output.addClass('btn_grey_white_innerfade btn_small steam_wizard_load_button');
        $output.text(text);
        return $output;
    },
	
	createMultipleChoicePanel : function(numChoices, onClickCallback){
		var $output = $("<span></span>");
		$output[0].setButtonChecked = function(enabledButton){
			$output.find('.steam_wizard_multiple_choice_button').each(function(index, value){
				if (index != enabledButton){
					$(value).removeClass('btn_green_white_innerfade');
					$(value).addClass('btn_grey_white_innerfade');
				}else{
					$(value).removeClass('btn_grey_white_innerfade');
					$(value).addClass('btn_green_white_innerfade');
				}
			});
		};
		$output[0].iterateButtons = function(callback){
			$output.find(".steam_wizard_multiple_choice_button").each(function(index, value){
				callback(index, $(value));
			});
		};
		for (var i = 0;i<numChoices;i++){
			var $newButton = ui.createGreenSteamButton("abc");
			$newButton.addClass('steam_wizard_multiple_choice_button');
			$newButton.click(function(){
				$output[0].setButtonChecked(this);
				onClickCallback(this);
			}.bind(i));
			$output.append($newButton);
		}
		return $output;
	},
	
	createToggleButton : function(text, onClickCallback){
		var $output = ui.createGreenSteamButton(text);
		$output[0].sw_enabled = true;
		$output[0].setEnabled = function(enabled){
			if (enabled){
				$output.removeClass('btn_grey_white_innerfade');
				$output.addClass('btn_green_white_innerfade');
			}else{
				$output.removeClass('btn_green_white_innerfade');
				$output.addClass('btn_grey_white_innerfade');
			}
			$output[0].sw_enabled = enabled;
			onClickCallback(enabled);
		};
		$output.click(function(){
			$output[0].sw_enabled = !$output[0].sw_enabled;
			$output[0].setEnabled($output[0].sw_enabled);
		});
		return $output;
	},
	
	createRadioPanel : function (choiceArray, onChangeCallback){
		var hash = {};
		var $output = $("<p>");
		$output.append("<span>Display more items:</span>");
		for (var i = 0;i<choiceArray.length;i++){
			var $newRadio = $("<input type=\"radio\" id=\"mc\" name=\"" + choiceArray[i] + "\" value=\"Mastercard\">");
			hash[choiceArray[i]] = $newRadio;
			$newRadio[0].choiceValue = choiceArray[i];
			var newRadioClick = function(){
				var $radio = this;
				if ($radio.prop('checked') == true){
					$output.find("input:radio").prop("checked", false);
					$radio.prop("checked", true);
					onChangeCallback($radio[0].choiceValue);
				}
			}.bind($newRadio);
			$newRadio.change(newRadioClick);
			$output.append($newRadio);
			$output.append($("<span>" + choiceArray[i] + "</span>"));
		}
		$output[0].setChecked = function(choice){
			if (hash[choice]){
				hash[choice].prop("checked",true);
				hash[choice].change();
			}
		}
		return $output;
	},
        
    createWearValueSpan: function(floatvalue){
	var $output = $("<span>").text(floatvalue);
        
        var ranges = [[1.00, 0.45],
                      [0.45, 0.38],
                      [0.38, 0.15],
                      [0.15, 0.07],
                      [0.07, 0.00]];

        var range;
        for(var i in ranges)
            if(floatvalue >= ranges[i][1]) {
               range = ranges[i];
               break;
           }
        
        var r = (range[0] - floatvalue) / (range[0] - range[1]);
        var rgbValue = parseInt(r * 150);
        var backgroundValue = "rgb(" + rgbValue + "," + rgbValue + "," + rgbValue +")";
        $output.css({"background": backgroundValue});
        return $output;
    },
    /**************************************
    ************* OVERLAY *****************
    **************************************/
    showScreenshotOverlay: function(image_url) {
       $(".steam_wizard_screen_overlay").show().find('img').attr('src', image_url);
    },

    showLoginOverlay: function() {
       $(".steam_wizard_login_overlay").show();            
    },
	
	showGeneralOverlay : function(title, message, buttontext, onButtonCallback){
		$(".steam_wizard_general_overlay").show();  
		console.log( $(".steam_wizard_general_overlay"));
		$(".steam_wizard_general_overlay_button").off();
		$(".steam_wizard_general_overlay_button").click(onButtonCallback);
		$(".steam_wizard_general_overlay_button").text(buttontext);
		$("#steam_wizard_general_overlay_title").text(title);
	},
    
    removeOverlay: function () {
        $(".steam_wizard_screen_overlay").hide();
        $(".steam_wizard_login_overlay").hide();
        $(".steam_wizard_general_overlay").hide();
    },
    
    buildScreenshotOverlay: function () {
        var $overlay = $('<div>');
        $('<img>').appendTo($overlay);

        var $overlayContainer = $('<div>');
        $overlayContainer.addClass('steam_wizard_screen_overlay');
        $overlayContainer.append($overlay);
        $overlayContainer.click(ui.removeOverlay);
        $overlayContainer.hide();

        $('body').append($overlayContainer);
    },

    buildLoginOverlay: function(on_login) {
            var $overlay = $('<div>');
            var $loginPopup = $('<div>');
            $loginPopup.appendTo($overlay);
            $loginPopup.addClass('steam_wizard_login_popup');
            $loginPopup.append($('<p>').text('This plugin relies on services from CS:GO Zone and Metjm, please login to either'));
            $loginPopup.append($("<a target='_blank' href='https://metjm.net/csgo/'></a>").append($('<div>').css('background-image','url(' + chrome.extension.getURL("images/logo_metjm.png") + ')')));
            $loginPopup.append($("<a target='_blank' href='https://www.csgozone.net/'></a>").append($('<div>').css('background-image','url(' + chrome.extension.getURL("images/logo_csgozone.png") + ')')));

            var button = ui.createGreenSteamButton('Ok, I\'m logged in');
            button.addClass('steam_wizard_login_button');
            button.click(on_login);

            $loginPopup.append(button);
            $loginPopup.click(function(e){
                e.stopPropagation();
            });

            var $loginOverlayContainer = $('<div>');
            $loginOverlayContainer.addClass('steam_wizard_login_overlay');
            $loginOverlayContainer.append($overlay);
            $loginOverlayContainer.click(ui.removeOverlay);
            $loginOverlayContainer.hide();

        $('body').append($loginOverlayContainer);
    },
	
	buildGeneralOverlay: function() {
            var $overlay = $('<div>');
            var $loginPopup = $('<div>');
            $loginPopup.appendTo($overlay);
            $loginPopup.addClass('steam_wizard_login_popup');
            $loginPopup.append($('<p id="steam_wizard_general_overlay_title">').text(''));
            
            var button = ui.createGreenSteamButton('Ok');
            button.addClass('steam_wizard_general_overlay_button');

            $loginPopup.append(button);
            $loginPopup.click(function(e){
                e.stopPropagation();
            });

            var $loginOverlayContainer = $('<div>');
            $loginOverlayContainer.addClass('steam_wizard_general_overlay');
            $loginOverlayContainer.append($overlay);
            $loginOverlayContainer.click(ui.removeOverlay);
            $loginOverlayContainer.hide();

        $('body').append($loginOverlayContainer);
    },
	
	buildSteamWizardStatusPanel: function(){
		var $panel = $("<div>");
		var $content = $("<div>");
		var $buttonsContainer = $("<div>");
		var $prem = $("<p>Premium status: <span id='steam_wizard_csgozone_prem_active'  class='market_commodity_orders_header_promote'>csgozone.net</span> <span id='steam_wizard_metjm_prem_active' class='market_commodity_orders_header_promote'>metjm.net</span></p>");
		var $inspectsLeftToday = $("<p>Float requests left today: <span id='steam_wizard_inspects_left_today' class='market_commodity_orders_header_promote steam_wizard_rotating'>?</span></p>");
		var $screenshotPremiumQeue = $("<p>Screenshots priority queue: <span id='steam_wizard_screenshots_premium_queue' class='market_commodity_orders_header_promote steam_wizard_rotating'>?</span></p>");
		
		$panel.addClass('steam_wizard_status_panel');
		$content.addClass('steam_wizard_status_panel_content');
		$buttonsContainer.addClass('steam_wizard_status_panel_button_container');
		
		$panel.append($content);
		$content.append($("<p>SteamWizard</p>").css({'font-size':'18px'}).addClass('market_commodity_orders_header_promote'));
		$content.append($prem);
		$content.append($inspectsLeftToday);
		$content.append($screenshotPremiumQeue);
		$content.append($buttonsContainer);
		
		$(".market_listing_filter").after($panel);
		
	}
}