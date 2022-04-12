using System.Linq;
using System.Web.Security;
using Astea.Definitions.Screen.UI;
using Astea.Server.Common.Definitions;
using Astea.Server.Common.Exceptions;
using AsteaAlliance.UI.CustomersPortal.BusinessLogic;
using System;
using System.Collections.Generic;
using System.Web.Mvc;
using Astea.Server.Common.RunTime;
using MS.Internal.Xml.XPath;
using System.Web;
using Newtonsoft.Json;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OpenIdConnect;
using Astea.Definitions.Screen;
using System.Text;
using System.ServiceModel;
using Microsoft.AspNet.Identity.Owin;
using System.Web.Routing;

namespace AsteaAlliance.UI.CustomersPortal.Controllers
{
    public class LoginController : BaseController
    {
        private class ChallengeResult : HttpUnauthorizedResult
        {
            public ChallengeResult(string authenticationType, string redirectUri)
            {
                this.AuthenticationType = authenticationType;
                this.RedirectUri = redirectUri;
            }

            public string AuthenticationType { get; }

            public string RedirectUri { get; }

            public override void ExecuteResult(ControllerContext context)
            {
                var properties = new AuthenticationProperties
                {
                    RedirectUri = this.RedirectUri,
                };

                context.HttpContext.GetOwinContext().Authentication.Challenge(properties, this.AuthenticationType);
            }
        }

        /// <summary>
        /// Send an OpenID Connect sign-out request.
        /// </summary>
        public void SsoProviderSignOut()
        {
            if (Request.IsAuthenticated)
            {
                IEnumerable<AuthenticationDescription> authTypes = HttpContext.GetOwinContext().Authentication.GetAuthenticationTypes();
                HttpContext.GetOwinContext().Authentication.SignOut(authTypes.Select(t => t.AuthenticationType).ToArray());
                Request.GetOwinContext().Authentication.GetAuthenticationTypes();
            }
        }

        public ActionResult SsoLogout()
        {
            var profile = System.Web.HttpContext.Current.Request.QueryString.Get("profile");
            var serviceProviderKey = System.Web.HttpContext.Current.Request.QueryString.Get("service_provider_key");
            var authenticationMethod = System.Web.HttpContext.Current.Request.QueryString.Get("authentication_method");

            ViewBag.Profile = profile;
            ViewBag.ServiceProviderKey = serviceProviderKey;
            ViewBag.AuthenticationMethod = authenticationMethod;

            ViewData["Message"] = "You signed out of your account";
            ViewBag.DebugeMode = Astea.Server.Common.RunTime.Services.Instance.DebugeMode;

            var redirectUriRouteValues = new RouteValueDictionary()
            {
                ["profile"] = profile,
                ["service_provider_key"] = serviceProviderKey
            };

            if (!string.IsNullOrEmpty(authenticationMethod) && authenticationMethod != "OIDC")
            {
                redirectUriRouteValues.Add("authentication_method", authenticationMethod);
            }
            ViewBag.RouteValues = redirectUriRouteValues;

            //SsoProviderSignOut();

            return View();
        }

        public ActionResult SsoProviderSignOutPost()
        {
            ViewData["Message"] = "You signed out of your account";
            //return RedirectToAction("SsoProfiles");
            return View();
        }

        public ActionResult SsoProfiles()
        {
            // reset login details
            Sessions.ResetLoginDetails();
            List<string> profiles = PopulateAccountState();
            var languages = AsteaProxy.Services.Languages;
            ViewData["Languages"] = System.Web.Helpers.Json.Encode(languages);

            var ssoList = CommonUtils.SsoProvidersPP(profiles);
            ViewData["ssoList"] = ssoList;

            return View();
        }


