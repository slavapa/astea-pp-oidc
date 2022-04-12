// global error handler.
window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
    var errorMessage = kendo.format("unexpected system error: {0} page: {1} line: {2}", errorMsg, url, lineNumber);

    
    // log error
    AsteaLogger.WriteToLog("error", "", kendo.format("unexpected system error: {0}", errorMsg), kendo.format("url: {0} ; \r\nline: {1}", url, lineNumber), false); // write log entry


    // show error message
    showErrorMessage(kendo.format("unexpected system error: {0}", errorMsg), null);

    // notify that error got handled
    return true;
}

// String manipulation ---------------------------------------------------------
String.prototype.startsWith = function (pattern) { return this.indexOf(pattern) === 0; };
String.prototype.endsWith = function (suffix) { return this.indexOf(suffix, this.length - suffix.length) !== -1; };
String.prototype.contains = function (subString) { return this.indexOf(subString) != -1; };
String.prototype.replaceAll = function (s1, s2) { return this.split(s1).join(s2); };
String.prototype.isNullOrWhitespace = function (input) { if (this == null) return true; return $.trim(this) == ''; };
String.prototype.trim = function () { return $.trim(this); };
String.prototype.asteaParseDate = function () {
    var date;
    try {
        date = kendo.parseDate(this);
    } catch (e) {
        date = new Date(this);
    }
    return date;
}
Number.prototype.asteaParseDate = function () {
    var date;
    try {
        date = kendo.parseDate(this);
    } catch (e) {
        date = new Date(this);
    }
    return date;
}
// -----------------------------------------------------------------------------

// Date manipulation -----------------------------------------------------------
Date.prototype.addDays = function (days) {
    var dt = new Date(this.valueOf());
    dt.setDate(dt.getDate() + days);
    return dt;
}

Date.prototype.addHours = function (h) {
    var dt = new Date(this.valueOf());
    dt.setTime(dt.getTime() + (h * 60 * 60 * 1000));
    return dt;
}
// -----------------------------------------------------------------------------

// jquery extension - disable & enable elements --------------------------------
$.fn.disable = function () {
    return this.each(function () {
        $(this).attr('disabled', 'disabled');
    });
};

$.fn.enable = function () {
    return this.each(function () {
        $(this).removeAttr('disabled');
    });
};
// -----------------------------------------------------------------------------

// comapre state value
function StateColumnObject(name, value, type) {
    this.Name = name;
    this.Value = value;
    this.Type = type;
    this.IsDirty = false;
    
    // special case when string column pupulated with null as defualt, condition is not working on null values. 
    if (type == "string" && !value)
    {
        this.Value = "";
    }
    this.Equals = function (obj) {
        if (this.IsDirty) return true;
        
        if (this == null && obj == null) return true;
        
        if (this.Value == null && obj.Value == null) return true;
        
        if (this.Value === obj.Value) return true;


        var origVal ="";
        var newVal = "";
        switch (this.Type) {
            case "datetime":
            case "date":
                if (this.Value != "" && obj.Value != "") {
                    origVal = new Date(this.Value).getTime();
                    newVal = new Date(obj.Value).getTime();
                } else {
                    origVal = this.Value == null ? "" : this.Value;
                    newVal = obj.Value == null ? "" : obj.Value;
                }
                break;
            default:
                origVal = this.Value == null ? "" : this.Value;
                newVal = obj.Value == null ? "" : obj.Value;
        }
        
        if (newVal == origVal) return true;
        
        return false;
    };
}

// arrays manipulation ---------------------------------------------------------
// get last array object
if (!Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length - 1];
    };
};
// -----------------------------------------------------------------------------

// open window -----------------------------------------------------------------
function OpenWindow(url, target, specs) {
    if (target == undefined) {
        target = '_self';
    }

    var tabKeQuery = 'tabkey=' + GetTabKey();
    var SsoOidcQueryArgs = window["SsoOidc_QueryArgs"];
    var fullQueryArg = tabKeQuery;

    if (SsoOidcQueryArgs) {
        fullQueryArg += "&" + SsoOidcQueryArgs;
    }

    var urlArr = url.split("?");

    if (urlArr.length > 1) {
        url += '&';

        if (!urlArr[1].contains('tabkey')) {
            url +=  fullQueryArg;
        }
        else {
            url += SsoOidcQueryArgs;
        }
    }
    else {
        url += '?' + fullQueryArg;
    }

    window.open(url, target, specs);
}
// -----------------------------------------------------------------------------

function ReplaceApostrophe(value) {
    return value.replaceAll('\'', '\'\'');
}

// create guid in javascript ---------------------------------------------------
function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

function Guid() {
    return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}
// -----------------------------------------------------------------------------

// find array entry by key and value  ------------------------------------------
function FindArrayEntryByKey(arrayOfKeyValue, key, value) {
    var entry = null;

    $.each(arrayOfKeyValue, function (index, object) { // loop through objects list
        if (object[key] != null && object[key].toLowerCase() == value.toLowerCase()) {
            entry = object;
        }
    });

    return entry;
}
// -----------------------------------------------------------------------------

// find array entry index by key and value  ------------------------------------
function FindArrayEntryIndexByKey(arrayOfKeyValue, key, value) {
    var entryIndex = -1;

    $.each(arrayOfKeyValue, function (index, object) { // loop through objects list
        if (object[key] == value) {
            entryIndex = index;
        }
    });

    return entryIndex;
}
// -----------------------------------------------------------------------------

// find array entry value by key  ----------------------------------------------
function FindArrayEntryValueByKey(arrayOfKeyValue, keyFieldName, key, valueFieldName, defaultValue) {
    $.each(arrayOfKeyValue, function (index, object) { // loop through objects list
        if (object[keyFieldName] == key) {
            defaultValue = object[valueFieldName];
        }
    });

    return defaultValue;
}
// -----------------------------------------------------------------------------

// update field element (attribute)
function UpdateFieldElement(field, elementName, elementValue) {
    $.each(field.Elements, function (index, element) { // loop through objects list
        if (element.Key == elementName) {
            element.Value = elementValue;
            return;
        }
    });
}

// set hidden=false & visible = true when user drag hidden field
function UnHideField(field) {
    UpdateFieldElement(field, "hidden", false);
    UpdateFieldElement(field, "visible", true);
    field.Visible = true;
}


// set hidden=false & visible = false to orig field when user drag hidden field
function HideField(field) {
    UpdateFieldElement(field, "hidden", false);
    UpdateFieldElement(field, "visible", false);
    field.Visible = false;
}

// fcheck if object is null or undefined  --------------------------------------
function IsNullOrUndefined(object) {
    if (object == null | object == undefined | object == 'null') return true; else return false;
}
// -----------------------------------------------------------------------------


// clone java script object (with json) ----------------------------------------
function CloneObject(object) {
    return jQuery.extend(true, {}, object);
    var objectCopy = $.toJSON(object);
    return $.parseJSON(objectCopy);
}
// -----------------------------------------------------------------------------

/// <summary>
/// Generic login method (used from login,self registration pages)
/// </summary>
/// <param name="user">user name</param>
/// <param name="password">passowrd</param>
/// <param name="account">account (profile)</param>
/// <param name="accountState">account state (P,C)</param>
/// <param name="controlToBlock">element on page to lock for edit</param>
/// <param name="forceLogin">whern user logged in from other app/PC</param>
/// <param name="userAcceptTerms">whern user click on accept in from other app/PC</param>
function Login(user, password, account, accountState, controlToBlock, forceLogin, supressCustomizer, userAcceptTerms, explicitCompanyId) {
    // url for login
    var dataUrl = baseLink_LoginController + '/api-login';
    var jsonLoginData = new Object();
    jsonLoginData.user = user;
    jsonLoginData.password = password;
    jsonLoginData.account = account;
    jsonLoginData.accountState = accountState;
    jsonLoginData.explicitCompanyId = "";
    jsonLoginData.supressCustomizer = false;
    
    if (forceLogin == undefined) {
        jsonLoginData.forceLogin = false;
    }
    else
        jsonLoginData.forceLogin = forceLogin;

    if (userAcceptTerms == undefined) {
        jsonLoginData.userAcceptTerms = false;
    }
    else
        jsonLoginData.userAcceptTerms = userAcceptTerms;

    if (explicitCompanyId != undefined) {
        jsonLoginData.explicitCompanyId = explicitCompanyId;
    }

    if (supressCustomizer != undefined) {
        jsonLoginData.supressCustomizer = supressCustomizer;
    }
    
    // make login (ajax call)
    Astea.Framework.Ajax.MakeAjaxCall_UpdateData(dataUrl, jsonLoginData, controlToBlock,
        function (response) {
            if (response.Error != null) {
                switch (response.Error.ButtonType) {
                    case "YesNo":
                        showYesNoMessage(response.Error.ErrorMessage,
                            function (e) {
                                //user cick yes
                                closeYesNoMessage();
                                Login(user, password, account, accountState, controlToBlock, true,false, false);
                            }, function (e) {
                                //user clicked no
                                closeYesNoMessage();
                                return;
                            }
                        );
                        break;
                    default:
                        if (response.Error.ErrorCode == "A2SEC147") {
                            showTermsAndConditionsWindow(response.Error.ErrorMessage, function (e) {
                                // user accept terms & conditions
                                closeTermsAndConditionsWindow();
                                var paramsToRemove = ['account','accountState', 'selfregcode', 'isVendor', 'tabkey'];
                                var tmpUrl = window.location.href;
                                $.each(paramsToRemove, function (idx, param) {
                                    tmpUrl = removeParameter(tmpUrl, param);
                                });
                                window.history.replaceState({}, window.document.title, tmpUrl);
                                Login(user, password, account, accountState, controlToBlock, forceLogin,false, true);
                            }, function (e) {
                                // user didn't accept terms & conditions
                                closeTermsAndConditionsWindow();
                            });
                            return "";
                        }
                        if (response.Error.ErrorCode == "A2SEC148") {
                            showCustomerSelectorWindow(response.ResponseData, function (e) {
                                var customerId = $("#CustomerSelectorWindow").find("#customer-selector-list").val();
                                if (customerId) {
                                    // user select customer
                                    closeCustomerSelectorWindow();
                                    Login(user, password, account, accountState, controlToBlock, forceLogin, false, true, customerId);
                                }
                            }, function (e) {
                                // user click cancel
                                closeCustomerSelectorWindow();
                            });
                            return "";
                        }
                        if (response.Error.ErrorCode == "CUSTOMIZER_LOGGED_MORE_THAN_ONCE") {
                            showYesNoMessage(response.Error.ErrorMessage,
                                function(e) {
                                    //user cick yes
                                    closeYesNoMessage();
                                    Login(user, password, account, accountState, controlToBlock, true,true, false);
                                }, function(e) {
                                    //user clicked no
                                    closeYesNoMessage();
                                    Logout(false);
                                    return;
                                }
                            );
                            return "";
                        }
                        if (response.Error.ErrorCode == "A2SEC144") {
                            window.sessionStorage.setItem("accountState", accountState);
                            window.sessionStorage.setItem("account", account);
                            window.sessionStorage.setItem("username", user);
                            window.sessionStorage.setItem("customerList", response.ResponseData);
                            $("#changePasswordForm").submit();
                            return "";
                        }
                        // incase of error, show it and focus on user name
                        showErrorMessage(response.Error.ErrorMessage, function () {
                            $("#user").focus();
                        });
                        break;
                }
                return "";
            }
            if (response.ExtraResponseItems != null) {
                
                // remove account from url parameters to hide the profile/account name
                var url = removeParameter(window.location.href, 'account');
                url = removeParameter(url, 'module');
                window.history.replaceState({}, window.document.title, url);
                
                //&& response.ExtraResponseItems.length > 0 && response.ExtraResponseItems[0].Key == "IsCustomizer"
                $.each(response.ExtraResponseItems, function (key, value) {
                    if (value.Key == "IsCustomizer" && value.Value.toLowerCase() == "true") {
                        showYesNoMessage(response.ResponseData,
                                function (e) {
                                    //user cick yes
                                    closeYesNoMessage();
                                    // successful response, navigate to portal main screen            
                                    var dataUrl = baseLink_PortalController + '/main' + window.location.search;
                                    OpenWindow(dataUrl);
                                }, function (e) {
                                    //user clicked no
                                    closeYesNoMessage();
                                    Logout(false);
                                    return;
                                }
                            );
                        return "";
                    }
                    // successful response, navigate to portal main screen            
                    var dataUrl = baseLink_PortalController + '/main' + window.location.search;
                    OpenWindow(dataUrl);
                });
            }
           
        });
}

/*
Get tab key
*/
function GetTabKey() {
    return $(".tab-key").text();
}

