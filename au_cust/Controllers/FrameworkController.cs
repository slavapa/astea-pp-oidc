using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Xml.Linq;
using Astea.Definitions.Screen;
using System;
using System.Web.Mvc;
using Astea.Server.Common.Definitions;
using Astea.Server.Common.Enum;
using Astea.Server.Common.RunTime;
using Astea.Server.OData;
using AsteaAlliance.UI.CustomersPortal.BusinessLogic;
using Newtonsoft.Json;

namespace AsteaAlliance.UI.CustomersPortal.Controllers
{
	[OutputCache(NoStore = false, Duration = 0, VaryByParam = "*")]
	public class FrameworkController : BaseController
	{
		/// <summary>
		/// Close state
		/// </summary>
		/// <param name="moduleName"></param>
		/// <param name="stateId"></param>
		/// <param name="hostName"> </param>
		/// <returns></returns>
		[ActionName("close-state")]
		[AcceptVerbs(HttpVerbs.Post)]
		public ActionResult CloseState(string moduleName, string stateId, string hostName)
		{
			AjaxResponseObject ajaxResponse;
			try
			{
				var oDataResponse = new OdataResponse();
				if (!string.IsNullOrEmpty(stateId))
				{
					oDataResponse = AsteaProxy.DataLayer.CloseState(moduleName, stateId, hostName);
				}
				ajaxResponse = new AjaxResponseObject(oDataResponse);
			}
			catch (Exception ex)
			{
				ApplicationLogger.WriteError(ex);
				ajaxResponse = CommonUtils.HandleException(ex);
			}
			return new Custom.CustomJsonResult(ajaxResponse);
		}

		/// <summary>
		/// export qbe grid data
		/// </summary>
		/// <param name="moduleName">module name</param>
		/// <param name="searchCriteria">odata filter</param>
		/// <returns></returns>
		[ActionName("export-query")]
		[AcceptVerbs(HttpVerbs.Post)]
		public ActionResult ExportQbeData(string moduleName, string searchCriteria)
		{
			AjaxResponseObject ajaxResponse;
			var additionalHeaders = new List<AdditionalHeadersData>();
			try
			{
				additionalHeaders.Add(new AdditionalHeadersData
					{
						HeaderKey = "recordlimit",
						HeaderValue = CommonEnum.RecordLimitType.ExportRecordLimit.ToString()
					});

				var oDataResponse = AsteaProxy.DataLayer.ExportQuery(moduleName, "", searchCriteria, "", "", additionalHeaders);
				if (oDataResponse.HasError)
				{
					var response = Services.Instance.BuildAjaxResponse(oDataResponse);
					return new Custom.CustomJsonResult(response);
				}
				var exportUrl = GetDownloadUrl(oDataResponse.OdataResults);

				ajaxResponse = new AjaxResponseObject(exportUrl);
				return new Custom.CustomJsonResult(ajaxResponse);
			}
			catch (Exception ex)
			{
				ApplicationLogger.WriteError(ex);
				ajaxResponse = CommonUtils.HandleException(ex);
				return new Custom.CustomJsonResult(ajaxResponse);
			}
		}

		/// <summary>
		/// get query data by entity and query name
		/// </summary>
		/// <param name="entityName"></param>
		/// <param name="queryName"></param>
		/// <param name="sortCriteria"></param>
		/// /// <param name="filterCriteria"></param>
		/// <returns></returns>
		[ActionName("execute-query")]
		[AcceptVerbs(HttpVerbs.Post)]
		public ActionResult AjaxExecuteQuery(string entityName, string queryName, string module, string sortCriteria,
		                                     string filterCriteria)
		{
			try
			{
				var oDataResponse = AsteaProxy.DataLayer.ExecuteOdataDdlbObject(entityName, queryName, module, sortCriteria,
				                                                                filterCriteria, "", "");
				if (oDataResponse.HasError)
				{
					var response = Services.Instance.BuildAjaxResponse(oDataResponse);
					return new Custom.CustomJsonResult(response);
				}
				// serialize response as json
				return new Custom.CustomJsonResult(new Custom.Simple_XML_JSON_TextResult(oDataResponse.OdataResults));
			}
			catch (Exception ex)
			{
				ApplicationLogger.WriteError(ex);
				return new Custom.CustomJsonResult(new Custom.Simple_XML_JSON_TextResult(ex.Message));
			}
		}