        public ActionResult SsoOidcSignIn()
        {
            // reset login details
            Sessions.ResetLoginDetails();
            PopulateAccountState();
            var languages = AsteaProxy.Services.Languages;
            ViewData["Languages"] = System.Web.Helpers.Json.Encode(languages);

            var profile = System.Web.HttpContext.Current.Request.QueryString.Get("profile");
            var authenticationMethod = System.Web.HttpContext.Current.Request.QueryString.Get("authentication_method");
            var serviceProviderKey = System.Web.HttpContext.Current.Request.QueryString.Get("service_provider_key");

            if (string.IsNullOrWhiteSpace(profile) || string.IsNullOrWhiteSpace(serviceProviderKey))
            {
                StringBuilder sb = new StringBuilder();
                if (string.IsNullOrWhiteSpace(profile))
                {
                    sb.AppendFormat("The argument profile is not supplied. ");
                }

                if (string.IsNullOrWhiteSpace(serviceProviderKey))
                {
                    sb.AppendFormat("The argument Customer's Server Provider [service_provider_key] is not supplied. ");
                }

                sb.AppendFormat("Please provide the valid URL. ");
                TempData["ErrorMessage"] = sb.ToString();
            }
            else
            {
                List<string> profiles = new List<string>() { profile };
                var ssoList = CommonUtils.SsoProvidersPP(profiles, serviceProviderKey, authenticationMethod, null);

                ViewBag.SsoProfile = profile;
                ViewData["SsoProfile"] = profile;

                CommonUtils.SetCookieValue("SsoProfile", profile);
                CommonUtils.CurrentHTTPContext().Items["SsoProfile"] = profile;
                CommonUtils.CurrentHTTPRequestContext().Headers.Add("SsoProfile", profile);

                if (ssoList.Count > 0)
                {
                    var authenticationKey = ssoList[ssoList.Count -1].CustomerId;
                    ViewBag.AuthenticationKey = authenticationKey;
                    string[] akArr = { authenticationKey };

                    CommonUtils.SetCookieValue("AuthenticationKey", profile);
                    CommonUtils.CurrentHTTPContext().Items["AuthenticationKey"] = profile;

                    var redirectUriRouteValues = new RouteValueDictionary()
                    {
                        ["profile"] = profile,
                        ["service_provider_key"] = authenticationKey
                    };

                    if (!string.IsNullOrEmpty(authenticationMethod) && authenticationMethod != "OIDC")
                    {
                        redirectUriRouteValues.Add("authentication_method", authenticationMethod);
                    }

                    string redirectUri = this.Url.Action(
                        "SignedInClaims", // action
                        "Login", // controller
                        redirectUriRouteValues);


                    if (Request.IsAuthenticated)
                    {
                        return RedirectToAction("SignedInClaims", redirectUriRouteValues);
                    }

                    return new ChallengeResult(authenticationKey, redirectUri);
                }
                else
                {
                    StringBuilder sb = new StringBuilder();
                    sb.AppendFormat("Cannot find a service provider. ");
                    sb.AppendFormat("Please provide the valid URL. ");
                    TempData["ErrorMessage"] = sb.ToString();
                }
            }


            return View();
        }

        //[Authorize]
        public ActionResult SsoSignedInLogin()
        {
            return RedirectToAction("SignedInClaims");
        }

        public void SsoSignIn()
        {
            if (!Request.IsAuthenticated)
            {
                HttpContext.GetOwinContext().Authentication.Challenge(
                    new AuthenticationProperties { RedirectUri = "/AsteaAlliance151_PartnerPortal/Login/SignedInClaims" },
                    OpenIdConnectAuthenticationDefaults.AuthenticationType);
            }
        }

        public ActionResult SsoSignInAndClaims()
        {
            if (!Request.IsAuthenticated)
            {
                HttpContext.GetOwinContext().Authentication.Challenge(
                    new AuthenticationProperties { RedirectUri = "/AsteaAlliance151_PartnerPortal/Login/SignedInClaims" },
                    OpenIdConnectAuthenticationDefaults.AuthenticationType);
            }
            else
            {
                return RedirectToAction("SignedInClaims");
            }

            return View();
        }

