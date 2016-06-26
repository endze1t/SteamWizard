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