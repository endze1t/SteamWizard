/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/*
 * Overriding some steam scripts for better performance
 */

define(function() {
    //this function is synchronous .. script is removed after it completes
    function injectScript(actualCode) {
        var script = document.createElement('script');
        script.textContent = actualCode;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    }
    
    var fixUpdateSlots = function() {
        var actualCode = 'UpdateSlots = ' +
            function (rgSlotItems, rgCurrency, bYourSlots, user, version)
            {
                var slotPrefix = bYourSlots ? 'your_slot_' : 'their_slot_';
                var elSlotContainer = bYourSlots ? $('your_slots') : $('their_slots');
                var elCurrencySlotContainer = bYourSlots ? $('your_slots_currency') : $('their_slots_currency');

                // see what the last slot with an item is
                var cMaxSlotId = 0;
                if (rgSlotItems instanceof Array)
                {
                    cMaxSlotId = rgSlotItems.length;
                } 
                else
                {
                    for (var slotid in rgSlotItems)
                    {
                        var iSlot = parseInt(slotid);
                        if (iSlot && !isNaN(iSlot))
                            cMaxSlotId = Math.max(iSlot, cMaxSlotId);
                    }
                    cMaxSlotId++;
                }

                var cCurrenciesInTrade = 0;
                for (var iCurrency = 0; iCurrency < rgCurrency.length; iCurrency++)
                {
                    var currencyUpdate = rgCurrency[iCurrency];

                    // just skip pending inventories, the currency will be drawn after the inventory arrival
                    var inventory = user.getInventory(currencyUpdate.appid, currencyUpdate.contextid);
                    if (!inventory || inventory.BIsPendingInventory())
                        continue;

                    cCurrenciesInTrade++;

                    var currency = user.FindCurrency(currencyUpdate.appid, currencyUpdate.contextid, currencyUpdate.currencyid);
                    var stack = GetTradeItemStack(user, currency);

                    if ((parseInt(stack.amount) + parseInt(stack.fee)) != currencyUpdate.amount)
                    {
                        UpdateTradeItemStackDisplay(currency, stack, currencyUpdate.amount);
                        if (!bYourSlots && !g_bTradeOffer)
                            HighlightNewlyAddedItem(stack.element);
                    }

                    stack.version = version;
                }
                var rgCurrencySlots = elCurrencySlotContainer.childElements();
                if (cCurrenciesInTrade < rgCurrencySlots.length)
                {
                    // there's an extra slot in the trade, remove it
                    for (var iCurrencySlot = 0; iCurrencySlot < rgCurrencySlots.length; iCurrencySlot++)
                    {
                        var elSlot = rgCurrencySlots[iCurrencySlot];
                        var stack = elSlot.stack;
                        if (stack.version < version)
                        {
                            elSlot.remove();
                            var origCurrency = user.FindCurrency(stack.appid, stack.contextid, stack.id);
                            origCurrency.amount = origCurrency.original_amount;
                            origCurrency.trade_stack = null;
                            if (bYourSlots)
                                UpdateCurrencyDisplay(origCurrency);
                        }
                    }
                }

                EnsureSufficientTradeSlots(bYourSlots, cMaxSlotId, cCurrenciesInTrade);

                var nNumBadItems = 0;
                var firstBadItem = null;
                var nNumExpiringItems = 0;
                var firstExpiringItem = null;
                var nFullInventoryAppId = false;
                
                // #changed from
                // for ( var slot = 0; slot < elSlotContainer.childElements().length; slot++ )
                for (var slot = 0; slot < elSlotContainer.children.length; slot++)
                {
                    // #changed from                    
                    // var elSlot = $(slotPrefix + slot);
                    // var elCurItem = elSlot2.down('.slot_inner').firstDescendant();
                    var elSlot = document.getElementById(slotPrefix + slot);                    
                    var elCurItem = elSlot.querySelector('.slot_inner').firstElementChild;
                    var elNewItem = null;
        
                    var bRemoveCurItem = (elCurItem != null);

                    var bItemIsNewToTrade = false;  //lets us know if we need to indicate this item was added
                    var bStackAmountChanged = false;	// if a stackable item's amount has changed, we also treat that like new

                    if (rgSlotItems[slot])
                    {
                        var appid = rgSlotItems[slot].appid;
                        var contextid = rgSlotItems[slot].contextid;
                        var itemid = rgSlotItems[slot].assetid;
                        var amount = rgSlotItems[slot].amount;

                        // check that we are allowed to receive this item
                        if (!bYourSlots)
                        {
                            if (!UserYou.BAllowedToRecieveItems(appid, contextid))
                            {
                                if (!nFullInventoryAppId && UserYou.BInventoryIsFull(appid, contextid))
                                {
                                    nFullInventoryAppId = appid;
                                }

                                if (nNumBadItems == 0)
                                {
                                    firstBadItem = rgSlotItems[slot];
                                }

                                nNumBadItems++;
                            }
                        }

                        var elItem = user.findAssetElement(appid, contextid, itemid);;
                        if (g_dateEscrowEnd != null && typeof elItem.rgItem.item_expiration == 'string')
                        {
                            var dateExpiration = new Date(elItem.rgItem.item_expiration);
                            if (g_dateEscrowEnd >= dateExpiration)
                            {
                                if (nNumExpiringItems == 0)
                                {
                                    firstExpiringItem = rgSlotItems[slot];
                                }

                                nNumExpiringItems++;
                            }
                        }

                        if (elCurItem && elCurItem.rgItem && elCurItem.rgItem.appid == appid && elCurItem.rgItem.contextid == contextid
                                && elCurItem.rgItem.id == itemid && !elCurItem.rgItem.unknown)
                        {
                            // it's already there
                            bRemoveCurItem = false;

                            if (elCurItem.rgItem.is_stackable)
                            {
                                var stack = elCurItem.rgItem;
                                bStackAmountChanged = (amount != stack.amount);
                                UpdateTradeItemStackDisplay(stack.parent_item, stack, amount);
                            }
                        } else
                        {
                            // it's new to the trade
                            elNewItem = elItem;
                            var item = elNewItem.rgItem;

                            if (!item.unknown)
                            {
                                bItemIsNewToTrade = true;
                            }

                            if (item.is_stackable)
                            {
                                var stack = GetTradeItemStack(user, item);
                                bStackAmountChanged = (amount != stack.amount);
                                UpdateTradeItemStackDisplay(item, stack, amount);

                                elNewItem = stack.element;
                            }

                            if (elNewItem && elNewItem.parentNode)
                            {
                                if ($(elNewItem.parentNode).down('.slot_actionmenu_button'))
                                {
                                    $(elNewItem.parentNode).down('.slot_actionmenu_button').hide();
                                }

                                if (BIsInTradeSlot(elNewItem))
                                {
                                    CleanupSlot(elNewItem.parentNode.parentNode);
                                    bItemIsNewToTrade = false;
                                }
                                elNewItem.remove();
                            }
                        }
                    }

                    if (elCurItem && bRemoveCurItem)
                    {
                        if (elCurItem.rgItem && elCurItem.rgItem.is_stackable)
                        {
                            var stack = elCurItem.rgItem;
                            UpdateTradeItemStackDisplay(stack.parent_item, stack, 0);
                            elCurItem.remove();
                        } else if (elCurItem.rgItem && elCurItem.rgItem.homeElement)
                            elCurItem.rgItem.homeElement.appendChild(elCurItem.remove());
                        else
                            elCurItem.remove();
                        CleanupSlot(elSlot);
                    }

                    if (elNewItem)
                    {
                        PutItemInSlot(elNewItem, elSlot);
                        if (bItemIsNewToTrade && !bYourSlots && !g_bTradeOffer)
                        {
                            HighlightNewlyAddedItem(elNewItem);
                        }
                    } 
                    else if (bStackAmountChanged && !bYourSlots && !g_bTradeOffer)
                    {
                        HighlightNewlyAddedItem(elCurItem);
                    }        
                }
                
                if (!bYourSlots && nNumBadItems != g_nItemsFromContextWithNoPermissionToReceive && !UserThem.BIsLoadingInventoryData())
                {
                    g_nItemsFromContextWithNoPermissionToReceive = nNumBadItems;

                    if (nNumBadItems > 0)
                    {
                        var strEvent = "";
                        var item = user.findAsset(firstBadItem.appid, firstBadItem.contextid, firstBadItem.assetid);
                        if (item)
                        {
                            if (nNumBadItems == 1)
                            {
                                strEvent = 'You are not allowed to receive the item "%1$s."'
                                        .replace('%1$s', item.name.escapeHTML());
                            } else
                            {
                                strEvent = 'You are not allowed to receive %1$s of the items being offered including "%2$s."'
                                        .replace('%1$s', nNumBadItems)
                                        .replace('%2$s', item.name.escapeHTML());
                            }
                        } else
                        {
                            if (nNumBadItems == 1)
                            {
                                strEvent = 'You are not allowed to receive one of the items being offered.';
                            } else
                            {
                                strEvent = 'You are not allowed to receive %1$s of the items being offered.'
                                        .replace('%1$s', nNumBadItems);
                            }
                        }

                        if (nFullInventoryAppId)
                        {
                            var rgAppData = g_rgAppContextData[nFullInventoryAppId];
                            var strEventAppend = 'Your inventory for %1$s is full.'
                                    .replace('%1$s', rgAppData.name.escapeHTML());

                            strEvent = strEvent + ' ' + strEventAppend;
                        }

                        var elEvent = new Element('div', {'class': 'logevent'});
                        elEvent.update(strEvent);
                        $('log').appendChild(elEvent);
                    }
                }

                if (nNumExpiringItems != g_rgnItemsExpiringBeforeEscrow[bYourSlots ? 0 : 1])
                {
                    g_rgnItemsExpiringBeforeEscrow[bYourSlots ? 0 : 1] = nNumExpiringItems;

                    if (nNumExpiringItems > 0)
                    {
                        var strEvent = "";
                        var item = user.findAsset(firstExpiringItem.appid, firstExpiringItem.contextid, firstExpiringItem.assetid);
                        if (item)
                        {
                            if (nNumExpiringItems == 1)
                            {
                                strEvent = 'The item "%1$s" cannot be included in this trade because it will expire before the trade hold period is over.'
                                        .replace('%1$s', item.name.escapeHTML());
                            } else
                            {
                                strEvent = 'Some items, including "%1$s," cannot be included in this trade because they will expire before the trade hold period is over.'
                                        .replace('%1$s', item.name.escapeHTML());
                            }
                        } else
                        {
                            if (nNumExpiringItems == 1)
                            {
                                strEvent = 'One item cannot be included in this trade because it will expire before the trade hold period is over.';
                            } else
                            {
                                strEvent = 'Some items cannot be included in this trade because they will expire before the trade hold period is over.';
                            }
                        }

                        var elEvent = new Element('div', {'class': 'logevent'});
                        elEvent.update(strEvent);
                        $('log').appendChild(elEvent);
                    }
                }
            }
        + ';';
        
        injectScript(actualCode);
    }
    
    //inject script to alter function and skipping the animation (which cause lagging)
    var fixEnsureSufficientTradeSlots = function () {
        var actualCode = 'EnsureSufficientTradeSlots = ' +
                function (bYourSlots, cSlotsInUse, cCurrencySlotsInUse) {
                    var elSlotContainer = bYourSlots ? $('your_slots') : $('their_slots');

                    var cTotalSlotsInUse = cSlotsInUse + cCurrencySlotsInUse;

                    var cDesiredSlots;
                    if (Economy_UseResponsiveLayout())
                        cDesiredSlots = cTotalSlotsInUse + 1;
                    else
                        cDesiredSlots = Math.max(Math.floor((cTotalSlotsInUse + 5) / 4) * 4, 8);

                    var cDesiredItemSlots = cDesiredSlots - cCurrencySlotsInUse;

                    var cCurrentItemSlots = elSlotContainer.childElements().length;
                    var cCurrentSlots = cCurrentItemSlots + cCurrencySlotsInUse;

                    var $ContainerParent = $J(elSlotContainer.parentNode);
                    $ContainerParent.css('height', $ContainerParent.height() + 'px');
                    $ContainerParent.css('overflow', 'hidden');

                    var bElementsChanged = false;
                    var fnOnAnimComplete = null;
                    if (cDesiredSlots > cCurrentSlots)
                    {
                        for (var i = cCurrentItemSlots; i < cDesiredItemSlots; i++)
                        {
                            CreateTradeSlot(bYourSlots, i);
                        }
                        bElementsChanged = true;
                    } else if (cDesiredSlots < cCurrentSlots)
                    {
                        // going to compact
                        var prefix = bYourSlots ? 'your_slot_' : 'their_slot_';
                        var rgElementsToRemove = new Array();
                        for (var i = cDesiredItemSlots; i < cCurrentItemSlots; i++)
                        {
                            var element = $(prefix + i);
                            element.id = '';
                            $(elSlotContainer.parentNode).appendChild(element.remove());
                            rgElementsToRemove.push(element);
                        }
                        fnOnAnimComplete = function () {
                            rgElementsToRemove.invoke('remove')
                        };
                        bElementsChanged = true;
                    }
                    if (bElementsChanged)
                    {
                        /** 
                         * animation was removed form this part 
                         **/
                        if (cCurrentSlots) {
                            // # the following line is causing lag after 600 items (scrollHeight is expensive)
//                            var iNewHeight = $ContainerParent[0].scrollHeight - parseInt($ContainerParent.css('paddingTop'));                            
//                            $ContainerParent.css('height', iNewHeight + 'px');
                            $ContainerParent.css('height', '').css('overflow', '');
                            fnOnAnimComplete && fnOnAnimComplete();
                        } else {
                            $ContainerParent.css('height', '').css('overflow', '');
                            fnOnAnimComplete && fnOnAnimComplete();
                        }
                    } else
                    {
                        $ContainerParent.css('height', '').css('overflow', '');
                    }    
                }
        + ';';

        injectScript(actualCode);
    };

    //replace "SizeWindow" function to increase window size which is hard coded by valve
    var fixSizeWindow = function () {
        /* steam sticks width to 976 .. we need 170px more for the control bar */
        var actualCode = 'SizeWindow = ' +
                function ()
                {
                    if (!Prototype.Browser.WebKit)
                    {
                        return;
                    }

                    var flSetZoom = '';

                    if (!Economy_UseResponsiveLayout())
                    {
                        var widthZoom = document.viewport.getWidth() / (976 + 170);
                        var heightZoom = document.viewport.getHeight() / Math.min($(document.body).getHeight() + 16, 1012);
                        var flSetZoom = flZoom > 0.55 ? flZoom : 0.55;
                        if (widthZoom <= 0.99 || heightZoom <= 0.99)
                        {
                            var flZoom = widthZoom < heightZoom ? widthZoom : heightZoom;
                            flSetZoom = flZoom > 0.55 ? flZoom : 0.55;
                        } else
                        {
                            flSetZoom = 1.0;
                        }
                    }

                    $J('#mainContent').css('zoom', flSetZoom);
                    $J('#tutorial_header_message').css('zoom', flSetZoom);

                    if (!g_bTradeOffer)
                        $('log').scrollTop = 10000;

                    $J('#trade_recaptcha').css('zoom', flSetZoom ? (1.0 / flSetZoom) : '');
                }
        + ';(' +
                function () {
                    Event.observe(window, 'resize', SizeWindow);
                }
        + ')();';

        injectScript(actualCode);
    };
    
    //
    var changeMarketDisplayCount = function(numItems) {
        var actualCode = '(' +
                function(num) {
                    g_oSearchResults.m_cPageSize = num;
                    g_oSearchResults.GoToPage(0, true);
                }
            + ')('+numItems+');';
        
        injectScript(actualCode);
    }

    //makes trade ready without warning
    var toggleReady = function() {
        var actualCode = '(' +
                function() {
                    bReady = true;
                    UserYou.bReady = bReady;
                    GTradeStateManager.ToggleReady(bReady);
                    UpdateReadyButtons();
                    $('notready_tradechanged_message').hide();
                }
            + ')();';
        
        injectScript(actualCode);
    }
    
    return {
        fixUpdateSlots: fixUpdateSlots,
        
        fixEnsureSufficientTradeSlots: fixEnsureSufficientTradeSlots,
        
        fixSizeWindow: fixSizeWindow,
        
        changeMarketDisplayCount: changeMarketDisplayCount,
        
        toggleReady: toggleReady,
    };
});