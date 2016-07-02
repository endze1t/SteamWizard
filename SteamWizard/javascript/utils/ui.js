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
        console.log(floatvalue, backgroundValue);
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
    
    removeOverlay: function () {
        $(".steam_wizard_screen_overlay").hide();
        $(".steam_wizard_login_overlay").hide();
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
    }
}