/*
Get Portal  title
*/
function GetPortalTitle() {
    return $(".portal-title").text();
}

/*
Navigate to login page
*/
function NavigateToLoginPage() {
    var urlParams = ParseUrlParams();
    var urlAccount = urlParams['account'];
    var accountByUrl = urlAccount != undefined ? "?account=" +urlAccount : "";
    var url = baseLink_SelfRegistrationController + "/login" + accountByUrl;
    OpenWindow(url);
}

/* 
handle session timeout 
check every 3 minutes if session is valid
*/
var timer;
function startSessionTimer() {
    timer = setInterval('IsSessionValid()', AsteaGlobals.Login.SessionValidationIntervalInMinutes);
}

/* every 3 minutes refresh homepage gadgets*/
var homePageTimer;
function startHomePageRefreshTimer() {
    homePageTimer = setInterval('RelaodHomePage()', AsteaGlobals.Home.ReloadHomePageIntervalInMinutes);
}

/// <summary>
/// Converts the qbe refresh interval to seconds.
/// </summary>
/// <param name="timerInterval">The timer interval in seconds.</param>
/// <returns></returns>
function ConvertQbeRefreshIntervalToSeconds(timerInterval) {

    var result;
    switch (timerInterval) {
        case "15-s":
        case "30-s":
        case "1-m":
            result = 1 * 1000 * 60;
            break;
        case "5-m":
            result = 5 * 1000 * 60;
            break;
        case "10-m":
            result = 10 * 1000 * 60;
            break;
        default:
            result = 0;
    }
    return result;
}


/*
validate session in server, called be timer by X interval
*/
function IsSessionValid() {
    var dataUrl = baseLink_LoginController + '/api-is_session-valid';
    Astea.Framework.Ajax.MakeAjaxCall_GetData(dataUrl, "", false,
        function (response) {
            if (response.Error != null) {
                // error happend due to session validation, check logs and logout
                Logout(true);
            }
            if (response.ResponseData == false) { // session is not valid
                // session has timed out
                Logout(true);
            }
        });
}
/*
Implement logout logic, do internal AA logout or redirect to login page.
InternalLogout will call if session is not valid by timer validation
*/
function Logout(navigateToLoginPage) {
    clearTimeout(timer);
    if (typeof (Chat) != "undefined") {
        Chat.CloseChat();
        Chat.Disconnect();
    }
    if (navigateToLoginPage != null && navigateToLoginPage != undefined && navigateToLoginPage == true) {
        $(window).unbind('beforeunload');
        $.blockUI({
            message: "<img style='padding:10px;display:none' alt='loading...' src='../../Content/images/loading_big.gif' />"
        });
        InternalLogout(function() {
            var dataUrl = baseLink_LoginController + '/logout';
            OpenWindow(dataUrl);
        });
    } else {
        InternalLogout();
    }

}

/*
Logout from AA server
*/
function InternalLogout(callBackFunction) {
    var url = baseLink_LoginController + '/api-logout';
    Astea.Framework.Ajax.MakeAjaxCall_GetData(url, "", "",
        function (response) {
            if (response.Error != null) {
                console.log('logut with error - ' + response.Error.ErrorMessage);
            }
            console.log('logut done');
            if (callBackFunction != null) {
                callBackFunction(true);
            }
        });
}

/*
Export maint page data (by provided module name and stateid)
*/
function Export(moduleName, boName, stateId, hostName, elementToBlock, callBackFunction) {
    var url = baseLink_FrameworkController + '/export-state';
    var jsonData = new Object();
    jsonData.moduleName = moduleName;
    jsonData.boName = boName;
    jsonData.stateId = stateId;
    jsonData.hostName = hostName;
    Astea.Framework.Ajax.MakeAjaxCall_GetData(url, jsonData, elementToBlock,
                function (response) {
                    if (response.ResponseType == "Response-Error") {
                        if (IsSessionTimeoutError(response))
                            return null;
                        else {
                            showErrorMessage(response.Error.ErrorMessage);
                            return null;
                        }
                    }
                    callBackFunction(response.ResponseData);
                });
}


/*
Export QBE data (by provided module name)
*/
function ExportQuery(moduleName,searchCriteria, elementToBlock, callBackFunction) {

    var url = baseLink_FrameworkController + '/export-query';
    var jsonData = new Object();
    jsonData.moduleName = moduleName;
    searchCriteria = searchCriteria.replaceAll("'", "''");
    if (searchCriteria != "") {
        searchCriteria = "'" + searchCriteria + "'";
    }
    jsonData.searchCriteria = searchCriteria;
    
    Astea.Framework.Ajax.MakeAjaxCall_GetData(url, jsonData, elementToBlock,
                function (response) {
                    if (response.ResponseType == "Response-Error") {
                        if (IsSessionTimeoutError(response))
                            return null;
                        else {
                            showErrorMessage(response.Error.ErrorMessage);
                            return null;
                        }
                    }
                    callBackFunction(response.ResponseData);
                });
}

/*
download file by provided URL
*/
function DownloadFile(url) {
    if (RunningByMobile()) {
        OpenWindow(url, "_blank");
    } else {
        var hiddenIFrameID = 'hiddenDownloader', iframe = document.getElementById(hiddenIFrameID);
        if (iframe == null) {
            iframe = document.createElement('iframe');
            iframe.id = hiddenIFrameID;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
        }
        iframe.src = url;
    }
}

/* determin if app running from mobile device */
function RunningByMobile() {
    var isMobile = (/Android|webOS|iPhone|iPad|iPod|pocket|psp|kindle|avantgo|blazer|midori|Tablet|Palm|maemo|plucker|phone|BlackBerry|symbian|IEMobile|mobile|ZuneWP7|Windows Phone|Opera Mini/i.test(navigator.userAgent));
    return isMobile;
}

/* close state for given stateId and module name*/
function CloseState(stateId, hostName, moduleName, elementToBlock) {
    if (stateId == null || stateId.length == 0)
        return;

    var jsonCloseState = new Object();
    jsonCloseState.stateId = stateId;
    jsonCloseState.moduleName = moduleName;
    jsonCloseState.hostName = hostName;

    var closeStateUrl = baseLink_FrameworkController + '/close-state';
    Astea.Framework.Ajax.MakeAjaxCall_UpdateData(closeStateUrl, jsonCloseState, elementToBlock,
        function (response) {
            if (response.Error != null) {
                if (IsSessionTimeoutError(response))
                    return null;
                else {
                    showErrorMessage(response.Error.ErrorMessage);
                    return null;
                }
            }
        });
}

/* temporary function to validate modules TODO: move this validation to server*/
function IsModuleSupported(moduleName) {
    return true;
    if (moduleName.startsWith("cp_service") || moduleName.startsWith("cp_orders") || moduleName.startsWith("cp_user") || moduleName.startsWith("cp_customer") || moduleName.startsWith("cp_repair_order") || moduleName.startsWith("cp_helpdesk_order")) {
        return true;
    }
    return false;
}

/*
Execute query  (by provided module name)
*/
function ExecuteQuery(entityName, queryName, sortCriteria, filterCriteria, elementToBlock, callBackFunction) {

    var url = baseLink_FrameworkController + '/execute-query';
    var jsonData = new Object();
    jsonData.entityName = entityName;
    jsonData.queryName = queryName;
    jsonData.sortCriteria = sortCriteria;
    jsonData.filterCriteria = filterCriteria;

    Astea.Framework.Ajax.MakeAjaxCall_GetData(url, jsonData, elementToBlock,
                function (response) {
                    if (response.ResponseType == "Response-Error") {
                        if (IsSessionTimeoutError(response))
                            return null;
                        else {
                            showErrorMessage(response.Error.ErrorMessage);
                            return null;
                        }
                    }
                    if (callBackFunction != null && callBackFunction != undefined) {
                        callBackFunction(response.Items);
                    } else {
                        return response.Items;
                    }
                });
}

function GetPartData(partName,ignoreCache, callBackFunction) {

    var url = baseLink_HomepageController + '/homepage-part';
    var jsonData = new Object();
    jsonData.partName = partName;
    jsonData.ignoreCache = ignoreCache;

    Astea.Framework.Ajax.MakeAjaxCall_GetData(url, jsonData, false,
                function (response) {
                    if (response.ResponseType == "Response-Error") {
                        if (IsSessionTimeoutError(response))
                            return null;
                        else {
                            showErrorMessage(response.Error.ErrorMessage);
                            return null;
                        }
                    }
                    if (callBackFunction != null && callBackFunction != undefined) {
                        callBackFunction(response.Items);
                    } else {
                        return response.Items;
                    }
                });
}

/* get data for request part (graph, chart etc..) */
function GetGadgetDataSource(partName, ignoreCache) {
    var url = baseLink_HomepageController + '/homepage-part';
    var jsonData = new Object();
    jsonData.partName = partName;
    jsonData.ignoreCache = ignoreCache;
    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: url,
                dataType: "json",
                type: "POST",
                data: jsonData,
                beforeSend: function (req) {
                    req.setRequestHeader('tabkey', GetTabKey());
                }
            }
        },
        schema: {
            data: function (data) {
                if (data.ResponseType == "Response-Error") {
                    if (IsSessionTimeoutError(data))
                        return null;
                    else {
                        showErrorMessage(data.Error.ErrorMessage);
                        return null;
                    }
                }
                return data.Items;
            },
            total: function (data) {
                return data.TotalCount;
            },
        }
    });
    return dataSource;
}

/* Get default view index in views array */
function GetDefaultViewIndex(arrayOfViews) {
    var defaultValue = 0;
    for (var i = 0; i < arrayOfViews.length; i++) {
        if (arrayOfViews[i].Visible == true && arrayOfViews[i].IsDefault == true) {
            defaultValue = i;
            break;
        }
    }
    return defaultValue;
}

// cookies handling  -----------------------------------------------------------
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var pluses = /\+/g;

    function encode(s) {
        return config.raw ? s : encodeURIComponent(s);
    }

    function decode(s) {
        return config.raw ? s : decodeURIComponent(s);
    }

    function stringifyCookieValue(value) {
        return encode(config.json ? JSON.stringify(value) : String(value));
    }

    function parseCookieValue(s) {
        if (s.indexOf('"') === 0) {
            // This is a quoted cookie as according to RFC2068, unescape...
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        try {
            // Replace server-side written pluses with spaces.
            // If we can't decode the cookie, ignore it, it's unusable.
            // If we can't parse the cookie, ignore it, it's unusable.
            s = decodeURIComponent(s.replace(pluses, ' '));
            return config.json ? JSON.parse(s) : s;
        } catch (e) { }
    }

    function read(s, converter) {
        var value = config.raw ? s : parseCookieValue(s);
        return $.isFunction(converter) ? converter(value) : value;
    }

    var config = $.cookie = function (key, value, options) {
        if (!key.contains('astea_client')) { // ignor client cookies, set only for user data
            key = GetTabKey() + '_' + key;
        }
        // Write

        if (value !== undefined && !$.isFunction(value)) {
            options = $.extend({}, config.defaults, options);

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setTime(+t + days * 864e+5);
            }
            if (options.secure == undefined) {
                options.secure = true;
            }
            return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path ? '; path=' + options.path : '',
				options.domain ? '; domain=' + options.domain : '',
				options.secure ? '; secure' : ''
            ].join(''));
        }

        // Read

        var result = key ? undefined : {};

        // To prevent the for loop in the first place assign an empty array
        // in case there are no cookies at all. Also prevents odd result when
        // calling $.cookie().
        var cookies = document.cookie ? document.cookie.split('; ') : [];

        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decode(parts.shift());
            var cookie = parts.join('=');

            if (key && key === name) {
                // If second argument (value) is a function it's a converter...
                result = read(cookie, value);
                break;
            }

            // Prevent storing a cookie that we couldn't decode.
            if (!key && (cookie = read(cookie)) !== undefined) {
                result[name] = cookie;
            }
        }

        return result;
    };

    config.defaults = {};

    $.removeCookie = function (key, options) {
        if ($.cookie(key) === undefined) {
            return false;
        }

        // Must not alter options, thus extending a fresh object...
        $.cookie(key, '', $.extend({}, options, { expires: -1 }));
        return !$.cookie(key);
    };

}));
// -----------------------------------------------------------------------------

function IsEmployee() {
    var portalType = $.cookie("astea_PortalType");
    return portalType == 'CustomerHTML5';
    
}