		/// <summary>
		/// get query data by entity and query name for lookup only
		/// </summary>
		/// <param name="entityName"></param>
		/// <param name="queryName"></param>
		/// <param name="lookupColumns"></param>
		/// <param name="filterFields"></param>
		/// <param name="sortCriteria"></param>
		/// <returns></returns>
		[ActionName("execute-lookup")]
		[AcceptVerbs(HttpVerbs.Post)]
		public ActionResult AjaxExecuteQueryLookup(string entityName, string queryName, string module, string lookupColumns,
		                                           string filterFields, string sortCriteria)
		{
			try
			{
				// get filter value
				string filterValue = Request.Form["filter[filters][0][value]"] ?? "";
				filterValue = filterValue.Replace("'", "''").Replace("\"", "\"\"");

				// set filter criteria from filter column
				string filterCriteria = "";
				var columnCriteria = new List<string>();
				if (!string.IsNullOrWhiteSpace(filterValue))
				{
					// build criteria according to columns defintion
					if (!string.IsNullOrEmpty(lookupColumns))
					{
						var lookupColumnsString = HttpUtility.UrlDecode(lookupColumns);
						dynamic lookupColumnsInfo = JsonConvert.DeserializeObject(lookupColumnsString);
						foreach (var columnInfo in lookupColumnsInfo)
						{
							var ignorCondition = columnInfo.Element_displayonly == null
								                     ? false
								                     : columnInfo.Element_displayonly.Value.ToString().ToLower() == "true";
							if (ignorCondition)
								continue;

							string valueType = columnInfo.Type.Value.ToString().ToLower();
							if (valueType != null)
							{
								if (valueType == "lookup" && (module == "cst_site_locations_cst_site_locations_lup"))
								{
									valueType = "number";
								}
								switch (valueType)
								{
									case "number":
									case "decimal":
										columnCriteria.Add(string.Format("({0} eq {1})", columnInfo.Name.Value, filterValue));
										break;
									default:
										columnCriteria.Add(string.Format("substringof({0},'{1}')", columnInfo.Name.Value, filterValue));
										break;
								}
							}
							else
							{
								throw new Exception("Lookup columns missing paramter 'Name'");
							}
						}
						filterCriteria = string.Join(" or ", columnCriteria);
					}
				}

				// build criteria according to filter fields
				var filterFieldsCriteria = new List<string>();
				string filterFieldsCriteriaAsString = "";
				if (!string.IsNullOrEmpty(filterFields))
				{
					dynamic filterFieldsInfo = JsonConvert.DeserializeObject(HttpUtility.UrlDecode(filterFields));
					foreach (var fieldInfo in filterFieldsInfo)
					{
						var ignorCondition = fieldInfo.Element_displayonly == null
							                     ? false
							                     : fieldInfo.Element_displayonly.Value.ToString().ToLower() == "true";
						if (ignorCondition)
							continue;

						string fieldType = fieldInfo.FieldType.Value.ToString().ToLower();
						if (fieldType != null)
						{
                            //Added for BRD-63-AU0062032
                            if (fieldType == "lookup" && (module == "cst_itil_category_lup" || module == "cst_itil_category_lines_lup" ) && fieldInfo.FieldName.Value == "cst_entity_id")
                            {
                                fieldType = "number";
                            }							
							else if(fieldType == "lookup" && (module == "cst_site_locations_cst_site_locations_lup") && fieldInfo.FieldName.Value == "company_id")
							{
								fieldInfo.FieldOperator.Value = "equal";
							}
							switch (fieldType)
							{
								case "number":
								case "decimal":
									filterFieldsCriteria.Add(string.Format("({0} eq {1})", fieldInfo.FieldName.Value, fieldInfo.FieldValue.Value));
									break;
								default:
									if (fieldInfo.FieldOperator != null && fieldInfo.FieldOperator.Value.ToLower() == "equal")
									{
										filterFieldsCriteria.Add(string.Format("({0} eq '{1}')", fieldInfo.FieldName.Value, fieldInfo.FieldValue.Value));
									}
                                    else if(module == "cst_itil_category_lup" || module == "cst_itil_category_lines_lup")
									{
										filterFieldsCriteria.Add(string.Format("({0} eq '{1}')", fieldInfo.FieldName.Value, fieldInfo.FieldValue.Value));
                                    }
									else
									{
                                        filterFieldsCriteria.Add(string.Format("substringof({0},'{1}')", fieldInfo.FieldName.Value, fieldInfo.FieldValue.Value));                                        
									}
									break;
							}
						}
						else
						{
							throw new Exception("Filter fields missing paramter 'Name'");
						}
					}
					filterFieldsCriteriaAsString = string.Join(" and ", filterFieldsCriteria);
				}


				// add filter fields criteria
				if (filterFieldsCriteriaAsString != "")
				{
					filterCriteria += (filterCriteria.Trim() == "" ? "" : " and ") + filterFieldsCriteriaAsString;
				}

				var oDataResponse = AsteaProxy.DataLayer.ExecuteOdataDdlbObject(entityName, queryName, module, sortCriteria,
				                                                                filterCriteria,
				                                                                "", "");
				if (oDataResponse.HasError)
				{
					var response = Services.Instance.BuildAjaxResponse(oDataResponse);
					return new Custom.CustomJsonResult(response);
				}
				// serialize response as json
				return new Custom.CustomJsonResult(new Custom.Simple_XML_JSON_TextResult(oDataResponse.OdataResults));
			}
			catch (Exception ex)
			{
				ApplicationLogger.WriteError(ex);
				return new Custom.CustomJsonResult(new Custom.Simple_XML_JSON_TextResult(ex.Message));
			}
		}

