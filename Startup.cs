using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AsteaAlliance.UI.CustomersPortal.BusinessLogic;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Owin;
using Microsoft.Owin.Extensions;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.Notifications;
using Microsoft.Owin.Security.OpenIdConnect;
using Owin;

[assembly: OwinStartup(typeof(OpenIdConnectTest.Startup))]

namespace OpenIdConnectTest
{
    public partial class Startup
    {   
        public void Configuration(IAppBuilder app)
        {
            app.SetDefaultSignInAsAuthenticationType(CookieAuthenticationDefaults.AuthenticationType);
            var cookieOpt = new CookieAuthenticationOptions();
            cookieOpt.CookieSameSite = SameSiteMode.None;
            app.UseCookieAuthentication(cookieOpt);

            List<string> profiles = CommonUtils.PopulateAccountState();
            var ssoProviderList = CommonUtils.SsoProvidersPP(profiles);

            foreach (var ssoProvider in ssoProviderList)
            {
                var spKey = ssoProvider.CustomerId;

                OpenIdConnectAuthenticationOptions authOptions = new OpenIdConnectAuthenticationOptions()
                {
                    // For each policy, give OWIN the policy-specific metadata address, and
                    // set the authentication type to the id of the policy
                    MetadataAddress = ssoProvider.MetadataAddress,
                    AuthenticationType = spKey,
                    //Authority = ssoProvider.Authority,

                    // Sets the ClientId, authority, RedirectUri as obtained from global.xml
                    ClientId = ssoProvider.ClientId,
                    RedirectUri = ssoProvider.RedirectUri,
                    // PostLogoutRedirectUri is the page that users will be redirected to after sign-out.
                    PostLogoutRedirectUri = ssoProvider.PostLogoutRedirectUri,
                    Scope = OpenIdConnectScope.OpenIdProfile,
                    // ResponseType is set to request the code id_token - which contains basic information about the signed-in user
                    ResponseType = OpenIdConnectResponseType.CodeIdToken,
                    // OpenIdConnectAuthenticationNotifications configures OWIN to send notification of failed authentications to OnAuthenticationFailed method
                    Notifications = new OpenIdConnectAuthenticationNotifications
                    {
                        AuthenticationFailed = OnAuthenticationFailed
                    },

                    // ValidateIssuer set to false to allow personal and work accounts from any organization to sign in to your application
                    // To only allow users from a single organizations, set ValidateIssuer to true and 'tenant' setting in web.config to the tenant name
                    // To allow users from only a list of specific organizations, set ValidateIssuer to true and use ValidIssuers parameter
                    // This piece is optional - it is used for displaying the user's name in the navigation bar.
                    TokenValidationParameters = new TokenValidationParameters
                    {
                        NameClaimType = spKey,
                        SaveSigninToken = true, //important to save the token in boostrapcontext
                        ValidateIssuer = true 
                    }
                };

                if (!string.IsNullOrEmpty(ssoProvider.Secret) && ssoProvider.Secret.Length > 1)
                {
                    authOptions.ClientSecret = ssoProvider.Secret;
                }

                app.UseOpenIdConnectAuthentication(authOptions);              
            }

            Microsoft.IdentityModel.Logging.IdentityModelEventSource.ShowPII = true;
            //app.UseStageMarker(PipelineStage.Authenticate);
        }

        private Task OnAuthenticationFailed(AuthenticationFailedNotification<OpenIdConnectMessage, OpenIdConnectAuthenticationOptions> arg)
        {
            arg.HandleResponse();
            arg.Response.Redirect("/?errormessage=" + arg.Exception.Message);
            return Task.FromResult(0);
        }
    }


}

