// check if cookie contain session, if not -> redirect to login page
// gotoLoginPage -> Boolean parameter to determine if redirect to login page I needed (defualt = true).
function IsCookieSessionVaid(gotoLoginPage) {
    if (gotoLoginPage == null | gotoLoginPage == undefined) {
        gotoLoginPage = true;
    }
    if ($.cookie("astea_SessionID") == null | $.cookie("astea_SessionID") == '') {
        Logout(gotoLoginPage);
        return false;
    }
    return true;
}

// check if ajax response is session timeout error
function IsSessionTimeoutError(response) {
    var sessionError = false;
    if (response.Error.ErrorCode == 'A2SEC009' || response.Error.ErrorMessage == 'A2SEC009') {
        sessionError = true;
        $.unblockUI();
        showErrorMessage(response.Error.ErrorMessage, function () {
            NavigateToLoginPage();
        });

    }
    return sessionError;
}

// get module details - for module name
function GetModuleDetails(moduleName) {
    var modulesList = JSON.parse($(".modules-list-as-json").text());
    return FindArrayEntryByKey(modulesList, "ModuleName", moduleName);
}

// get ddlb data source
function GetDdlbDataSource(entityName, queryName,module, sortCriteria, filterFields, enableEmptyValue, keyFieldName, displayFieldName) {
    AsteaLogger.WriteToLog("info", "Framework", kendo.format("start loading ddlb data ({0} -> {1})", entityName, queryName), "", false); // write log entry

    // create ddlb load url
    var ddlbUrl = baseLink_FrameworkController + '/execute-lookup';

    // set ddlb post data
    var postData = new Object();
    postData.entityName = entityName;
    postData.queryName = queryName;
    postData.module = module;
    postData.lookupColumns = "";
    postData.sortCriteria = sortCriteria;
    postData.filterFields = (filterFields == "" | filterFields.length == 0) ? "" : JSON.stringify(filterFields);

    // create data source object
    var ds = {
        transport: {
            cache: false,
            read: {
                dataType: "json",
                url: ddlbUrl,
                type: "POST",
                data: postData,
                beforeSend: function (req) {
                    req.setRequestHeader('tabkey', GetTabKey());
                }
            }
        }
        ,
        schema: {
            data: function (data) {
                if (data.ResponseType == "Response-Error") {
                    if (IsSessionTimeoutError(data))
                        return null;
                    else {
                        showErrorMessage(data.Error.ErrorMessage);
                        var emptyitem = new Object(); // return empty DS in case of error
                        emptyitem[keyFieldName] = "";
                        emptyitem[displayFieldName] = "";
                        return [emptyitem];
                    }
                }

                // add empty entry
                if (enableEmptyValue) {
                    var item = new Object();
                    item[keyFieldName] = "";
                    item[displayFieldName] = "";
                    data.Items.unshift(item);
                }

                AsteaLogger.WriteToLog("info", "Framework", kendo.format("finish loading ddlb data ({0} -> {1})", entityName, queryName), "", true); // write log entry

                return data.Items;
            }
        },
    };

    return ds;
};

// get lookup data source
function GetLookupDataSource(entityName, queryName,module, lookupColumns, filterFields, sortCriteria, enableEmptyValue, keyFieldName, displayFieldName, lookupKeyFieldName, lookupDisplayFieldName) {
    // create lookup load url
    var ddlbUrl = baseLink_FrameworkController + '/execute-lookup';

    // set lookup post data
    var postData = new Object();
    postData.entityName = entityName;
    postData.queryName = queryName;
    postData.module = module;
    postData.lookupColumns = JSON.stringify(lookupColumns);
    postData.sortCriteria = sortCriteria;
    postData.filterFields = filterFields.length == 0 ? "" : JSON.stringify(filterFields);

    // create data source object
    var ds = {
        requestStart: function (e) {
            AsteaLogger.WriteToLog("info", "Framework", kendo.format("start loading lookup data ({0} -> {1})", entityName, queryName), "", false); // write log entry
        },
        serverFiltering: true,
        ignoreCase: false,
        transport: {
            cache: false,
            read: {
                dataType: "json",
                url: ddlbUrl,
                type: "POST",
                data: postData,
                beforeSend: function (req) {
                    req.setRequestHeader('tabkey', GetTabKey());
                }
            }
        }
        ,
        schema: {
            data: function (data) {
                if (data.ResponseType == "Response-Error") {
                    if (IsSessionTimeoutError(data))
                        return null;
                    else {
                        showErrorMessage(data.Error.ErrorMessage);
                        var emptyitem = new Object(); // return empty DS in case of error
                        emptyitem[keyFieldName] = "";
                        emptyitem[displayFieldName] = "";
                        return [emptyitem];
                    }
                }

                // add empty entry only if there is at least one item
                if (enableEmptyValue & data.Items.length > 0) {
                    var emptyItem = new Object();

                    // set all columns from returned query
                    if (data.Items.length > 0) {
                        for (column in data.Items[0]) {
                            emptyItem[column.toString()] = "";
                        }
                    }

                    // set columns from state
                    emptyItem[keyFieldName] = "";
                    emptyItem[displayFieldName] = ""; // can be "FieldsConcatenation:serial_no,descr"

                    // check if we have function of multiple columns
                    if (displayFieldName.startsWith("FieldsConcatenation:")) {
                        $.each(displayFieldName.replaceAll("FieldsConcatenation:", "").split(","), function (fxFieldIndex, fxFieldName) {
                            emptyItem[fxFieldName] = "";
                        });
                    }

                    // add empty entry item
                    data.Items.unshift(emptyItem);
                }

                AsteaLogger.WriteToLog("info", "Framework", kendo.format("finish loading lookup data ({0} -> {1})", entityName, queryName), "", true); // write log entry

                // set lookup display & key fields
                $.each(data.Items, function (index, item) {
                    if (keyFieldName != lookupKeyFieldName) item[keyFieldName] = item[lookupKeyFieldName];
                    if (displayFieldName != lookupDisplayFieldName) item[displayFieldName] = item[lookupDisplayFieldName];
                });

                //// check if we need more server filters
                //if (data.OverRetrieveLimit == false) {
                //    lookupControl.setDataSource(data.Items);
                //}

                return data.Items;
            }
        },
    };

    return ds;
};

// reset lookup field
function ResetLookupField(sourceScreen, $scope, module, field, rowIndex, defaultResetValue) {
    // set local parameters according to source screen
    var lookupControl;
    var pageMetaData;
    var stateObject;
    var maintStateObject;
    switch (sourceScreen.toLowerCase()) {
        case "new":
            lookupControl = $scope.NewEntitiesLookups["lookup_" + module + "_" + field.Name];
            pageMetaData = $scope.ScreenData.NewEntities[module].PageMetadata;
            stateObject = $scope.ScreenData.NewEntities[module].Data[0];
            break;
        case "maint":
            lookupControl = $scope.ScreenLookups["lookup_" + field.Name + "_index_" + rowIndex.toString()];
            pageMetaData = $scope.PageMetaData;
            stateObject = $scope.ScreenData[module].Rows[rowIndex];
            break;
        case "xref":
            lookupControl = $scope.XrefLookups["lookup_" + field.ParentGroupName + "_" + field.Name + "_index_" + rowIndex.toString()];
            pageMetaData = $scope.Xref.maintPageMetaData;
            stateObject = $scope.Xref.entityMaint;
            break;
        case "new-xref":
            lookupControl = $scope.XrefNewLookups["lookup_" + field.ParentGroupName + "_" + field.Name];
            pageMetaData = $scope.Xref.newPageMetaData;
            stateObject = $scope.Xref.entityNew;
            break;
        case "maint-action":
            lookupControl = $scope.MaintActionsLookups["lookup_" + field.Name];
            pageMetaData = $scope.ActionWindowMetaData;
            stateObject = $scope.ActionsData;

            if (module != null && module.toLowerCase() !== 'cp_basket') {
                maintStateObject = $scope.ScreenData[module].Rows[rowIndex];
            }
            else if (module != null && module.toLowerCase() === 'cp_basket') {
                maintStateObject = $scope.BasketItems[rowIndex];
                maintStateObject = BuildStateObject(maintStateObject, pageMetaData);
            } else {
                maintStateObject = $scope.ActionsData;
            }
            break;
        case "qbe-action":
            lookupControl = $scope.QBEActionsLookups["lookup_" + field.Name];
            pageMetaData = $scope.ActionsMetadata[field.Name];
            stateObject = $scope.ActionsData[field.Name];
            break;
        case "card":
            lookupControl = $scope.CardLookups["lookup_" + field.Name];
            pageMetaData = $scope.CardMetadata;
            stateObject = $scope.CardData[field.Name];
            break;
        case "promptwindow":
            lookupControl = $scope.XrefNewLookups["lookup_" + field.ParentGroupName + "_" + field.Name];
            pageMetaData = $scope.PageMetaData.PromptWindowTab;
            stateObject = $scope.Xref.entityNew;
            break;
    }

    if (lookupControl == undefined) {
        AsteaLogger.WriteToLog("error", "FW", kendo.format("error while building {0} lookupControl", field.Name), "", false); // write log entry when cannot build lookup
        return;
    }

    // calculate lookup width based on MD ColumnWidth
    var lookupAreaWidth = 0;
    var titleExists = true;
    $.each(field.Lookup.LookupColumns, function (index, lookupColumn) {
        if (lookupColumn.Element_columnwidth != null) {
            lookupAreaWidth += parseInt(lookupColumn.Element_columnwidth);
        }
        titleExists = lookupColumn.Title.length > 0;
    });
    // add custom class for lookups

    var obj = lookupControl.wrapper.closest(".maint-entity-group-field-cell");
    if (titleExists) {
        if (lookupAreaWidth <= 525) {
            lookupControl.list.addClass("maint-lookup-list-area");
        } else {
            //lookupControl.list.width(lookupAreaWidth);
            lookupControl.list.css("width", lookupAreaWidth + "px");
        }
    } else {
        lookupControl.list.css("width", "250px");
    }
	
    // set reset default value
    if (defaultResetValue != undefined) {
        lookupControl.value(defaultResetValue);
    }

    // remove control events
    lookupControl.unbind("dataBound");
    lookupControl.unbind("change");
    lookupControl.unbind("open");

    
    //disable control if page is disable
    if ($scope.EnablePageEditing === false && sourceScreen.toLowerCase() != "maint-action") {
        lookupControl.enable(false);
    }

    var idx = FindArrayEntryIndexByKey(field.Lookup.LookupColumns, "Element_displayonly", "true"); // check if one of the columns is for display, if true, do not set it as default value from state (idx > -1)

    // set empty data source
    var stateData = new Object();
    if (sourceScreen.toLowerCase() != "maint-action" && sourceScreen.toLowerCase() != "qbe-action" && idx == -1) { // bind initial value to state for NON actions lookups
        $.each(field.Lookup.LookupColumns, function (index, lookupColumn) { // loop through lookup columns list
            stateData[lookupColumn.Name] = stateObject[lookupColumn.Name] == null ? '' : stateObject[lookupColumn.Name].Value;
        });

        // add also display and Key column field if description column is diffrent that  DisplayValue
        stateData[field.Lookup.LookupAttribute_displayvalue] = stateObject[field.Lookup.LookupAttribute_displayvalue] == null ? '' : stateObject[field.Lookup.LookupAttribute_displayvalue].Value;
        stateData[field.Lookup.LookupAttribute_keyvalue] = stateObject[field.Lookup.LookupAttribute_keyvalue] == null ? '' : stateObject[field.Lookup.LookupAttribute_keyvalue].Value;
    }

    // map lookup for action window
    if (sourceScreen.toLowerCase() == "maint-action") {
        $.each(field.Lookup.LookupColumns, function (index, lookupColumn) {
            stateData[lookupColumn.Name] = maintStateObject[lookupColumn.Name] == null ? '' : maintStateObject[lookupColumn.Name].Value;
        });

        // add also display and Key column field if description column is diffrent that  DisplayValue
        stateData[field.Lookup.LookupAttribute_displayvalue] = maintStateObject[field.Lookup.LookupAttribute_displayvalue] == null ? '' : maintStateObject[field.Lookup.LookupAttribute_displayvalue].Value;
        stateData[field.Lookup.LookupAttribute_keyvalue] = maintStateObject[field.Lookup.LookupAttribute_keyvalue] == null ? '' : maintStateObject[field.Lookup.LookupAttribute_keyvalue].Value;
    }

    // set lookup data source
    lookupControl.setDataSource(new kendo.data.DataSource({ data: [stateData] }));

    // create sort criteria
    var sortCriteria = "";
    if (field.Lookup.LookupAttribute_sortcolumn != "") {
        sortCriteria = field.Lookup.LookupAttribute_sortcolumn + " " + field.Lookup.LookupAttribute_sortdirection;
    }

    // create filter criteria
    var filterFields = new Array();
    if (field.Lookup.FilterFields != null && field.Lookup.FilterFields.length > 0) {
        $.each(field.Lookup.FilterFields, function (index, filterField) { // loop through filter fields list            
            var filterFieldType = (pageMetaData.AllFieldsTypes[filterField.Name]) ? pageMetaData.AllFieldsTypes[filterField.Name].FieldAttribute_type : "string";
            var filterFieldName = filterField.Name;
            var filterFieldAlias = (filterField.Alias == "" | filterField.Alias == null) ? filterField.Name : filterField.Alias;

            var currentSate = maintStateObject;
            if (stateObject != null && stateObject[filterFieldName] != null)
                currentSate = BuildStateObject(stateObject,pageMetaData);
            
            if (currentSate[filterFieldName] != null && currentSate[filterFieldName].Value != null && currentSate[filterFieldName].Value.toString() != "") {
                // create filter field
                var filterField = new Object();
                filterField.FieldType = filterFieldType.toString();
                filterField.FieldName = filterFieldAlias.toString();
                filterField.FieldValue = currentSate[filterFieldName].Value.toString();
                filterField.FieldOperator = field.Lookup.LookupAttribute_operator == null ? "" : field.Lookup.LookupAttribute_operator;
                // add to filter fields array
                filterFields.push(filterField);
            }
        });
    }

    // create lookup data source
    var ds = GetLookupDataSource(
        field.Lookup.LookupAttribute_entityname != null ? field.Lookup.LookupAttribute_entityname : "", // entity name
        field.Lookup.LookupAttribute_queryname != null ? field.Lookup.LookupAttribute_queryname : "", // query name
        field.Lookup.LookupAttribute_module != null ? field.Lookup.LookupAttribute_module : "", // module name, override query and entity (backward compatibility to avoid duplicate definitions)
        field.Lookup.LookupColumns,
        filterFields,
        sortCriteria, // sort criteria
        field.Lookup.LookupAttribute_enableemptyvalue == null ? true : field.Lookup.LookupAttribute_enableemptyvalue.toString().toLowerCase() == "true", // enable empty value
        field.Lookup.LookupAttribute_keyvalue, // key field name
        field.Lookup.LookupAttribute_displayvalue, // display field name
        field.Lookup.LookupKeyValue, // lookup key field name
        field.Lookup.LookupDisplayValue == null ? field.Lookup.LookupKeyValue : field.Lookup.LookupDisplayValue // lookup display field name (if empty, use key value)
    );
    lookupControl.bind("change",
        function (e) {
            var selectedText = this.text();
            var descrFieldName = field.Lookup.LookupAttribute_displayvalue;
            if (descrFieldName != undefined) {
                switch (sourceScreen.toLowerCase()) {
                case "xref":
                    //$scope.Xref.entityMaint[descrFieldName] = selectedText;
                    $scope.XrefLookupsDisplayData[descrFieldName] = selectedText;
                    break;
                }
            }
        });
    
   // if message defined, disply it when lookup data is empty
    if (field.Lookup.LookupAttribute_nodatamessage != undefined && field.Lookup.LookupAttribute_nodatamessage.length > 0) {
        lookupControl.bind("dataBound",
            function (e) {
                var msg = AsteaUI.GetTranslatedLabel(field.Lookup.LookupAttribute_nodatamessage, field.Lookup.LookupAttribute_nodatamessage);
                var lookupItems = e.sender.dataSource._data.length;
                e.sender.ul.parent().find(".no-records").remove();
                if (lookupItems == 0) {
                    e.sender.ul.parent().append("<div class='no-records' >" + msg + "</div>");
                }
            });
    }

    // check if we need to clear to other fields - on change
    if (field.Lookup.ResetFields != null && field.Lookup.ResetFields.length > 0) {
        // bind to change event
        lookupControl.bind("change",
            function () {
                $.each(field.Lookup.ResetFields, function (index, resetField) { // loop through reset fields list
                    // TODO: we need to know how to use ddlb field type in filter criteria - as string (with '') or as number or... 
                    var resetFieldType = "string";
                    var resetFieldName = resetField.Name;
                    var defaultResetValue = FindArrayEntryValueByKey(resetField.Attributes, "Key", "defaultresetvalue", "Value", "");
                    
                    // get reference to reset field
                    var resetField = pageMetaData.AllFields[resetField.Name];
                    
                    // reset target field
                    switch (resetField.FieldAttribute_type.toLowerCase()) {
                        case "lookup":
                            ResetLookupField(sourceScreen, $scope, module, resetField, rowIndex, defaultResetValue);
                            break;

                        case "ddlb":
                            ResetDdlbField(sourceScreen, $scope, module, resetField, rowIndex, defaultResetValue);
                            break;
                    }
                    
                    // reset also field value in memory
                    if (stateObject[resetField.Name].Value != undefined) {
                        stateObject[resetField.Name].Value = defaultResetValue;
                    }
                    if (stateObject[resetField.Name] != undefined) { // action windpw state
                        stateObject[resetField.Name].Value = defaultResetValue;
                    }

                    // refresh ui
                    $scope.$apply();
                });
            }
        );
    }

    // attach open event
    lookupControl.one("open", function (e) {
        // create empty data source
        var emptyDataSource = new kendo.data.DataSource({
            data: []
        });

        // set data source for lookup
        lookupControl.setDataSource(ds);
    });
}

    /// <summary>
    /// Determines whether xref form is valid based on populated array of mandatory values (populate in OnDdlbLookupChange during conditions validation).
    /// </summary>
    /// <param name="$scope">The $scope.</param>
    /// <returns></returns>