		/// <summary>
		/// export maint page data
		/// </summary>
		/// <param name="moduleName"></param>
		/// <param name="stateId"></param>
		/// <param name="hostName"></param>
		/// <returns></returns>
		[ActionName("export-state")]
		[AcceptVerbs(HttpVerbs.Post)]
		public ActionResult ExportMaintPage(string moduleName, string stateId, string hostName)
		{
			AjaxResponseObject ajaxResponse;
			var additionalHeaders = new List<AdditionalHeadersData>();
			try
			{
				additionalHeaders.Add(new AdditionalHeadersData {HeaderKey = "HostName", HeaderValue = hostName});
				var oDataResponse = AsteaProxy.DataLayer.ExportState(moduleName, stateId, additionalHeaders);
				if (oDataResponse.HasError)
				{
					var response = Services.Instance.BuildAjaxResponse(oDataResponse);
					return new Custom.CustomJsonResult(response);
				}
				var exportUrl = GetDownloadUrl(oDataResponse.OdataResults);
				ajaxResponse = new AjaxResponseObject(exportUrl);
				return new Custom.CustomJsonResult(ajaxResponse);
			}
			catch (Exception ex)
			{
				ApplicationLogger.WriteError(ex);
				ajaxResponse = CommonUtils.HandleException(ex);
				return new Custom.CustomJsonResult(ajaxResponse);
			}
		}

		/// <summary>
		///  Generic method to execute action (macro) in AA server
		/// </summary>
		/// <param name="module"></param>
		/// <param name="actionName"></param>
		/// <param name="stateId"></param>
		/// <param name="hostName"></param>
		/// <param name="resultable"></param>
		/// <param name="closeState"></param>
		/// <param name="actionParameters"></param>
		/// <returns></returns>
		[ValidateInput(false)]
		[ActionName("execute-action")]
		[AcceptVerbs(HttpVerbs.Post)]
		public ActionResult ExectionOdataAction(string module, string actionName, string stateId, string hostName,
		                                        bool resultable, bool closeState,
		                                        List<Astea.Server.OData.ActionParameter> actionParameters)
		{
			AjaxResponseObject ajaxResponse;
			var oData = new OData();
			try
			{
				OdataResponse oDataActionResponse = oData.ExecuteOdataAction(module, actionName, resultable, closeState,
				                                                             actionParameters == null
					                                                             ? null
					                                                             : new OdataActionParameters(actionParameters),
				                                                             stateId, hostName);
				ajaxResponse = new AjaxResponseObject(oDataActionResponse);
				if (oDataActionResponse.HasError)
				{
					ApplicationLogger.WriteError(string.Format("Error Message {0} \n Inner Error {1}", oDataActionResponse.ErrorMessage,
					                                           oDataActionResponse.InnerErrorMessage));
					ajaxResponse =
						CommonUtils.HandleApplicationError(oDataActionResponse.ErrorMessage != null
							                                   ? oDataActionResponse.ErrorMessage.ToString()
							                                   : oDataActionResponse.InnerErrorMessage.ToString(),
						                                   oDataActionResponse.ErrorCode.ToString());
					return new Custom.CustomJsonResult(ajaxResponse);
				}
				return new Custom.CustomJsonResult(ajaxResponse);
			}
			catch (Exception ex)
			{
				ApplicationLogger.WriteError(ex);
				ajaxResponse = CommonUtils.HandleException(ex);
				return new Custom.CustomJsonResult(ajaxResponse);
			}
		}