        //[Authorize]
        public ActionResult SignedInClaims()
        {
            var userClaims = User.Identity as System.Security.Claims.ClaimsIdentity;

            if (userClaims != null)
            {
                ViewBag.Email = userClaims?.FindFirst("email")?.Value;

                //You get the user’s first and last name below:
                ViewBag.Name = userClaims.FindFirst("name")?.Value;

                // The 'preferred_username' claim can be used for showing the username
                ViewBag.Username = userClaims.FindFirst("preferred_username")?.Value;

                if (string.IsNullOrWhiteSpace(ViewBag.Username))
                {
                    if (string.IsNullOrWhiteSpace(ViewBag.Email))
                    {
                        var emailsCol = userClaims.FindAll("emails");

                        if (emailsCol != null && emailsCol.Count() > 0)
                        {
                            ViewBag.Email = emailsCol.Last().Value;
                        }
                    }
                    else
                    {
                        ViewBag.Email = ViewBag.Email;
                    }
                }
                else
                {
                    ViewBag.Email = ViewBag.Username;
                }

                // TenantId is the unique Tenant Id - which represents an organization in Azure AD
                ViewBag.TenantId = userClaims.FindFirst("http://schemas.microsoft.com/identity/claims/tenantid")?.Value;
            }

            var ssoProfile = System.Web.HttpContext.Current.Request.QueryString.Get("profile");
            var authenticationKey = System.Web.HttpContext.Current.Request.QueryString.Get("service_provider_key");
            var authenticationMethod = System.Web.HttpContext.Current.Request.QueryString.Get("authentication_method") as string;

            ViewBag.SsoProfile = ssoProfile;
            ViewBag.AuthenticationKey = authenticationKey;
            ViewBag.AuthenticationMethod = authenticationMethod;

            ViewData["SsoProfile"] = ssoProfile;
            ViewData["AuthenticationKey"] = authenticationKey;
            ViewData["AuthenticationMethod"] = authenticationMethod;

            if (!string.IsNullOrEmpty(ssoProfile) && !string.IsNullOrEmpty(ViewBag.Email))
            {
                //Login
                var user = "{15588964-310A-47A1-8768-571D3F846205}";
                var email = ViewBag.Email;
                var password = "not_used";
                var account = ssoProfile;
                var accountState = "P";
                var forceLogin = true;
                var supressCustomizer = true;
                var userAcceptTerms = true;
                var explicitCompanyId = string.Empty;

                var tabKeyRand = new Random().Next(1000, 9999);
                var tabKey = tabKeyRand.ToString();
                CommonUtils.CurrentHTTPContext().Items["astea_TabKey"] = tabKey;

                AjaxResponseObject loginRes = SsoPostLogin(user, password, account, accountState, forceLogin, supressCustomizer,
                    userAcceptTerms, explicitCompanyId, email);

                if (loginRes != null 
                    && (loginRes.Error is null || string.IsNullOrEmpty(loginRes.Error.ErrorMessage)))
                {
                    var sessionId = CommonUtils.GetCookieValue("astea_SessionID");
                    ViewBag.SessionID = sessionId;
                    ViewData["SessionID"] = sessionId;

                    var redirectUriRouteValues = new RouteValueDictionary()
                    {
                        ["id"] = 1,
                        ["TabKey"] = tabKey,
                        ["SessionID"] = sessionId,
                        ["IsSsoOidc"] = true,
                        ["profile"] = ssoProfile,
                        ["service_provider_key"] = authenticationKey
                    };

                    if (!string.IsNullOrEmpty(authenticationMethod) && authenticationMethod != "OIDC")
                    {
                        redirectUriRouteValues.Add("authentication_method", authenticationMethod);
                    }
                    ViewBag.RouteValues = redirectUriRouteValues;

                    return RedirectToAction("main", "Portal",redirectUriRouteValues);
                }
                else
                {
                    ViewBag.ErrorMessage = loginRes.Error.ErrorMessage;
                }
            }

            return View();
        }

        [Authorize]
        public ActionResult SignedInUserClaims()
        {
            var userClaims = User.Identity as System.Security.Claims.ClaimsIdentity;
            ViewBag.Email = userClaims?.FindFirst("email")?.Value;

            //You get the user’s first and last name below:
            ViewBag.Name = userClaims?.FindFirst("name")?.Value;

            // The 'preferred_username' claim can be used for showing the username
            ViewBag.Username = userClaims?.FindFirst("preferred_username")?.Value;

            // The subject/ NameIdentifier claim can be used to uniquely identify the user across the web
            ViewBag.Email = userClaims?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // TenantId is the unique Tenant Id - which represents an organization in Azure AD
            ViewBag.TenantId = userClaims?.FindFirst("http://schemas.microsoft.com/identity/claims/tenantid")?.Value;

            var ssoProfile = System.Web.HttpContext.Current.Request.QueryString.Get("profile");
            var authenticationKey = System.Web.HttpContext.Current.Request.QueryString.Get("service_provider_key");
            var authenticationMethod = System.Web.HttpContext.Current.Request.QueryString.Get("authentication_method") as string;

            ViewBag.SsoProfile = ssoProfile;
            ViewBag.AuthenticationKey = authenticationKey;
            ViewBag.AuthenticationMethod = authenticationMethod;

            ViewData["SsoProfile"] = ssoProfile;
            ViewData["AuthenticationKey"] = authenticationKey;
            ViewData["AuthenticationMethod"] = authenticationMethod;

            var redirectUriRouteValues = new RouteValueDictionary()
            {
                ["profile"] = ssoProfile,
                ["service_provider_key"] = authenticationKey
            };

            if (!string.IsNullOrEmpty(authenticationMethod) && authenticationMethod != "OIDC")
            {
                redirectUriRouteValues.Add("authentication_method", authenticationMethod);
            }
            ViewBag.RouteValues = redirectUriRouteValues;

            return View();
        }