function IsXrefFormValid($scope) {

    var valid = true;
    if ($scope.Xref == null || $scope.Xref.MandatoryValues.length == 0)
        return valid;

    $.each($scope.Xref.MandatoryValues, function (name, value) {
        if (value) {
            valid = false;
        }
    });

    return valid;
}

    /// <summary>
    /// Updates the xref form validation when mandatory control changed.
    /// </summary>
    /// <param name="$scope">The $scope.</param>
    /// <param name="controlName">Name of the control.</param>
    /// <param name="valid">The valid.</param>
    /// <returns></returns>
function UpdateXrefFormValid($scope,controlName,valid) {
    if ($scope.Xref == null || $scope.Xref.MandatoryValues.length == 0)
        return;

    $.each($scope.Xref.MandatoryValues, function (name, value) {
        if (name == controlName) {
            $scope.Xref.MandatoryValues[name] = valid;
        }
    });
}

/// <summary>
/// Called when [DDLB lookup change].
/// appy actions (empty,disable,mandatory) based on pre-defined condition
/// </summary>
/// <param name="sourceScreen">The source screen. (maint, new etc..)</param>
/// <param name="dependencyFields">list of dependency fields.</param>
/// <param name="$scope">The $scope.</param>
/// <param name="rowIndex">Index of the row.</param>
/// <returns></returns>
function OnDdlbLookupChange(sourceScreen,dependencyFields, $scope, rowIndex) {
    if (rowIndex == undefined) // default for maint pages
        rowIndex = 0;
    var currenttDomElement;
    if (!$scope.Xref) {
        $scope.Xref = new Object();
    }
    var disablePage = (!$scope.DisableXrefPage) ? false : $scope.DisableXrefPage;
    $scope.Xref.MandatoryValues = new Object();
    var useDontPromptValues = false;
    //var pageName = sourceScreen == "Maint" ? $scope.PageMetaData.Name : $scope.Xref.maintPageMetaData.Name;
    var metaData = null;//sourceScreen == "Maint" ? $scope.PageMetaData : $scope.Xref.maintPageMetaData;
    var stateObject = null;
    switch (sourceScreen.toLowerCase()) {
        case "maint":
            metaData = $scope.PageMetaData;
            currenttDomElement = $scope.DomElement;
            stateObject = $scope.ScreenData["main"].Rows[rowIndex];
            break;
        case "maint-xref":
            metaData = $scope.Xref.maintPageMetaData;
            currenttDomElement = $scope.DomElement;
            stateObject = $scope.Xref.entityMaint;
            break;
        case "maint-action":
            metaData = new Object();
            metaData.Tabs = [];
            metaData.Tabs.push($scope.ActionWindowMetaData);
            currenttDomElement = $scope.ActionDomElement;
            stateObject = $scope.ActionsData;
            break;
        case "new":
            metaData = $scope.ScreenData.NewEntities[$scope.ScreenGlobals.Module].PageMetadata;
            currenttDomElement = $scope.DomElement;
            stateObject = $scope.ScreenData.NewEntities[$scope.ScreenGlobals.Module].Data[0];
            break;
        case "new-xref":
            metaData = $scope.Xref.newPageMetaData;;
            currenttDomElement = $scope.DomElement;
            stateObject = $scope.Xref.entityNew;
            break;
        case "promptwindow":
            metaData = new Object();
            metaData.Tabs = [];
            metaData.Tabs.push($scope.PageMetaData.PromptWindowTab);
            currenttDomElement = $scope.PromptDomElement;
            stateObject = $scope.Xref.entityNew;//$scope.ScreenData["main"].Rows[rowIndex];
            useDontPromptValues = true;
            break;
    }
    var needResize = false;
   

    $.each(dependencyFields, function (idx, dependencyField) {

        var targetFieldsControls = new Object();
        var targetGroupsControls = new Object();
        var sourceFieldsControls = new Object();
        var controlTypes = new Object();
        var dependencyTabContainerName = dependencyField.ParentTabName;
        
        $.each(dependencyField.SourceFields, function (idx, sourceFieldName) {
            //var sourceField = sourceScreen == "Maint" ? $scope.PageMetaData.AllFields[sourceFieldName] : $scope.Xref.maintPageMetaData.AllFields[sourceFieldName];
            var sourceField = AsteaMetadata.FindField(metaData, dependencyTabContainerName, "", sourceFieldName);
            var sourceFieldType = sourceField ? sourceField.FieldAttribute_type : "";
            var sourceControl = null;
            var controlName = "";
            var isStaticDdlb;
            switch (sourceScreen.toLowerCase()) {
                case "maint":
                    switch (sourceFieldType.toLowerCase()) {
                        case "ddlb":
                            isStaticDdlb = sourceField.Lookup.LookupAttribute_ddlbtype == "static";
                            sourceControl = isStaticDdlb == false ? $scope.ScreenDDLBs["ddlb_" + sourceFieldName + "_index_0"] : $scope.ScreenDDLBs["ddlb_" + sourceFieldName];
                            break;
                        case "lookup":
                            sourceControl = $scope.ScreenLookups["lookup_" + sourceFieldName + "_index_0"];
                            break;
                        case "duration":
                            sourceControl = $scope.DurationDDLBs["ddlb_" + sourceFieldName + "_index_0"];
                            break;
                        default:
                            if (sourceFieldType == "") {
                                sourceControl = null;
                            }
                            else {
                                controlName = kendo.format("{0}_{1}", sourceField.ParentGroupName, sourceField.Name);
                                sourceControl = currenttDomElement.find('.' + controlName);
                            }
                            break;
                    }
                    break;
                case "maint-action":
                    switch (sourceFieldType.toLowerCase()) {
                        case "ddlb":
                        case "duration":
                            //isStaticDdlb = sourceField.Lookup.LookupAttribute_ddlbtype == "static";
                            sourceControl = $scope.MaintActionsDDLBs["ddlb_" + sourceFieldName];
                            break;
                        case "lookup":
                            sourceControl = $scope.MaintActionsLookups["lookup_" + sourceFieldName];
                            break;
                        default:
                            if (sourceFieldType == "") {
                                sourceControl = null;
                            }
                            else {
                                controlName = kendo.format("{0}_{1}", sourceField.ParentGroupName, sourceField.Name);
                                sourceControl = $scope.ActionDomElement.find('.' + controlName);
                            }
                            break;
                    }
                    break;
                case "maint-xref":
                    var groupName = sourceField.ParentGroupName + "_" + sourceFieldName;
                    switch (sourceFieldType.toLowerCase()) {
                        case "ddlb":
                            isStaticDdlb = sourceField.Lookup.LookupAttribute_ddlbtype == "static";
                            sourceControl = isStaticDdlb == false ? $scope.XrefDDLBs["ddlb_" + sourceFieldName + "_index_" + rowIndex.toString()] : $scope.XrefDDLBs["ddlb_" + sourceFieldName];
                            break;
                        case "lookup":
                            sourceControl = $scope.XrefLookups["lookup_" + groupName + "_index_" + rowIndex.toString()];
                            break;
                        case "duration":
                            sourceControl = $scope.XrefDurationDDLBs["ddlb_" + sourceFieldName + "_index_" + rowIndex.toString()];
                            break;
                        default:
                            if (sourceFieldType == "") {
                                sourceControl = null;
                            }
                            else {
                                controlName = kendo.format("{0}_{1}", sourceField.ParentGroupName, sourceField.Name);
                                sourceControl = $('.xrefMaintPage').find('.' + controlName);
                               
                            }
                            break;
                    }
                    break;
                case "new":
                    switch (sourceFieldType.toLowerCase()) {
                        case "ddlb":                            
                            sourceControl = $scope.NewEntitiesDdlbs["ddlb_" + $scope.ScreenGlobals.Module + "_" + sourceFieldName];
                            break;
                        case "lookup":
                            sourceControl = $scope.NewEntitiesLookups["lookup_" + $scope.ScreenGlobals.Module + "_" + sourceFieldName];
                            break;
                        case "duration":
                            sourceControl = $scope.NewDurationDDLBs["ddlb_" + $scope.ScreenGlobals.Module + "_" + sourceFieldName];
                            break;
                        default:
                            if (sourceFieldType == "") {
                                sourceControl = null;
                            }
                            else {
                                controlName = kendo.format("{0}_{1}", sourceField.ParentGroupName, sourceField.Name);
                                sourceControl = $(".new-entity-container").find('.' + controlName);
                            }
                            break;
                    }
                    break;
                case "new-xref":
                case "promptwindow":
                    switch (sourceFieldType.toLowerCase()) {
                        case "ddlb":
                            sourceControl = $scope.XrefNewDDLBs["ddlb_" + sourceField.ParentGroupName + "_" + sourceFieldName];
                            break;
                        case "lookup":
                            sourceControl = $scope.XrefNewLookups["lookup_" + sourceField.ParentGroupName + "_" + sourceFieldName];
                            break;
                        case "duration":
                            sourceControl = $scope.XrefNewDurationDDLBs["ddlb_" + sourceFieldName + "_index_" + rowIndex.toString()];
                            break;
                        default:
                            if (sourceFieldType == "") {
                                sourceControl = null;
                            }
                            else {
                                controlName = kendo.format("{0}_{1}", sourceField.ParentGroupName, sourceField.Name);
                                sourceControl = $(".new-entity-container").find('.' + controlName);
                            }
                            break;
                    }
                    break;
            }
            if (!sourceControl || sourceControl.length == 0) {
                AsteaLogger.WriteToLog("error", "FW", kendo.format("Couldn't found control {0}, check condition/field defintion in MD", sourceFieldName), "", false);
            }            
            sourceFieldsControls[sourceFieldName] = sourceControl;
            controlTypes[sourceFieldName] = sourceFieldType.toLowerCase();
            
        });
        
        // loop on target fields
        $.each(dependencyField.TargetFields, function(idx, targetFieldName) {
                //var targetField = sourceScreen == "Maint" ? $scope.PageMetaData.AllFields[targetFieldName] : $scope.Xref.maintPageMetaData.AllFields[targetFieldName];
                var targetField = AsteaMetadata.FindField(metaData, dependencyTabContainerName, "", targetFieldName);
                var mandatoryByMd = !targetField || targetField.FieldAttribute_mandatory == undefined ? false : targetField.FieldAttribute_mandatory == "true";
                // if control is mandatory or dosabled in MD - do NOT apply condition on it
                if (targetField != undefined && !mandatoryByMd) {

                    var targetFieldType = targetField && targetField.FieldAttribute_type ? targetField.FieldAttribute_type.toLowerCase() : "";
                    var targetControl = null;
                    var controlName = "";
                    switch (sourceScreen.toLowerCase()) {
                        case "maint":
                        switch (targetFieldType) {
                        case "ddlb":
                            targetControl = $scope.ScreenDDLBs["ddlb_" + targetFieldName + "_index_0"];
                            break;
                        case "lookup":
                            targetControl = $scope.ScreenLookups["lookup_" + targetFieldName + "_index_0"];
                            break;
                        case "duration":
                            targetControl = $scope.DurationDDLBs["ddlb_" + targetFieldName + "_index_0"];
                            break;
                        default:
                            if (targetFieldType == "") {
                                targetControl = null;
                            }
                            else {
                                controlName = kendo.format("{0}_{1}", targetField.ParentGroupName, targetField.Name);
                                targetControl = $scope.DomElement.find('.' + controlName);
                            }
                            break;
                        }
                        break;
                    case "maint-action":
                        switch (targetFieldType) {
                        case "ddlb":
                        case "duration":
                            targetControl = $scope.MaintActionsDDLBs["ddlb_" + targetFieldName];
                            break;
                        case "lookup":
                            targetControl = $scope.MaintActionsLookups["lookup_" + targetFieldName];
                            break;
                        default:
                            if (targetFieldType == "") {
                                targetControl = null;
                            }
                            else {
                                controlName = kendo.format("{0}_{1}", targetField.ParentGroupName, targetField.Name);
                                targetControl = $scope.ActionDomElement.find('.' + controlName);
                            }
                            break;
                        }
                        break;
                    case "maint-xref":
                        var groupName = targetField.ParentGroupName + "_" + targetFieldName;
                        switch (targetFieldType) {
                        case "ddlb":
                            targetControl = $scope.XrefDDLBs["ddlb_" + targetFieldName + "_index_" + rowIndex.toString()];
                            break;
                        case "lookup":
                            targetControl = $scope.XrefLookups["lookup_" + groupName + "_index_" + rowIndex.toString()];
                            break;
                        case "duration":
                            targetControl = $scope.XrefDurationDDLBs["ddlb_" + targetFieldName + "_index_" + rowIndex.toString()];
                            break;
                        default:
                            if (targetFieldType == "") {
                                targetControl = null;
                            }
                            else {
                                controlName = kendo.format("{0}_{1}", targetField.ParentGroupName, targetField.Name);
                                targetControl = $('.xrefMaintPage').find('.' + controlName);
                            }
                            break;
                        }
                        break;
                        case "new":
                            switch (targetFieldType) {
                                case "ddlb":
                                    targetControl = $scope.NewEntitiesDdlbs["ddlb_" + $scope.ScreenGlobals.Module + "_" + targetFieldName];
                                    break;
                                case "lookup":
                                    targetControl = $scope.NewEntitiesLookups["lookup_" + $scope.ScreenGlobals.Module + "_" + targetFieldName];
                                    break;
                                case "duration": //XrefDurationDDLBs.ddlb_cc_duration_index_0
                                    targetControl = $scope.NewDurationDDLBs["ddlb_" + $scope.ScreenGlobals.Module + "_" + targetFieldName];
                                    break;
                                default:
                                    if (targetFieldType == "") {
                                        targetControl = null;
                                    }
                                    else {
                                        controlName = kendo.format("{0}_{1}", targetField.ParentGroupName, targetField.Name);
                                        targetControl = $(".new-entity-container").find('.' + controlName);
                                    }
                                    break;
                            }
                            break;
                        case "new-xref":
                        case "promptwindow":
                            switch (targetFieldType.toLowerCase()) {
                                case "ddlb":
                                    //isStaticDdlb = sourceField.Lookup.LookupAttribute_ddlbtype == "static";
                                    targetControl = $scope.XrefNewDDLBs["ddlb_" + targetField.ParentGroupName + "_" + targetFieldName];
                                    break;
                                case "lookup":
                                    targetControl = $scope.XrefNewLookups["lookup_" + targetField.ParentGroupName + "_" + targetFieldName];
                                    break;
                                case "duration": //XrefDurationDDLBs.ddlb_cc_duration_index_0
                                    targetControl = $scope.XrefNewDurationDDLBs["ddlb_" + targetFieldName + "_index_" + rowIndex.toString()];
                                    break;
                                default:
                                    if (targetFieldType == "") {
                                        targetControl = null;
                                    }
                                    else {
                                        controlName = kendo.format("{0}_{1}", targetField.ParentGroupName, targetField.Name);
                                        var containerName = sourceScreen.toLowerCase() == "promptwindow" ? "prompt-popup-container" : "new-entity-container";
                                        targetControl = $("." + containerName).find('.' + controlName);
                                    }
                                    break;
                            }
                            break;
                    }
                    if (!targetControl || targetControl.length == 0) {
                        AsteaLogger.WriteToLog("error", "FW", kendo.format("Couldn't found control {0}, check condition/field defintion in MD", targetFieldName), "", false);
                    }
                    targetFieldsControls[targetFieldName] = targetControl;
                    controlTypes[targetFieldName] = targetFieldType;
                }
            });
        
        // loop on target groups
        $.each(dependencyField.TargetGroups, function (idx, targetGroupName) {
            //var targetGroupControl = $scope.DomElement.find('.' + targetGroupName);
            var targetGroupControl = currenttDomElement.find("div[group-name='" + targetGroupName + "']");
            if (targetGroupControl.length > 0) {
                targetGroupsControls[targetGroupName] = targetGroupControl;
            }
        });
        
        var onChangeCondition = dependencyField.Condition;
        var action = dependencyField.Action;
        var tempIdx = 0;
        $.each(sourceFieldsControls, function (name, sourceFieldsControl) {
            var controlValue;
            if (!sourceFieldsControl && stateObject[name] != undefined) { // incase source control is in state only and not exists in DOM
                controlValue = stateObject[name].Value;
            } 
            var currentValue = "";
            var controlType = controlTypes[name];
            if (useDontPromptValues) {
                var fieldName = name.replace("field[", "").replace("]", "");
                currentValue = stateObject[fieldName].Value;
            } else {
                switch (controlType.toLowerCase()) {
                case "ddlb":
                case "lookup":
                case "duration":
                    currentValue = controlValue == null ? sourceFieldsControl.value() : controlValue;
                    break;
                default:
                    currentValue = controlValue == null ? sourceFieldsControl[0].value : controlValue;
                    break;
                }
            }
            if (tempIdx == 0) {
                AsteaLogger.WriteToLog("info", "FW", kendo.format("Field condition before populating values {0}", onChangeCondition), "", false);
            }
            if (useDontPromptValues) {
                if (!stateObject[name]) {
                    onChangeCondition = onChangeCondition.replaceAll('field[' + name + ']', currentValue);
                }
                onChangeCondition = ConvertConditionByStateValues(onChangeCondition, stateObject);
            } else {
                if ($.isNumeric(currentValue)) {
                    onChangeCondition = onChangeCondition.replaceAll('field[' + name + ']', currentValue);
                    if (onChangeCondition.contains('field[')) // condition contain field from state
                    {
                        onChangeCondition = ConvertConditionByStateValues(onChangeCondition, stateObject);
                    }
                } else {
                    onChangeCondition = onChangeCondition.replaceAll('field[' + name + ']', "\'" + currentValue.trim() + "\'");
                    if (onChangeCondition.contains('field[')) // condition contain field from state
                    {
                        onChangeCondition = ConvertConditionByStateValues(onChangeCondition, stateObject);
                    }
                }
            }
            tempIdx++;
        });
        
        onChangeCondition = ConvertConditionOperators(onChangeCondition);
        AsteaLogger.WriteToLog("info", "FW", kendo.format("Field condition after populating values {0}", onChangeCondition), "", false);
        if (onChangeCondition != dependencyField.Condition) {
            var valid;
            try {
                valid = $scope.$eval(onChangeCondition);
            } catch (e) {
                AsteaLogger.WriteToLog("error", "FW", kendo.format("Fail to evaluate condition {0} Error {1}", onChangeCondition, e.message), false);
                return;
            }
            var validMandatory = valid;
            $.each(targetGroupsControls, function (name, targetGroupControl) {
                var actions = action.split(';');
                $.each(actions, function (idx, act) {
                    switch (act.toLowerCase()) {
                        case "hide":
                            if (valid) {
                                targetGroupControl.addClass("hide");
                                needResize = true;
                            }
                            break;
                        case "show":
                            if (valid) {
                                targetGroupControl.removeClass("hide");
                                needResize = true;
                            }
                            break;
                        case "enable":
                            if (!disablePage) {
                                if (valid) {
                                    targetGroupControl.removeClass("disabled-div");
                                }
                            }
                            break;
                        case "disable":
                            if (!disablePage) {
                                if (valid) {
                                    targetGroupControl.addClass("disabled-div");
                                }
                            }
                            break;
                    };
                });
            });
            $.each(targetFieldsControls, function (name, targetFieldControl) {
                validMandatory = valid;
                var className = sourceScreen.toLowerCase() == "new" ? "new-entity-field-container" : "maint-entity-group-field-container";
                if (sourceScreen.toLowerCase() == "maint-xref") {
                    className = "maint-entity-group-field-container";
                }
                if (targetFieldControl != undefined) {
                    var controlType = controlTypes[name];
                    if (controlType != "ddlb" && controlType != "lookup" && targetFieldControl.length == 0) // control not exists on DOM (posbile removed by customizer)
                        return;
                    var actions = action.split(';');
                    $.each(actions, function (idx, act) {
                        switch (act.toLowerCase()) {
                            case "mandatory":
                                switch (controlType) {
                                    case "ddlb":
                                    case "lookup":
                                    case "duration":
                                        if (targetFieldControl.value().length > 0) { // if control was mandtory due to condition, remove mandatory
                                            validMandatory = false;
                                        }
                                        break;
                                    default:
                                        if (targetFieldControl[0].value.length > 0) { // if control was mandtory due to condition, remove mandatory
                                            validMandatory = false;
                                        }
                                        break;
                                }
                                switch (controlType) {
                                    case "ddlb":
                                    case "duration":
                                        if (validMandatory) {
                                            targetFieldControl.wrapper.addClass("ng-invalid").addClass("ng-invalid-required");
                                            targetFieldControl.wrapper.removeClass("ng-valid").removeClass("ng-valid-required");
                                        } else {
                                            targetFieldControl.wrapper.removeClass("ng-invalid").removeClass("ng-invalid-required");
                                            targetFieldControl.wrapper.addClass("ng-valid").addClass("ng-valid-required");
                                        }
                                        break;
                                    case "lookup":
                                        if (validMandatory) {
                                            targetFieldControl.wrapper.find('select').addClass("ng-invalid").addClass("ng-invalid-required");
                                            targetFieldControl.wrapper.find('select').removeClass("ng-valid").removeClass("ng-valid-required");
                                        } else {
                                            targetFieldControl.wrapper.find('select').removeClass("ng-invalid").removeClass("ng-invalid-required");
                                            targetFieldControl.wrapper.find('select').addClass("ng-valid").addClass("ng-valid-required");
                                        }
                                        break;
                                    default:
                                        if (validMandatory) {
                                            targetFieldControl.addClass("ng-invalid").addClass("ng-invalid-required");
                                            targetFieldControl.removeClass("ng-valid").removeClass("ng-valid-required");
                                        } else {
                                            targetFieldControl.removeClass("ng-invalid").removeClass("ng-invalid-required");
                                            targetFieldControl.addClass("ng-valid").addClass("ng-valid-required");
                                        }
                                }
                                $scope.Xref.MandatoryValues[name] = validMandatory;
                                break;
                            case "hide": // hide action based on condition
                                switch (controlType) {
                                    case "ddlb":
                                    case "lookup":
                                    case "duration":
                                        var objectContainer = targetFieldControl.wrapper != undefined ? targetFieldControl.wrapper.closest("." + className) : targetFieldControl.closest("." + className);
                                        if (valid) {
                                            objectContainer.hide();
                                            if (dependencyField.Empty && targetFieldControl.value().length > 0)
                                                targetFieldControl.value('');
                                        } 
                                        break;
                                    default:
                                        if (valid) {
                                            targetFieldControl.closest('.' + className).addClass('hide');
                                        }
                                        break;
                                }
                                needResize = true;
                                break;
                            case "show": // show action based on condition
                                switch (controlType) {
                                    case "ddlb":
                                    case "lookup":
                                    case "duration":
                                        var objectContainer = targetFieldControl.wrapper != undefined ? targetFieldControl.wrapper.closest("." + className) : targetFieldControl.closest("." + className);
                                        if (valid) {
                                            objectContainer.show();
                                            if (dependencyField.Empty && targetFieldControl.value().length > 0)
                                                targetFieldControl.value('');
                                        }
                                        break;
                                    default:
                                        if (valid) {
                                            targetFieldControl.closest('.' + className).removeClass('hide');
                                        }
                                        break;
                                }
                                needResize = true;
                                break;
                            case "disable": // enable/disable action based on condition
                                switch (controlType) {
                                    case "ddlb":
                                    case "lookup":
                                    case "duration":
                                        if (!disablePage) {
                                            if (valid) {
                                                targetFieldControl.enable(false);
                                                //targetFieldControl.value('');
                                            } else {
                                                targetFieldControl.enable();
                                            }
                                        }
                                        break;
                                    default:
                                        if (!disablePage) {
                                            if (valid) {
                                                targetFieldControl.prop('disabled', true);
                                            } else {
                                                targetFieldControl.prop('disabled', false);
                                            }
                                        }
                                        break;
                                }
                                break;
                            case "enable": // enable/disable action based on condition
                                switch (controlType) {
                                    case "ddlb":
                                    case "lookup":
                                    case "duration":
                                        if (!disablePage) {
                                            if (valid) {
                                                targetFieldControl.enable();
                                            } else {
                                                targetFieldControl.enable(false);
                                                if (dependencyField.Empty && targetFieldControl.value().length > 0)
                                                    targetFieldControl.value('');
                                            }
                                        }
                                        break;
                                    default:
                                        if (!disablePage) {
                                            if (valid) {
                                                targetFieldControl.prop('disabled', false);
                                                validMandatory = false;
                                            } else {
                                                targetFieldControl.prop('disabled', true);
                                                if (dependencyField.Empty && targetFieldControl[0].value.length > 0)
                                                    targetFieldControl[0].value = '';
                                            }
                                        }
                                        break;
                                }
                                break;
                        }
                        // empty action
                        if (controlType == "string" | controlType == "number" | controlType == "decimal" | controlType == "text" | controlType == "currency" | controlType == "numeric") {
                            if (valid && validMandatory && dependencyField.Empty && targetFieldControl[0].value.length > 0) {
                                targetFieldControl[0].value = '';
                                stateObject[name].Value = "";
                            }
                        }
                        else if (controlType.startsWith('date') | controlType == "time") { // for date/tiem object kendo creates to 
                            if (valid && validMandatory && dependencyField.Empty && targetFieldControl[1].value.length > 0) {
                                targetFieldControl[1].value = '';
                                stateObject[name].Value = "";
                            }
                        }
                        else {
                            if (act.toLowerCase() == "disable" && valid && dependencyField.Empty && targetFieldControl.value().length > 0) {
                                targetFieldControl.value('');
                                stateObject[name].Value = "";
                            }
                        }
                    });
                    
                }
            });
        }
    });

    // if elements moved on screen (hide/show) resize window
    if (needResize) {
        switch (sourceScreen.toLowerCase()) {
            case "maint":
            case "maint-action":
            case "promptwindow":
                ResizeTabstripContainer(true);
                break;
            case "maint-xref":
                $scope.ResizeXrefMaintWindow();
                break;   
       
        }
    }
}