		/// <summary>
		/// Get module title by page type
		/// </summary>
		/// <param name="moduleName"></param>
		/// <param name="pageType"></param>
		/// <returns></returns>
		[ValidateInput(false)]
		[ActionName("get-module-title")]
		[AcceptVerbs(HttpVerbs.Post)]
		public ActionResult GetModuleTitle(string moduleName, string pageType)
		{
			var PageType = Astea.Definitions.Screen.PageType.MAINT;
			try
			{
				switch (pageType.ToLower())
				{
					case "qbe":
						PageType = PageType.QBE;
						break;
					case "new":
						PageType = PageType.NEW;
						break;
					case "gadget":
						PageType = PageType.GADGET;
						break;
					case "maint":
						PageType = PageType.MAINT;
						break;
				}
				Page pageMetaData = AsteaProxy.MetaData.GetScreenPage(moduleName, PageType);
				var element =
					pageMetaData.PageElements.FirstOrDefault(
						obj => obj.Key.Equals("title", StringComparison.InvariantCultureIgnoreCase));
				return new Custom.CustomJsonResult(element == null ? "" : element.Value);
			}
			catch (Exception ex)
			{
				ApplicationLogger.WriteError(ex);
				var ajaxResponse = CommonUtils.HandleException(ex);
				return new Custom.CustomJsonResult(ajaxResponse);
			}
		}

		/// <summary>
		/// Get user help view
		/// </summary>
		/// <returns></returns>
		[ActionName("screen-user-help")]
		[AcceptVerbs(HttpVerbs.Get)]
		public ActionResult GetScreenUserHelp()
		{
			try
			{
				return PartialView("screen-user-help");
			}
			catch (Exception ex)
			{
				ApplicationLogger.WriteError(ex);
				AjaxResponseObject ajaxResponse = CommonUtils.HandleException(ex);
				return new Custom.CustomJsonResult(ajaxResponse);
			}
		}


        /// <summary>
        /// Creates the new report.
        /// </summary>
        /// <param name="reportTitle">The report title.</param>
        /// <param name="reportSql">The report SQL.</param>
        /// <param name="reportType">Type of the report.</param>
        /// <returns></returns>
        /// <exception cref="System.Exception"></exception>
		[ActionName("generate-report")]
		[AcceptVerbs(HttpVerbs.Post)]
		public ActionResult CreateNewReport(string reportTitle, string reportSql,string reportType)
		{
			AjaxResponseObject ajaxResponse;
			try
			{
				string reportName = reportTitle.Replace(" ", "_");
				var asteaLang = Astea.Server.Common.RunTime.Services.Instance.GetAsteaCultureName();
			    var cultur = Astea.Server.Common.RunTime.Services.Instance.GetCurrentCultur();
				var result = AsteaProxy.Services.MdCustomizerManager.CreateReport(reportName, reportTitle, asteaLang, reportType,
				                                                                  reportSql);

				if (string.IsNullOrEmpty(result))
				{
                    var asteaReportBaseUrl = CommonUtils.GetReportsUrl();
                    var urlParams = new object[] { asteaReportBaseUrl, reportName, CommonUtils.CurrentHTTPContext().Items["astea_EncryptedSessionID"], cultur, asteaLang };
                    var reportUrl = string.Format("{0}reportName={1}&sessionId={2}&culture={3}&asteaCulture={4}", urlParams);
					//reportUrl = reportUrl.Replace("/ReportViewer/Viewer", "/ReportDesigner/Designer");
					ajaxResponse = new AjaxResponseObject(reportUrl);
					return new Custom.CustomJsonResult(ajaxResponse);
				}
				else
				{
					throw new Exception(result);
				}
			}
			catch (Exception ex)
			{
				ApplicationLogger.WriteError(ex);
				ajaxResponse = CommonUtils.HandleException(ex);
				return new Custom.CustomJsonResult(ajaxResponse);
			}
		}

