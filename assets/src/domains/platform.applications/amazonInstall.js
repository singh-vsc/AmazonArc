/*
 * This custom function was generated by the Actions Generator
 * in order to enable the other custom functions in this app
 * upon installation into a tenant.
 */

var ActionInstaller = require('mozu-action-helpers/installers/actions');
//var paymentSettingsClient = require("mozu-node-sdk/clients/commerce/settings/checkout/paymentSettings")();
var tennatClient = require("mozu-node-sdk/clients/platform/tenant")();
var constants = require('mozu-node-sdk/constants');
var paymentConstants = require("../../amazon/constants");
var helper =  require("../../amazon/helper");
var _ = require("underscore");

function AppInstall(context, callback) {
	var self = this;
	self.ctx = context;
	self.cb = callback;

	self.initialize = function() {
		console.log("AMAZON-INSTALL"+context);
		console.log("Getting tenant", self.ctx.apiContext.tenantId);
		var tenant = context.get.tenant();
		enableAmazonPaymentWorkflow(tenant);
	};

	function enableAmazonPaymentWorkflow(tenant) {

		try {
			console.log("Installing amazon payment settings", tenant);

			var tasks = tenant.sites.map(function(site) {
											return addUpdatePaymentSettings(context, site);
										});

			Promise.all(tasks).then(function(result) {
				console.log("Amazon payment definition installed");
				enableActions();
			}, function(error) {
				self.cb(error);
			});
		} catch(e) {
			self.cb(e);
		}
	}


	function addUpdatePaymentSettings(context, site) {
		console.log("Adding payment settings for site", site.id);
		var paymentSettingsClient = require("mozu-node-sdk/clients/commerce/settings/checkout/paymentSettings")();
		paymentSettingsClient.context[constants.headers.SITE] = site.id;
		//GetExisting
		var paymentDef = getPaymentDef();
		return paymentSettingsClient.getThirdPartyPaymentWorkflowWithValues({fullyQualifiedName :  paymentDef.namespace+"~"+paymentDef.name })
		.then(function(paymentSettings){
			return updateThirdPartyPaymentWorkflow(paymentSettingsClient, paymentSettings);
		},function(err) {
			return paymentSettingsClient.addThirdPartyPaymentWorkflow(paymentDef);
		});
	}

	function updateThirdPartyPaymentWorkflow(paymentSettingsClient, existingSettings) {
		var paymentDef = getPaymentDef(existingSettings);
		console.log(paymentDef);
		paymentDef.isEnabled = existingSettings.isEnabled;
		return paymentSettingsClient.deleteThirdPartyPaymentWorkflow({ "fullyQualifiedName" : paymentDef.namespace+"~"+paymentDef.name})
		.then(function(result) {
			return paymentSettingsClient.addThirdPartyPaymentWorkflow(paymentDef);
		});
	}


	function enableActions() {
		console.log("installing code actions");
		var installer = new ActionInstaller({ context: self.ctx.apiContext });
	 	installer.enableActions(self.ctx, null, {
      "embedded.commerce.payments.action.performPaymentInteraction" : function(settings) {
        settings = settings || {};
        settings.timeoutMilliseconds =settings.timeoutMilliseconds ||  30000;
        return settings;
      },
      "amazonPaymentActionBefore" : function(settings) {
        settings = settings || {};
        settings.timeoutMilliseconds = settings.timeoutMilliseconds || 30000;
        return settings;
      },
      "amazonCartBefore" : function(settings) {
        settings = settings || {};
        settings.timeoutMilliseconds =settings.timeoutMilliseconds ||  30000;
        settings.configuration = {"allowWarmCheckout" : true};
        return settings;
      },
      "amazonCheckoutBefore" : function(settings) {
        settings = settings || {};
        settings.timeoutMilliseconds = settings.timeoutMilliseconds || 30000;
        return settings;
      },
      "amazonSetFulfillmentInfo" : function(settings) {
        settings = settings || {};
        settings.timeoutMilliseconds = settings.timeoutMilliseconds ||  30000;
        settings.configuration = settings.configuration || {"missingLastNameValue" : "N/A"};
        return settings;
      }
    } ).then(self.cb.bind(null, null), self.cb);
	}

	function getPaymentDef(existingSettings) {
		return  {
		    "name": paymentConstants.PAYMENTSETTINGID,
		    "namespace": context.get.nameSpace(),
		    "isEnabled": "false",
		    "description" : "<div style='font-size:13px;font-style:italic'>Please review our <a style='color:blue;' target='mozupwahelp' href='http://mozu.github.io/IntegrationDocuments/PayWithAmazon/Mozu-PayWithAmazon-App.htm'>Help</a> documentation to configure Pay With Amazon</div>",
		    "credentials":  [
			    	getPaymentActionFieldDef("Environment", paymentConstants.ENVIRONMENT, "RadioButton", false,getEnvironmentVocabularyValues(), existingSettings),
			    	getPaymentActionFieldDef("Seller Id", paymentConstants.SELLERID, "TextBox", false,null,existingSettings),
			    	getPaymentActionFieldDef("Client Id", paymentConstants.CLIENTID, "TextBox", false,null,existingSettings),
			    	getPaymentActionFieldDef("MWS Auth Token", paymentConstants.AUTHTOKEN, "TextBox", true,null,existingSettings),
            getPaymentActionFieldDef("Include Billing Address from Amazon on Order?", paymentConstants.BILLINGADDRESS, "RadioButton", false,getBillingOptions(),existingSettings),
			    	getPaymentActionFieldDef("AWS Region", paymentConstants.REGION, "RadioButton", false,getRegions(),existingSettings),
			    	getPaymentActionFieldDef("Order Processing", paymentConstants.ORDERPROCESSING, "RadioButton", true,getOrderProcessingVocabularyValues(),existingSettings),
			    ]
			};
	}

  function getBillingOptions() {
    return [
      getVocabularyContent("0", "No", "No"),
      getVocabularyContent("1", "Yes", "Yes")
    ];
  }

	function getRegions() {
		return [
			getVocabularyContent("de", "en-US", "DE"),
			getVocabularyContent("uk", "en-US", "UK"),
			getVocabularyContent("us", "en-US", "US"),
			getVocabularyContent("jp", "en-US", "JP")
		];
	}

	function getEnvironmentVocabularyValues() {
		return [
			getVocabularyContent("production", "en-US", "Production"),
			getVocabularyContent("sandbox", "en-US", "Sandbox")
		];
	}

	function getOrderProcessingVocabularyValues() {
		return [
			getVocabularyContent(paymentConstants.CAPTUREONSUBMIT, "en-US", "Authorize and Capture on Order Placement"),
			getVocabularyContent(paymentConstants.CAPTUREONSHIPMENT, "en-US", "Authorize on Order Placement and Capture on Order Shipment")
		];
	}

	function getVocabularyContent(key, localeCode, value) {
		return {
			"key" : key,
			"contents" : [{
				"localeCode" : localeCode,
				"value" : value
			}]
		};
	}

	function getPaymentActionFieldDef(displayName, key, type, isSensitive, vocabularyValues, existingSettings) {
		value = "";
		if (existingSettings)
			value = helper.getValue(existingSettings, key);

		return {
	          "displayName": displayName,
	          "apiName": key,
	          "value" : value,
	          "inputType": type,
	          "isSensitive": isSensitive,
	          "vocabularyValues" : vocabularyValues
		};
	}


}



module.exports = function(context, callback) {

  	try {
  		var appInstall = new AppInstall(context, callback);
  		appInstall.initialize();
  	} catch(e) {
  		callback(e);
  	}

};