// manual handling mandatory attribute on text type
function OnChangeInputType(sourceField, sourceScreen, pageName, $scope) {
    var controlName = kendo.format("{0}_{1}", sourceField.ParentGroupName, sourceField.Name);
    var sourceControl = null;
    switch (sourceScreen.toLowerCase()) {
        case "maint":
            sourceControl = $scope.DomElement.find('.' + controlName);
            break;
        case "maint-xref":
            sourceControl = $('.xrefMaintPage').find('.' + controlName);
            break;
    }
    if (sourceControl != null) {
        if (sourceControl[0].value.length == 0) {
            sourceControl.addClass("ng-invalid").addClass("ng-invalid-required");
            sourceControl.removeClass("ng-valid").removeClass("ng-valid-required");
            if (sourceScreen != "Maint") {
               // $scope["xrefMaintEntityForm_" + pageName].$valid = false;
                UpdateXrefFormValid($scope, sourceField.Name, true);
            }
        } else {
            sourceControl.removeClass("ng-invalid").removeClass("ng-invalid-required");
            sourceControl.addClass("ng-valid").addClass("ng-valid-required");
            if (sourceScreen != "Maint") {
                UpdateXrefFormValid($scope, sourceField.Name, false);
                //$scope["xrefMaintEntityForm_" + pageName].$valid = IsXrefFormValid($scope);
            }
        }
    }
}