        private AjaxResponseObject SsoPostLogin(string user, string password, string account, string accountState,
            bool forceLogin, bool supressCustomizer, bool userAcceptTerms, string explicitCompanyId, string email)
        {
            var browser = string.Format("\nBrowser Name {0} \nVersion: {1}", Request.Browser.Type, Request.Browser.Version);
            var userInfo = string.Format("\nUser IP: {0}\nHost name: {1}\nUser agent data: {2}{3}\nDevice: {4}", new object[] { Request.UserHostAddress, Request.UserHostName, Request.UserAgent, browser, Services.Instance.GetDeviceType(Request.UserAgent) });

            ApplicationLogger.WriteInfo(string.Format("User {0} is trying to login to account {1}{2}", user, account, userInfo));
            AjaxResponseObject ajaxResponse;
            var profile = account;
            try
            {
                CommonUtils.CurrentHTTPContext().Items["HTTP_LOGON_USER"] = email;
                CommonUtils.CurrentHTTPRequestContext().Headers.Add("HTTP_LOGON_USER", email);
                                
                //login to server
                Sessions.MakeUserLogin(user, password, profile, forceLogin, supressCustomizer, userAcceptTerms, explicitCompanyId);
                ajaxResponse = new AjaxResponseObject(string.Empty);
                ajaxResponse.ExtraResponseItems.Add(new KeyValue { Key = "IsCustomizer", Value = CommonUtils.GetCookieValue("astea_IsCustomizer") });
                ajaxResponse.ResponseData = AsteaProxy.Services.CustomerPortalServices.GetMessage("A2CP027", Astea.Server.Common.RunTime.Services.Instance.GetCurrentCultur());

            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                ajaxResponse = CommonUtils.HandleException(ex);
            }
           
            return ajaxResponse;
        }

        #region Change Password Actions
        /// <summary>
        /// Change password screen
        /// </summary>
        /// <returns></returns>
        [ActionName("changepassword")]
        public ActionResult ChangePasswordGet()
        {
            Sessions.ResetLoginDetails();
            return View();
        }
        /// <summary>
        /// Change password
        /// </summary>
        /// <param name="account"></param>
        /// <param name="accountState"></param>
        /// <param name="userName"></param>
        /// <param name="existingPassword"></param>
        /// <param name="newPassword"></param>
        /// <param name="confirmPassword"></param>
        /// <param name="customerId"></param>
        /// <returns></returns>
        [ActionName("api-changepassword")]
        public ActionResult AjaxChangePassword(string account, string accountState, string userName, string existingPassword, string newPassword, string confirmPassword, string customerId)
        {
            AjaxResponseObject ajaxResponse;
            var profile = account;
            try
            {
                if (accountState.Equals("c", StringComparison.OrdinalIgnoreCase))
                {
                    var wsResult = Sessions.ValidateAccount(account);
                    if (wsResult.IsError)
                        throw new AsteaException(wsResult.ErrorMessage);

                    profile = wsResult.Result;
                }
                var results = AsteaProxy.Services.CustomerPortalServices.ChangePassword(userName, existingPassword, newPassword, confirmPassword, profile, customerId);
                Dictionary<string, string> loginVariables = Utils.ReadLoginVariables(results);
                Sessions.SetLoginVariables(loginVariables);
                ajaxResponse = new AjaxResponseObject("");
                ajaxResponse.ExtraResponseItems.Add(new KeyValue { Key = "IsCustomizer", Value = CommonUtils.GetCookieValue("astea_IsCustomizer") });
                ajaxResponse.ResponseData = AsteaProxy.Services.CustomerPortalServices.GetMessage("A2CP027", Astea.Server.Common.RunTime.Services.Instance.GetCurrentCultur());
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                ajaxResponse = CommonUtils.HandleException(ex);
            }
            return new Custom.CustomJsonResult(ajaxResponse);

        }

        #endregion Change Password Actions

        #region Forgot Password Actions
        /// <summary>
        /// self registration screen
        /// </summary>
        /// <returns></returns>
        [ActionName("forgotpassword")]
        [AcceptVerbs(HttpVerbs.Get)]
        public ActionResult ForgotPasswordGet()
        {
            var account = "";
            var accountState = "";
            Sessions.ResetLoginDetails();
            var loginCookieString = System.Web.HttpContext.Current.Request.Cookies["astea_client_last_login_account"] == null ? "" : System.Web.HttpContext.Current.Request.Cookies["astea_client_last_login_account"].Value;
            if (!string.IsNullOrEmpty(loginCookieString))
            {
                loginCookieString = HttpUtility.UrlDecode(loginCookieString);
                dynamic cookieInfo = JsonConvert.DeserializeObject(loginCookieString);
                account = cookieInfo.account;
                accountState = cookieInfo.accountState;
            }
            PopulateAccountState(account, accountState);
            return View();
        }