        /// <summary>
        /// Validates the report query.
        /// </summary>
        /// <param name="reportSql">The report SQL.</param>
        /// <returns></returns>
        [ActionName("validate-query")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult ValidateReportQuery(string reportSql)
        {
            AjaxResponseObject ajaxResponse;
            try
            {
                var result = AsteaProxy.Services.MdCustomizerManager.ValidateQuery(reportSql);
                ajaxResponse = new AjaxResponseObject(result);
                return new Custom.CustomJsonResult(ajaxResponse);
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
                ajaxResponse = CommonUtils.HandleException(ex);
                return new Custom.CustomJsonResult(ajaxResponse);
            }
        }


	    /// <summary>
	    /// Availables the agents.
	    /// </summary>
	    /// <param name="topicId">The topic.</param>
	    /// <returns></returns>
	    [ActionName("check-available-agents")]
	    [AcceptVerbs(HttpVerbs.Post)]
	    public ActionResult AvailableAgents(string topicId)
	    {
	        var available = false;
	        AjaxResponseObject ajaxResponse = null;
	        try
	        {
	            var filter = string.Format("a_topic_id eq '{0}'", topicId);
	            var oDataResponse = AsteaProxy.DataLayer.ExecuteOdataDdlbObject("", "",
	                                                                            "persons_chat_topics_xref_list_of_login_persons_per_topic",
	                                                                            "", filter, "", "");
	            if (oDataResponse.HasError)
	            {
	                var response = Services.Instance.BuildAjaxResponse(oDataResponse);
	                return new Custom.CustomJsonResult(response);
	            }

	            dynamic availableAgents = JsonConvert.DeserializeObject(oDataResponse.OdataResults);
	            if (availableAgents.TotalCount.ToString() != "0")
	            {
	                available = true;
	            }
	            ajaxResponse = new AjaxResponseObject(available);
	        }
	        catch (Exception ex)
	        {
	            ApplicationLogger.WriteError(ex);
	            ajaxResponse = new AjaxResponseObject(available);
	        }
	        return new Custom.CustomJsonResult(ajaxResponse);
	    }

        /// <summary>
        /// Validates returned address in Astea.GeoCoding service.
        /// </summary>
        /// <param name="street">The street.</param>
        /// <param name="city">The city.</param>
        /// <param name="state">The state.</param>
        /// <param name="zip">The zip.</param>
        /// <param name="country">The country.</param>
        /// <returns></returns>
        /// <exception cref="Exception">Failed to validate address: " + statusText</exception>
	    [ActionName("validate-address")]
	    [AcceptVerbs(HttpVerbs.Post)]
	    public ActionResult ValidateAddress(string street, string city, string state, string zip, string country)
	    {
	        try
	        {
	            var results = AsteaProxy.Services.GeoCodingService.GeocodeAddress(street, city, state, zip,
	                                                                              country);
	            var xml = XDocument.Parse(results);
	            var nodes = from row in xml.Element("root").Descendants("row")
                            select row;
	            var address = new Address();
	            foreach (var node in nodes)
	            {
                    var status = node.Element("status").Value;
                    var statusText = node.Element("statusText").Value;
                    if (!status.Equals("ok", StringComparison.InvariantCultureIgnoreCase))
                    {
                        throw new Exception("Failed to validate address: " + statusText);
                    }
                    address.City = node.Element("city").Value;
                    address.State = node.Element("state").Value;
                    address.Country = node.Element("country").Value;
                    address.Street = node.Element("street").Value;
                    address.Zip = node.Element("zip").Value;
	            }
                var ajaxResponse = new AjaxResponseObject(address);
	            return new Custom.CustomJsonResult(ajaxResponse);
	        }
	        catch (Exception ex)
	        {
	            ApplicationLogger.WriteError(ex);
	            return new Custom.CustomJsonResult(new Custom.Simple_XML_JSON_TextResult(ex.Message));
	        }
	    }

        [ActionName("update-gis")]
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult UpdateGisState(string key, string service, string status, string page)
        {
            try
            {
                AsteaProxy.Services.GeoCodingService.UpdateUStats(key,service,status,page);
            }
            catch (Exception ex)
            {
                ApplicationLogger.WriteError(ex);
            }
            return new Custom.CustomJsonResult("");
        }

	    #region Private methods

		private string GetDownloadUrl(string odataResults)
		{
			dynamic exportInfo = JsonConvert.DeserializeObject(odataResults);
			if (exportInfo.value.ToString() == "[]")
			{
				return "File name is empty";
			}
			var fileName = exportInfo.value[0].FileName;
			var exportRelativePath =
                string.Format("Web_Framework/Download.aspx?EncryptedSessionID={0}&id=EXPORT\\{1}&name={1}&delete=true",
                              System.Web.HttpContext.Current.Items["astea_EncryptedSessionID"].ToString(), fileName);
			var uri = new Uri(System.Web.HttpContext.Current.Request.Url.AbsoluteUri);
		    var scheme = CommonUtils.GetScheme(); //Services.Instance.GetScheme();
			scheme = string.IsNullOrEmpty(scheme) ? uri.Scheme : scheme;
			string exportUrl = string.Format("{0}://{1}{2}/{3}", scheme, uri.Host,
			                                 System.Web.HttpContext.Current.Request.ApplicationPath.Split('_')[0],
			                                 exportRelativePath);
			return exportUrl;
		}

		#endregion Private methods
	}
}