/// <summary>
/// Applies the dependencies fields conditions after page renderd.
/// </summary>
/// <param name="sourceScreen">The source screen.</param>
/// <param name="$scope">The $scope.</param>
/// <returns></returns>
function ApplyDependenciesFieldsConditions(sourceScreen,boName, $scope,isActionWindow) {

    var pageMetadata = $scope.PageMetaData;
    if (isActionWindow != undefined && isActionWindow === true) { // dealing with action window (diffrent MD)
        pageMetadata = $scope.ActionWindowMetaData;
    }
    if (sourceScreen.toLowerCase() == "maint-xref") {
        pageMetadata = $scope.Xref.maintPageMetaData;
    }
    if (sourceScreen.toLowerCase() == "new") {
        pageMetadata = $scope.ScreenData.NewEntities[$scope.ScreenGlobals.Module].PageMetadata;
    }
    if (sourceScreen.toLowerCase() == "new-xref") {
        pageMetadata = $scope.Xref.newPageMetaData;
    }
    var currentTab = null;
    if (isActionWindow != undefined && isActionWindow === true) { // dealing with action window (diffrent MD)
        currentTab = $scope.ActionWindowMetaData;
    } else {
        currentTab = Astea.Framework.Metadata.FindTabByBoName(pageMetadata, boName);
    }
    if (sourceScreen.toLowerCase() == "promptwindow") {
        currentTab = $scope.PageMetaData.PromptWindowTab;
    }
    if (currentTab != null && currentTab.DependencyFields != null && currentTab.DependencyFields.length > 0) {
        OnDdlbLookupChange(sourceScreen,currentTab.DependencyFields, $scope);
    }
}

// find duration element to apply format 
function ApplyDurationFields(scope, domElement) {
    var durationObjects = (domElement) ? domElement.find(".ddlb-duration") : scope.DomElement.find(".ddlb-duration");
    $.each(durationObjects, function (idx, duration) {
        var fieldName = $(duration).attr("ddlb-duration");
        if (fieldName) {
            var rowIndex = $(duration).closest(".maint-entity-group-fields-container").attr("row-index");
            var sourceScreen = $(duration).attr("source-screen");
            scope.FillDurationDdlb(fieldName, rowIndex, sourceScreen);
        }
    });
}