        /// <summary>
        /// Forgot passowrd
        /// </summary>
        /// <param name="account"></param>
        /// <param name="userName"></param>
        /// <param name="accountState"></param>
        /// <returns></returns>
        [ActionName("api-forgotpassword")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult AjaxForgotPassword(string account, string userName, string accountState)
        {

            AjaxResponseObject ajaxResponse;
            var profile = account;
            try
            {
                if (accountState.Equals("c", StringComparison.OrdinalIgnoreCase))
                {
                    var wsResult = Sessions.ValidateAccount(account);
                    if (wsResult.IsError)
                        throw new AsteaException(wsResult.ErrorMessage);

                    profile = wsResult.Result;
                }
                string msg = AsteaProxy.Services.CustomerPortalServices.ForgotPassword(profile, userName);
                ajaxResponse = new AjaxResponseObject(msg);//"The new Password has been initialized. You will receive an Email containing the new password shortly.");
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                ajaxResponse = CommonUtils.HandleException(ex);
            }
            return new Custom.CustomJsonResult(ajaxResponse);
        }

        #endregion Forgot Password Actions

        #region Self Registration Actions
        /// <summary>
        /// self registration screen
        /// </summary>
        /// <returns></returns>
        [ActionName("selfregistration")]
        [AcceptVerbs(HttpVerbs.Get)]
        public ActionResult SelfRegistrationGet(string account, string accountState, string selfregcode, bool isVendor)
        {
            Sessions.ResetLoginDetails();
            ViewData["Selfregcode"] = selfregcode;
            //var isVendor = AsteaProxy.Services.CustomerPortalServices.IsVendor(selfRegAccount, selfregcode);
            ViewData["IsVendor"] = isVendor ? "Y" : "N";
            PopulateAccountState(account, accountState);
            return View();
        }

        [ActionName("is-vendor")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult IsVendor(string account, string accountState, string selfregcode)
        {
            AjaxResponseObject ajaxResponse;
            var profile = account;
            try
            {
                if (accountState.Equals("c", StringComparison.OrdinalIgnoreCase))
                {
                    var wsResult = Sessions.ValidateAccount(account);
                    if (wsResult.IsError)
                        throw new AsteaException(wsResult.ErrorMessage);

                    profile = wsResult.Result;
                }
                var isVendor = AsteaProxy.Services.CustomerPortalServices.IsVendor(profile, selfregcode);
                ajaxResponse = new AjaxResponseObject(isVendor);
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                ajaxResponse = CommonUtils.HandleException(ex);
            }
            return new Custom.CustomJsonResult(ajaxResponse);

        }

        /// <summary>
        /// Self registration action (create new user)
        /// </summary>
        /// <param name="selfAccount"></param>
        /// <param name="customerCode"></param>
        /// <param name="email"></param>
        /// <param name="firstName"></param>
        /// <param name="lastName"></param>
        /// <param name="userName"></param>
        /// <param name="password"></param>
        /// <param name="confirmPassword"></param>
        /// <param name="searchName"></param>
        /// <param name="isSa"></param>
        /// <param name="accountState"></param>
        /// <returns></returns>
        [ActionName("api-selfregistration")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult AjaxCreateNewContact(string selfAccount, string customerCode, string email, string firstName,
            string lastName, string userName, string password, string confirmPassword, string searchName, bool isSa, string accountState)
        {
            AjaxResponseObject ajaxResponse;
            string response;
            var profile = selfAccount;
            try
            {

                //Validate account
                if (accountState.Equals("c", StringComparison.OrdinalIgnoreCase))
                {
                    var wsResult = Sessions.ValidateAccount(selfAccount);
                    if (wsResult.IsError)
                        throw new AsteaException(wsResult.ErrorMessage);

                    profile = wsResult.Result;
                }


                response = AsteaProxy.Services.CustomerPortalServices.SelfRegistration(profile, customerCode, email,
                    firstName, lastName, userName, password, confirmPassword, searchName, isSa);

                if (!string.IsNullOrEmpty(response))
                {
                    throw new AsteaException(response);
                }
                ajaxResponse = new AjaxResponseObject(response);
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                ajaxResponse = CommonUtils.HandleException(ex);
            }
            Sessions.ResetLoginDetails();
            return new Custom.CustomJsonResult(ajaxResponse);
        }

        #endregion Self Registration Actions

        #region Login Actions

        /// <summary>
        /// default login screen, will called as defult and redirect according login type
        /// </summary>
        /// <returns></returns>
        [ActionName("login")]
        [AcceptVerbs(HttpVerbs.Get)]
        public ActionResult LoginGet(string account)
        {
            // reset login details
            Sessions.ResetLoginDetails();
            PopulateAccountState();
            var languages = AsteaProxy.Services.Languages;
            ViewData["Languages"] = System.Web.Helpers.Json.Encode(languages);
            var loginType = System.Web.HttpContext.Current.Items["LoginType"];
            // redirect to correct login page
            if (account != null && !string.IsNullOrEmpty(account))
            {
                return RedirectToAction(loginType.ToString(), "login", new { account = account });
            }
            return RedirectToAction(loginType.ToString(), "login");
        }

        /// <summary>
        /// default customer login screen
        /// </summary>
        /// <returns></returns>
        [ActionName("customer-login")]
        [AcceptVerbs(HttpVerbs.Get)]
        public ActionResult CusomerLoginGet()
        {
            // reset login details
            Sessions.ResetLoginDetails();
            PopulateAccountState();
            var languages = AsteaProxy.Services.Languages;
            ViewData["Languages"] = System.Web.Helpers.Json.Encode(languages);
            return View("CustomerLogin");
        }

        /// <summary>
        /// default vendor login screen
        /// </summary>
        /// <returns></returns>
        [ActionName("vendor-login")]
        [AcceptVerbs(HttpVerbs.Get)]
        public ActionResult VendorLoginGet()
        {
            // reset login details
            Sessions.ResetLoginDetails();
            PopulateAccountState();
            var languages = AsteaProxy.Services.Languages;
            ViewData["Languages"] = System.Web.Helpers.Json.Encode(languages);
            return View("VendorLogin");
        }


        /// <summary>
        /// default service monitor login screen
        /// </summary>
        /// <returns></returns>
        [ActionName("servicemonitor-login")]
        [AcceptVerbs(HttpVerbs.Get)]
        public ActionResult ServiceMpnitorLoginGet()
        {
            // reset login details
            Sessions.ResetLoginDetails();
            PopulateAccountState();
            var languages = AsteaProxy.Services.Languages;
            ViewData["Languages"] = System.Web.Helpers.Json.Encode(languages);
            return View("ServiceMonitorLogin");
        }

        /// <summary>
        /// default emplyee login screen
        /// </summary>
        /// <returns></returns>
        [ActionName("employee-login")]
        [AcceptVerbs(HttpVerbs.Get)]
        public ActionResult EmployeeLoginGet()
        {
            // reset login details
            Sessions.ResetLoginDetails();
            PopulateAccountState();
            var languages = AsteaProxy.Services.Languages;
            ViewData["Languages"] = System.Web.Helpers.Json.Encode(languages);
            return View("EmployeeLogin");
        }

        /// <summary>
        /// Implement external login web page and redirect to portal (login page must be in same domain).
        /// </summary>
        /// <param name="user">The user.</param>
        /// <param name="password">The password.</param>
        /// <param name="profile">The profile.</param>
        /// <returns></returns>
        [ActionName("external-login")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult ExternalLogin(string user, string password, string profile)
        {
            try
            {
                var rand = new Random().Next(1000, 9999);
                CommonUtils.CurrentHTTPContext().Items["astea_TabKey"] = rand.ToString();
                Sessions.MakeUserLogin(user, password, profile, true, true, true, "");
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                return Content(ex.Message);
            }
            var tabKey = (string)CommonUtils.CurrentHTTPContext().Items["astea_TabKey"];
            return RedirectToAction("main", "Portal", new { TabKey = tabKey });
        }

        /// <summary>
        /// ajax api call - user login
        /// </summary>
        /// <returns></returns>
        [ActionName("api-login")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult AjaxMakeLogin(string user, string password, string account, string accountState, bool forceLogin, bool supressCustomizer, bool userAcceptTerms, string explicitCompanyId)
        {
            var browser = string.Format("\nBrowser Name {0} \nVersion: {1}", Request.Browser.Type, Request.Browser.Version);
            var userInfo = string.Format("\nUser IP: {0}\nHost name: {1}\nUser agent data: {2}{3}\nDevice: {4}", new object[] { Request.UserHostAddress, Request.UserHostName, Request.UserAgent, browser, Services.Instance.GetDeviceType(Request.UserAgent) });

            ApplicationLogger.WriteInfo(string.Format("User {0} is trying to login to account {1}{2}", user, account, userInfo));
            AjaxResponseObject ajaxResponse;
            var profile = account;
            try
            {
                // validate required fields
                Validations.ValidateParameter_String("User Name", user);
                Validations.ValidateParameter_String("Password", password);
                Validations.ValidateParameter_String("Account", account);


                if (accountState.Equals("c", StringComparison.OrdinalIgnoreCase))
                {
                    var wsResult = Sessions.ValidateAccount(account);
                    if (wsResult.IsError)
                        throw new AsteaException(wsResult.ErrorMessage);

                    profile = wsResult.Result;
                }

                //login to server
                Sessions.MakeUserLogin(user, password, profile, forceLogin, supressCustomizer, userAcceptTerms, explicitCompanyId);
                ajaxResponse = new AjaxResponseObject(string.Empty);
                ajaxResponse.ExtraResponseItems.Add(new KeyValue { Key = "IsCustomizer", Value = CommonUtils.GetCookieValue("astea_IsCustomizer") });
                ajaxResponse.ResponseData = AsteaProxy.Services.CustomerPortalServices.GetMessage("A2CP027", Astea.Server.Common.RunTime.Services.Instance.GetCurrentCultur());

            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                ajaxResponse = CommonUtils.HandleException(ex);
            }
            return new Custom.CustomJsonResult(ajaxResponse);
        }

        /// <summary>
        /// logout action and redirect to login page
        /// </summary>
        /// <returns></returns>
        [ActionName("Logout")]
        [AcceptVerbs(HttpVerbs.Get)]
        public ActionResult Logout()
        {
            try
            {
                var sessionId = (string)CommonUtils.GetCookieValue("astea_SessionID");
                if (!string.IsNullOrEmpty(sessionId))
                {
                    Sessions.Logout(sessionId);
                }
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
            }

            Sessions.ResetLoginDetails();
            var loginType = System.Web.HttpContext.Current.Items["LoginType"];

            var redirectUriRouteValues = new RouteValueDictionary();
            redirectUriRouteValues.Add("id", 1);
            var ssoOidcQueryArgs = System.Web.HttpContext.Current.Request.QueryString.Get("SsoOidcQueryArgs");

            if (!string.IsNullOrEmpty(ssoOidcQueryArgs))
            {
                loginType = "SsoLogout";
                var ssoOidcQueryArgsArr = ssoOidcQueryArgs.Split(';');

                foreach (var ssoOidcItem in ssoOidcQueryArgsArr)
                {
                    var itemValueArr = ssoOidcItem.Split('~');
                    var itemName = itemValueArr[0];
                    var itemValue = itemValueArr[1];

                    redirectUriRouteValues.Add(itemName, itemValue);
                }

                if (redirectUriRouteValues["authentication_method"] as string == "OIDC")
                {
                    redirectUriRouteValues.Remove("authentication_method");
                }
            }


            // redirect to login page. 
            // if user logged in with account/profile in url, need to add the  account/profile to url
            var loginCookieString = System.Web.HttpContext.Current.Request.Cookies["astea_client_last_login_account"] == null ? "" : System.Web.HttpContext.Current.Request.Cookies["astea_client_last_login_account"].Value;
            if (!string.IsNullOrEmpty(loginCookieString))
            {
                loginCookieString = HttpUtility.UrlDecode(loginCookieString);
                dynamic cookieInfo = JsonConvert.DeserializeObject(loginCookieString);
                var accountByUrl = cookieInfo.accountByUrl;
                if (accountByUrl != null && !string.IsNullOrEmpty(accountByUrl.Value))
                {
                    if (string.IsNullOrEmpty(ssoOidcQueryArgs))
                    {
                        return RedirectToAction(loginType.ToString(), "login", new { account = accountByUrl.Value });
                    }
                    else
                    {
                        return RedirectToAction(loginType.ToString(), "login", redirectUriRouteValues);
                    }
                }
            }

            if (!string.IsNullOrEmpty(ssoOidcQueryArgs))
            {
                return RedirectToAction(loginType.ToString(), "login", redirectUriRouteValues);
            }

            return RedirectToAction(loginType.ToString(), "login");
        }

        /// <summary>
        /// logout action and redirect to login page
        /// </summary>
        /// <returns></returns>
        [ActionName("api-logout")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult LogoutApp()
        {
            AjaxResponseObject ajaxResponse;
            try
            {
                var sessionId = CommonUtils.CurrentHTTPContext().Items["astea_SessionID"];
                if (sessionId != null)
                {
                    Sessions.ResetLoginDetails();
                    Sessions.Logout(sessionId.ToString());
                }
                ajaxResponse = new AjaxResponseObject("");
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                ajaxResponse = CommonUtils.HandleException(ex);
            }
            return new Custom.CustomJsonResult(ajaxResponse);
        }

        [ActionName("profile-accounts")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult GetProfilesByAccount(string account)
        {
            AjaxResponseObject ajaxResponse;
            try
            {
                string result = AsteaProxy.Services.SettingsProxy.GetAccountProfiles(account);
                if (string.IsNullOrEmpty(result))
                {
                    //TODO: report to log that no profiles found
                    ViewData["accountState"] = ViewData["ProfilesJson"] = ViewData["profiles"] = string.Empty;
                }
                var wsResult = new WsResultDefinition(result);
                if (wsResult.IsError)
                {
                    throw new AsteaException(wsResult.ErrorMessage);
                }


                List<string> profiles = wsResult.Result.Split(new char[] { ';' }).ToList<string>();
                ViewData["profiles"] = profiles;
                ViewData["ProfilesJson"] = System.Web.Helpers.Json.Encode(profiles);
                ajaxResponse = new AjaxResponseObject(ViewData["ProfilesJson"]);
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                ajaxResponse = CommonUtils.HandleException(ex);
            }
            return new Custom.CustomJsonResult(ajaxResponse);
        }

        /// <summary>
        /// called by client to validate session
        /// </summary>
        /// <returns></returns>
        [ActionName("api-is_session-valid")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult IsSessionValid()
        {
            AjaxResponseObject ajaxResponse;
            try
            {
                var sessionId = CommonUtils.CurrentHTTPContext().Items["astea_SessionID"].ToString();
                bool sessionValid = Sessions.IsSessionValid(sessionId);
                ajaxResponse = new AjaxResponseObject(sessionValid);
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                ajaxResponse = new AjaxResponseObject(false);
            }
            return new Custom.CustomJsonResult(ajaxResponse);
        }

        #endregion Login Actions

        #region Admin Actions

        [ActionName("admin")]
        [AcceptVerbs(HttpVerbs.Get)]
        public ActionResult AdminLoginGet()
        {
            Sessions.ResetLoginDetails();
            return View("AdminLogin");
        }

        /// <summary>
        /// ajax api call - user login
        /// </summary>
        /// <returns></returns>
        [ActionName("admin-login")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult AdminLogin(string user, string password)
        {
            //login to server
            AjaxResponseObject ajaxResponse;
            try
            {
                Sessions.ResetLoginDetails();
                var validAdminLogin = AsteaProxy.Services.CustomerPortalServices.AdministratorLogin(user, password);
                if (validAdminLogin)
                {
                    //CommonUtils.SetCookieValue("astea_AdminLogin", Boolean.TrueString);
                    CommonUtils.CurrentHTTPContext().Items["astea_AdminLogin"] = Boolean.TrueString;
                    ajaxResponse = new AjaxResponseObject(string.Empty);
                }
                else
                {
                    var errMsg = AsteaProxy.Services.GetElement("invalid_admin_user_vx");
                    throw new AsteaException(errMsg);
                }
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                ajaxResponse = CommonUtils.HandleException(ex);
            }
            return new Custom.CustomJsonResult(ajaxResponse);
        }

        [ActionName("admin-page")]
        [AcceptVerbs(HttpVerbs.Get)]
        public ActionResult AdminPageGet()
        {
            // validate admin login...
            //var adminLoginString = CommonUtils.GetCookieValue("astea_AdminLogin");
            //adminLoginString = HttpUtility.UrlDecode(adminLoginString);
            //dynamic cookieInfo = JsonConvert.DeserializeObject(adminLoginString);
            //var allowAdminLogin = cookieInfo != null ? cookieInfo.AllowAdminLogin.Value : "";
            //if (allowAdminLogin != null && !allowAdminLogin.ToString().Equals(Boolean.TrueString, StringComparison.OrdinalIgnoreCase))
            //	return View("AdminLogin");

            return View("AdminPage");
        }
        #endregion Admin Actions
        #region Private Mthods

        /// <summary>
        /// Populate account value
        /// </summary>
        private List<string> PopulateAccountState(string account = "", string accountSate = "")
        {
            List<string> profiles = new List<string>();
            string result = "";
            if (string.IsNullOrEmpty(account))
            {
                result = AsteaProxy.Services.SettingsProxy.GetAccountsState();
            }
            else
            {
                result = AsteaProxy.Services.SettingsProxy.GetAccountProfiles(account);
            }
            if (string.IsNullOrEmpty(result))
            {
                //TODO: report to log that no profiles found
                ViewData["accountState"] = ViewData["ProfilesJson"] = ViewData["profiles"] = string.Empty;
                return profiles;
            }

            var wsResult = new WsResultDefinition(result);
            ViewData["accountStateMsg"] = "";

            if (wsResult.IsError)
            {
                ViewData["accountStateMsg"] = wsResult.ErrorMessage;
            }
            ViewData["accountState"] = wsResult.Result;

            if (!string.IsNullOrEmpty(accountSate))
            {
                ViewData["accountState"] = accountSate;
            }

            if (string.IsNullOrEmpty(account) || accountSate == "P")
            {
                profiles = AsteaProxy.Services.SettingsProxy.GetProfiles();
            }
            else
            {
                profiles = wsResult.Result.Split(new char[] { ';' }).ToList<string>();
            }

            ViewData["profiles"] = profiles;
            ViewData["ProfilesJson"] = System.Web.Helpers.Json.Encode(profiles);

            return profiles;
        }
        #endregion Private Mthods
    }
}