// apply duration format on DropDown element
function ApplyDdlbDurationForamt(sourceScreen, $scope, module, field, rowIndex,setValue) {
    var ddlbControl;
    var pageMetaData;
    var stateObject;
    switch (sourceScreen.toLowerCase()) {
        case "new":
            ddlbControl = $scope.NewDurationDDLBs["ddlb_" + module + "_" + field.Name];
            pageMetaData = $scope.ScreenData.NewEntities[module].PageMetadata;
            stateObject = $scope.ScreenData.NewEntities[module].Data[0];
            break;
        case "maint":
            ddlbControl = $scope.DurationDDLBs["ddlb_" + field.Name + "_index_" + rowIndex.toString()];
            pageMetaData = $scope.PageMetaData;
            stateObject = $scope.ScreenData[module].Rows[rowIndex];
            break;
        case "maint-xref":
            ddlbControl = $scope.XrefDurationDDLBs["ddlb_" + field.Name + "_index_" + rowIndex.toString()];
            pageMetaData = $scope.Xref.maintPageMetaData;
            stateObject = $scope.Xref.entityMaint;
            break;
        case "new-xref":
            ddlbControl = $scope.XrefNewDurationDDLBs["ddlb_" + field.Name + "_index_" + rowIndex.toString()];
            pageMetaData = $scope.Xref.newPageMetaData;
            stateObject = $scope.Xref.entityNew;
            break;
        case "maint-action":
            ddlbControl = $scope.MaintActionsDDLBs["ddlb_" + field.Name];
            pageMetaData = $scope.ActionWindowMetaData;
            stateObject = $scope.ActionsData[field.Name];
            break;
        case "qbe-action":
            ddlbControl = $scope.QBEActionsDDLBs["ddlb_" + field.Name];
            pageMetaData = $scope.ActionsMetadata[field.Name];
            stateObject = $scope.ActionsData[field.Name];
            break;
        case "card":
            ddlbControl = $scope.CardDDLBs["ddlb_" + field.Name];
            pageMetaData = $scope.CardMetadata;
            stateObject = $scope.CardData;
            break;
        case "promptwindow":
            ddlbControl = $scope.XrefNewDurationDDLBs["ddlb_" + field.Name + "_index_" + rowIndex.toString()];
            pageMetaData = $scope.PageMetaData.PromptWindowTab;
            stateObject = $scope.Xref.entityNew;
            break;
    }

    if (ddlbControl == undefined) {
        AsteaLogger.WriteToLog("error", "FW", kendo.format("error while building {0} DDLB", field.Name), "", false); // write log entry when cannot build DDLB
        return;
    }

    // unbind reset events
    ddlbControl.unbind("dataBound");
    ddlbControl.unbind("change");
    var conditionFieldName = kendo.format("{0}_{1}", field.ParentGroupName, field.Name);
    //disable control if page is disable
    if ($scope.EnablePageEditing === false && sourceScreen.toLowerCase() != "maint-action") {
        ddlbControl.enable(false);
    }
    var setStateValue = "";
    if (setValue) {
        setStateValue = stateObject[field.Name].Value;
        ddlbControl.value(AsteaUI.FormatTimeDuration(setStateValue));
        $(ddlbControl).attr("title", ddlbControl.value());
        //if (sourceScreen.toLowerCase().contains("maint-xref")) {
        //    $scope.XrefDurationDDLBs["ddlb_" + field.Name + "_index_" + rowIndex.toString()].Value = ddlbControl.value();
        //}
    }
    ddlbControl.bind("change",
       function () {
           var isValidValue = AsteaUI.ForamtTimeToDuration(ddlbControl.value());
           if (!isValidValue) {
               setStateValue = stateObject[field.Name].Value;
           }
           var conditionAttribute = ddlbControl.wrapper.closest("[condition='" + conditionFieldName + "']");
           if (conditionAttribute && $scope.TriggerDependencies === true) {
               ApplyDependenciesFieldsConditions(sourceScreen.toLowerCase(), $scope.ScreenGlobals.CurrentBoName, $scope);
           }

           var selectedValue = AsteaUI.ConvertDurationToTime(ddlbControl.value());
           if (selectedValue == null)
               return;
           $(ddlbControl).attr("title", ddlbControl.value());
           switch (sourceScreen.toLowerCase()) {
           
               case "new":
                   $scope.ScreenData.NewEntities[module].Data[0][field.Name].Value = selectedValue;
                   break;
               case "maint":
                   $scope.ScreenData[module].Rows[rowIndex][field.Name].Value = selectedValue;
                   break;
               case "maint-xref":
                   $scope.Xref.entityMaint[field.Name].Value = selectedValue;
                   break;
               case "new-xref":
               case "promptwindow":
                   $scope.Xref.entityNew[field.Name].Value = selectedValue;
                   break;
               case "maint-action":
                   $scope.ActionsData[field.Name].Value = selectedValue;
                   break;
               case "qbe-action":
                   $scope.ActionsData[field.Name].Value = selectedValue;
                   break;
               case "card":
                   $scope.CardData[field.Name].Value = selectedValue;
                   break;
           }
           ddlbControl.value(AsteaUI.FormatTimeDuration(selectedValue));
       }
   );
    
}
// reset ddlb field
function ResetDdlbField(sourceScreen, $scope, module, field, rowIndex, defaultResetValue) {
    // set local parameters according to source screen
    ////var ddlbControl = sourceScreen == "new" ? $scope.NewEntitiesDdlbs["ddlb_" + module + "_" + field.Name] : $scope.ScreenDDLBs["ddlb_" + field.Name + "_index_" + rowIndex.toString()];
    ////var pageMetaData = sourceScreen == "new" ? $scope.ScreenData.NewEntities[module].PageMetadata : $scope.PageMetaData;
    ////var stateObject = sourceScreen == "new" ? $scope.ScreenData.NewEntities[module].Data.value[0] : $scope.ScreenData[module].Rows[rowIndex];
    var ddlbControl;
    var pageMetaData;
    var stateObject;
    switch (sourceScreen.toLowerCase()) {
        case "new":
            ddlbControl = $scope.NewEntitiesDdlbs["ddlb_" + module + "_" + field.Name];
            pageMetaData = $scope.ScreenData.NewEntities[module].PageMetadata;
            stateObject = $scope.ScreenData.NewEntities[module].Data[0];
            break;
        case "maint":
            ddlbControl = $scope.ScreenDDLBs["ddlb_" + field.Name + "_index_" + rowIndex.toString()];
            pageMetaData = $scope.PageMetaData;
            stateObject = $scope.ScreenData[module].Rows[rowIndex];
            break;
        case "xref":
            ddlbControl = $scope.XrefDDLBs["ddlb_" + field.Name + "_index_" + rowIndex.toString()];
            pageMetaData = $scope.Xref.maintPageMetaData;
            stateObject = $scope.Xref.entityMaint;
            break;
        case "new-xref":
            ddlbControl = $scope.XrefNewDDLBs["ddlb_" + field.ParentGroupName + "_" + field.Name];
            pageMetaData = $scope.Xref.newPageMetaData;
            stateObject = $scope.Xref.entityNew;
            break;
        case "maint-action":
            ddlbControl = $scope.MaintActionsDDLBs["ddlb_" + field.Name];
            pageMetaData = $scope.ActionWindowMetaData;
            stateObject = $scope.ActionsData[field.Name];
            break;
        case "qbe-action":
            ddlbControl = $scope.QBEActionsDDLBs["ddlb_" + field.Name];
            pageMetaData = $scope.ActionsMetadata[field.Name];
            stateObject = $scope.ActionsData[field.Name];
            break;
        case "card":
            ddlbControl = $scope.CardDDLBs["ddlb_" + field.Name];
            pageMetaData = $scope.CardMetadata;
            stateObject = $scope.CardData;
            break;
        case "promptwindow":
            ddlbControl = $scope.XrefNewDDLBs["ddlb_" + field.ParentGroupName + "_" + field.Name];
            pageMetaData = $scope.PageMetaData.PromptWindowTab;
            stateObject = $scope.Xref.entityNew;
            break;
    }

    if (ddlbControl == undefined) {
        AsteaLogger.WriteToLog("error", "FW", kendo.format("error while building {0} DDLB", field.Name), "", false); // write log entry when cannot build DDLB
        return;
    }

    
    // unbind reset events
    ddlbControl.unbind("dataBound");
    //ddlbControl.unbind("change");

    //disable control if page is disable
    if ($scope.EnablePageEditing === false && sourceScreen.toLowerCase() != "maint-action") {
        ddlbControl.enable(false);
    }
    // create sort criteria
    var sortCriteria = "";
    if (field.Lookup["LookupAttribute_sortcolumn"] != "") {
        sortCriteria = field.Lookup["LookupAttribute_sortcolumn"] + " " + field.Lookup["LookupAttribute_sortdirection"];
    }

    // create filter criteria
    var filterFields = new Array();
    if (field.Lookup.FilterFields != null && field.Lookup.FilterFields.length > 0) {
        $.each(field.Lookup.FilterFields, function (index, filterField) { // loop through filter fields list            
            var filterFieldType = (pageMetaData.AllFieldsTypes[filterField.Name]) ? pageMetaData.AllFieldsTypes[filterField.Name].FieldAttribute_type : "string";
            var filterFieldName = filterField.Name;
            var filterFieldAlias = (filterField.Alias == "" | filterField.Alias == null) ? filterField.Name : filterField.Alias;
            if (stateObject[filterFieldName] != null && stateObject[filterFieldName].Value != "") {
                // create filter field
                var filterField = new Object();
                filterField.FieldType = filterFieldType.toString();
                filterField.FieldName = filterFieldAlias.toString();
                filterField.FieldValue = stateObject[filterFieldName].Value.toString();

                // add to filter fields array
                filterFields.push(filterField);
            }
        });
    }
    
    if (field.Lookup["LookupAttribute_ddlbtype"] == "dynamic") {
        // create ddlb data source
        var ds = GetDdlbDataSource(
            field.Lookup["LookupAttribute_entityname"] == null ? "" : field.Lookup["LookupAttribute_entityname"], // entity name
            field.Lookup["LookupAttribute_queryname"] == null ? "" : field.Lookup["LookupAttribute_queryname"], // query name
            field.Lookup["LookupAttribute_module"] == null ? "" : field.Lookup["LookupAttribute_module"], // module name, override query and entity (backward compatibility to avoid duplicate definitions)
            sortCriteria, // sort criteria
            filterFields, // filter fields
            field.Lookup["LookupAttribute_enableemptyvalue"] == null ? true : field.Lookup["LookupAttribute_enableemptyvalue"].toString().toLowerCase() == "true", // enable empty value
            field.Lookup["LookupAttribute_keyvalue"], // key field name
            field.Lookup["LookupAttribute_displayvalue"] // display field name
        );

        // create empty data source
        var emptyDataSource = new kendo.data.DataSource({
            data: []
        });

        // set field data source
        //ddlbControl.setDataSource(emptyDataSource);
        ddlbControl.setDataSource(ds);
    }
    
    // bind onchange event when user change value in DDLB (need to re-bind due to reset event that unbind orig bind)
    ddlbControl.bind("change",
        function() {
            switch (sourceScreen.toLowerCase()) {
            case "new":
                $scope.ScreenData.NewEntities[module].Data[0][field.Name].Value = ddlbControl.value();
                break;
            case "maint":
                $scope.ScreenData[module].Rows[rowIndex][field.Name].Value = ddlbControl.value();
                break;
            case "xref":
                $scope.Xref.entityMaint[field.Name].Value = ddlbControl.value();
                break;
            case "new-xref":
            case "promptwindow":
                stateObject[field.Name].Value = $scope.Xref.entityNew[field.Name].Value = ddlbControl.value();
                break;
            case "maint-action":
                stateObject = $scope.ActionsData[field.Name].Value = ddlbControl.value();
                break;
            case "qbe-action":
                stateObject = $scope.ActionsData[field.Name].Value = ddlbControl.value();
                break;
            case "card":
                $scope.CardData[field.Name].Value = ddlbControl.value();
                break;
            }
        }
    );
    // set reset default value
    if (defaultResetValue != undefined) {
        ddlbControl.value(defaultResetValue);
        ddlbControl.trigger("change");
    }
    // check if we need to clear to other fields - on change
    if (field.Lookup.ResetFields != null && field.Lookup.ResetFields.length > 0) {
        // bind to change event
        ddlbControl.bind("change",
            function() {
                $.each(field.Lookup.ResetFields, function(index, resetField) { // loop through reset fields list
                    // TODO: we need to know how to use ddlb field type in filter criteria - as string (with '') or as number or... 
                    var resetFieldType = "string";
                    var resetFieldName = resetField.Name;
                    var defaultResetValue = FindArrayEntryValueByKey(resetField.Attributes, "Key", "defaultresetvalue", "Value", "");

                    // get reference to reset field
                    var resetField = pageMetaData.AllFields[resetField.Name];

                    // reset target field
                    switch (resetField.FieldAttribute_type.toLowerCase()) {
                    case "lookup":
                        ResetLookupField(sourceScreen, $scope, module, resetField, rowIndex, defaultResetValue);
                        break;
                    case "ddlb":
                        ResetDdlbField(sourceScreen, $scope, module, resetField, rowIndex, defaultResetValue);
                        break;
                    }

                    // reset also field value in memory
                    if (stateObject[resetField.Name].Value != undefined) {
                        stateObject[resetField.Name].Value = defaultResetValue;
                    }
                    if (stateObject[resetField.Name] != undefined) { // action window state
                        stateObject[resetField.Name].Value = defaultResetValue;
                    }

                    // refresh ui
                    $scope.$apply();
                });
            }
        );
    }
}


function ExecuteAction($scope, executeAction, callBackFunction, elementToBlock) {
    var dataUrl = baseLink_FrameworkController + '/execute-action';
    AsteaLogger.WriteToLog("info", "FW", kendo.format("start executing action {0} module {1}", executeAction.actionName, executeAction.module), "", false); // write log entry
    Astea.Framework.Ajax.MakeAjaxCall_UpdateData(dataUrl, executeAction, elementToBlock,
    function (response) {
        AsteaLogger.WriteToLog("info", "FW", kendo.format("end executing action {0} module {1}", executeAction.actionName, $scope != null ? $scope.ScreenGlobals.Module : ""), "", false); // write log entry

        if (response.Error != null) {
            if (IsSessionTimeoutError(response))
                callBackFunction(false);
            else {
                if (response.Error.ErrorType == 'AsteaException') {
                    showInfoMessage(response.Error.ErrorMessage);
                }
                else if (response.Error.ErrorCode == "A2LOC002") { // lock by user message, need refresh after clicking ok.
                    showInfoMessage(response.Error.ErrorMessage, function () {
                        if ($scope != null) {
                            $scope.Actions.Refresh();
                        }
                        callBackFunction(false);
                    });
                } else {
                    showErrorMessage(response.Error.ErrorMessage);
                    callBackFunction(false);
                }
            }
        } else {
            if (!executeAction.resultable) {
                callBackFunction(true);
            } else {
                callBackFunction(response);
            }
        }
    });
};
/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d: d,
                dd: pad(d),
                ddd: dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m: m + 1,
                mm: pad(m + 1),
                mmm: dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy: String(y).slice(2),
                yyyy: y,
                h: H % 12 || 12,
                hh: pad(H % 12 || 12),
                H: H,
                HH: pad(H),
                M: M,
                MM: pad(M),
                s: s,
                ss: pad(s),
                l: pad(L, 3),
                L: pad(L > 99 ? Math.round(L / 10) : L),
                t: H < 12 ? "a" : "p",
                tt: H < 12 ? "am" : "pm",
                T: H < 12 ? "A" : "P",
                TT: H < 12 ? "AM" : "PM",
                Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
dateFormat.masks = {
    "default": "ddd mmm dd yyyy HH:MM:ss",
    shortDate: "m/d/yy",
    mediumDate: "mmm d, yyyy",
    longDate: "mmmm d, yyyy",
    fullDate: "dddd, mmmm d, yyyy",
    shortTime: "h:MM TT",
    mediumTime: "h:MM:ss TT",
    longTime: "h:MM:ss TT Z",
    isoDate: "yyyy-mm-dd",
    isoTime: "HH:MM:ss",
    isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};


Date.prototype.AsteaDateFormat = function (mask, utc) {
    return dateFormat(this, mask, utc);
};

// get button condition (caller will eval it)
function BuildButtonCondition(condition, conditionStatement, fieldType, valueForCondition) {
    if (valueForCondition == null) {
        return conditionStatement;
    }
    switch (condition.Operator.toLowerCase()) {
        case "eq":
            switch (fieldType) {
                case "datetime":
                case "date":
                case "time":
                    conditionStatement += new Date(valueForCondition).getTime() + '==' + new Date(condition.ConditionValue).getTime();
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
                case "number":
                case "string":
                case "decimal":
                    conditionStatement += ' \'' + valueForCondition + '\'' + '==' + '\'' + condition.ConditionValue + '\' ';
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
            }
            break;
        case "gt":
            switch (fieldType) {
                case "datetime":
                case "date":
                case "time":
                    conditionStatement += new Date(valueForCondition).getTime() + '>' + new Date(condition.ConditionValue).getTime();
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
                case "number":
                    conditionStatement += valueForCondition + '>' + condition.ConditionValue;
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
            }
            break;
        case "lt":
            switch (fieldType) {
                case "datetime":
                case "date":
                case "time":
                    conditionStatement += new Date(valueForCondition).getTime() + '<' + new Date(condition.ConditionValue).getTime();
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
                case "number":
                case "decimal":
                    conditionStatement += valueForCondition + '<' + condition.ConditionValue;
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
            }
            break;
        case "ne":
            switch (fieldType) {
                case "datetime":
                case "date":
                case "time":
                    conditionStatement += new Date(valueForCondition).getTime() + '!=' + new Date(condition.ConditionValue).getTime();
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
                case "number":
                case "string":
                    conditionStatement += '\'' + valueForCondition + '\'' + '!=' + '\'' + condition.ConditionValue + '\'';
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
            }
            break;
        case "lt-eq":
            switch (fieldType) {
                case "datetime":
                case "date":
                case "time":
                    conditionStatement += new Date(valueForCondition).getTime() + '<=' + new Date(condition.ConditionValue).getTime();
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
                case "number":
                case "decimal":
                    conditionStatement += valueForCondition + '<=' + condition.ConditionValue;
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
            }
            break;
        case "gt-eq":
            switch (fieldType) {
                case "datetime":
                case "date":
                case "time":
                    conditionStatement += new Date(valueForCondition).getTime() + '>=' + new Date(condition.ConditionValue).getTime();
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
                case "number":
                    conditionStatement += valueForCondition + '>=' + condition.ConditionValue;
                    if (condition.Operand.length > 0) {
                        conditionStatement += condition.Operand.toLowerCase() == "and" ? ' && ' : ' || ';
                    }
                    ;
                    break;
            }
            break;
    }
    return conditionStatement;
}

// convert null value to mpty string
function ConvertNullToEmptyString(value) {
    if (value == null || value == 'null')
        return "";

    return value;
};
// return array of utl parameters.
function ParseUrlParams() {
    var str = window.location.search;
    var urlParams = {};

    str.replace(
        new RegExp("([^?=&]+)(=([^&]*))?", "g"),
        function ($0, $1, $2, $3) {
            urlParams[$1] = $3;
        }
    );
    return urlParams;
}

function removeParameter(url, parameter) {
    var fragment = url.split('#');
    var urlparts = fragment[0].split('?');

    if (urlparts.length >= 2) {
        var urlBase = urlparts.shift(); //get first part, and remove from array
        var queryString = urlparts.join("?"); //join it back up

        var prefix = encodeURIComponent(parameter) + '=';
        var pars = queryString.split(/[&;]/g);
        for (var i = pars.length; i-- > 0;) {               //reverse iteration as may be destructive
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {   //idiom for string.startsWith
                pars.splice(i, 1);
            }
        }
        url = urlBase + '?' + pars.join('&');
        if (fragment[1]) {
            url += "#" + fragment[1];
        }
    }
    return url;
}

// Allow insert numbers only for search critertia with number type
function IsNumberKey(evt) {
    var charCode = (evt.which) ? evt.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        if (charCode != 46 && charCode != 44)
            return false;
    }
    
    return true;
}
// from template we cannot apply eval, KENDO will send the eval results (e.g. 340 == 340, the evalCond will be true) and we return it to template
function DisableLinkCondition(evalCond) {
    return evalCond;
}

// convert condtition that combined few fields
function ConvertConditionByStateValues(condition, stateObject) {
    var fieldArray = condition.split("field");
    $.each(fieldArray, function (idx, field) {
        var startIdx = field.indexOf("[");
        var endIdx = field.indexOf("]");
        if (startIdx != -1 && endIdx != -1) {
            field = field.substring(startIdx + 1, endIdx);
            var value = (stateObject[field]) ? stateObject[field].Value : stateObject;
            if (value != undefined) {
                if ($.isNumeric(value)) {
                    condition = " " + condition.replace("field[" + field + "]", value);
                } else {
                    condition = " " + condition.replace("field[" + field + "]", "'" + value + "'");
                }
            } else {
                AsteaLogger.WriteToLog("error", "FW", kendo.format("Field condition {0} was not found in state, condition ignored", field), "", false);
            }
        }
    });
    condition = ConvertConditionOperators(condition);
    return condition;
}

// convert MD condition to eval condition (apply data inseted of field names)

function ConvertCondition(condition, replaceField, gridColumnTemplate) {
    if (gridColumnTemplate == undefined)
        gridColumnTemplate = false;
    
    if (replaceField == undefined) {
        replaceField = "";
    } 
    if (condition != undefined) {
        if (!gridColumnTemplate) {
            condition = condition.split("]").join(".Value");
        } else {
            condition = condition.split("]").join("");
        }
        condition = condition.split("field[").join(replaceField);
    } else {
        condition = "";
    }
        
    condition = ConvertConditionOperators(condition);
    return condition;
}

function ConvertConditionOperators(condition) {
    if (condition == undefined || condition.length == 0)
        return "";
    
    condition = condition.split(" lt ").join(" < ");
    condition = condition.split(" gt ").join(" > ");
    condition = condition.split(" le ").join(" <= ");
    condition = condition.split(" ge ").join(" <= ");
    condition = condition.split(" and ").join(" && ");
    condition = condition.split(" or ").join(" || ");
    return condition;
}

//execute condition on checkboc column in multi-select grid (QBE) 
function applyCheckboxRowBycondition(dataValue, chkColumnName, chkCondition) {
    chkCondition = ConvertConditionByStateValues(chkCondition, dataValue);
    return eval(chkCondition);
};
// check if link has security in module list
function ValidateLinkModuleSecurity(orderType, ordersList, fieldVlue) {
    if (fieldVlue == undefined || fieldVlue.length == 0)
        return false;

    if (ordersList == undefined ||  ordersList.length == 0 || ordersList.contains('null'))
        return true;

    var valid = ordersList.contains(orderType);
    return valid;
};
// validate if value is null or emty, to avoid show null in grid
function ValidateEmptyNull(fieldVlue) {
    if (fieldVlue == undefined || fieldVlue == "undefined" || fieldVlue.length == 0)
        return true;

    return false;
};

 /// <summary>
/// Convert Json state type to State Object
/// </summary>
/// <param name="stateData">The state data.</param>
/// <param name="metaData">The meta data.</param>
/// <returns></returns>
function BuildStateObject(stateData,metaData) {
   
    var stateObject = new Object();

    if (stateData.value && $.isArray(stateData.value)) { // multi line state
        $.each(stateData.value, function(idx, row) {
            var stateRow = new Object();
            $.each(row, function(itemName, itemValue) {
                var fieldType = "";
                if (metaData.AllFieldsTypes != undefined && metaData.AllFieldsTypes[itemName] != undefined && metaData.AllFieldsTypes[itemName].FieldAttribute_type != undefined) {
                    fieldType = metaData.AllFieldsTypes[itemName].FieldAttribute_type;
                }
                if (itemValue == null && (fieldType.toLowerCase() == "lookup" || fieldType.toLowerCase() == "ddlb")) {
                    itemValue = "";
                }
                if (itemValue != null && itemValue.hasOwnProperty("Value")) {
                    itemValue = itemValue.Value;
                }
                stateRow[itemName] = new StateColumnObject(itemName, itemValue, fieldType);//{ Name: itemName, Value: itemValue , Type: fieldType };
            });
            if (stateRow['astea_row_status'] == undefined) { // add default field to chck row status
                stateRow['astea_row_status'] = new StateColumnObject("astea_row_status", "", "");//{ Name: 'astea_row_status', Value: "", Type: "" };
            } 
            stateObject[idx] = stateRow;
        });
    } else { // single line state
        var stateRow = new Object();
        $.each(stateData, function (itemName, itemValue) {
            var fieldType = "";
            if (metaData.AllFieldsTypes != undefined && metaData.AllFieldsTypes[itemName] != undefined && metaData.AllFieldsTypes[itemName].FieldAttribute_type != undefined) {
                fieldType = metaData.AllFieldsTypes[itemName].FieldAttribute_type;
            }
            if (itemValue == null && (fieldType.toLowerCase() == "lookup" || fieldType.toLowerCase() == "ddlb") ) {
                itemValue = "";
            }
            if (itemValue != null && itemValue.hasOwnProperty("Value")) {
                itemValue = itemValue.Value;
            }
            stateRow[itemName] = new StateColumnObject(itemName, itemValue, fieldType);// { Name: itemName, Value: itemValue , Type: fieldType };
        });
        if (stateRow['astea_row_status'] == undefined) { // add default field to chck row status
            stateRow['astea_row_status'] = new StateColumnObject("astea_row_status", "", "");//{ Name: 'astea_row_status', Value: "", Type: "" };
        }
        stateObject = stateRow;
    }
    return stateObject;
};
    /// <summary>
    /// Converts the state row to grid row (for binding new state row row to grid).
    /// </summary>
    /// <param name="stateRow">The state row.</param>
    /// <returns></returns>
function ConvertStateRowToGridRow(stateRow) {

    $.each(stateRow, function (itemName, itemValue) {
        if (itemValue.hasOwnProperty("Value")) {
            stateRow[itemName] = itemValue.Value;
        }
    });
    return stateRow;
}

/// <summary>
    /// Builds the catalog image path.
    /// </summary>
    /// <param name="attachmentId">The attachment identifier.</param>
    /// <param name="fileName">Name of the file.</param>
    /// <returns></returns>
function BuildCatalogImagePath(attachmentId, fileName) {
    if (fileName == null || attachmentId == null)
        return "";
    
    var fileWithoutExt = fileName.substr(0, fileName.lastIndexOf('.')) || fileName;
    var fileExt = fileName.substr(fileName.lastIndexOf('.'), fileName.length);
    var newFileName = baseLink_CustomImagesUrl + fileWithoutExt + '_' + attachmentId + fileExt;
    return newFileName;
}
    /// <summary>
    /// Check if image exists for catalog images. if not, display no-image
    /// </summary>
    /// <param name="imageObject">The image object.</param>
    /// <returns></returns>
function OnItemQbeNoImage(imageObject) {

    imageObject.src = "../content/images/Common/no_picture.png";
    $(imageObject).addClass('no-image');
    imageObject.onerror = "";
}
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
function getFieldValue(stateField) {
    if (!stateField.Type)
        return stateField.Value;

    if (stateField.Type === "decimal" || stateField.Type === "number") {
        if (!isNumber(stateField.Value))
            return null;
    }

    return stateField.Value;
}