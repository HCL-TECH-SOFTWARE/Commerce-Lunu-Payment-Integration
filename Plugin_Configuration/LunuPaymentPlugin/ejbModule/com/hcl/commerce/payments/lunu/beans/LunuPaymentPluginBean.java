/**
*==================================================
Copyright [2021] [HCL Technologies]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*==================================================
**/

package com.hcl.commerce.payments.lunu.beans;

import java.io.IOException;
import java.util.logging.Logger;

import javax.ejb.Local;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;

import org.apache.commons.lang3.StringUtils;

import com.hcl.commerce.payments.lunu.api.ApiException;
import com.hcl.commerce.payments.lunu.api.ApiResponse;
import com.hcl.commerce.payments.lunu.constants.HCLLunuConstants;
import com.hcl.commerce.payments.lunu.helper.HCLLunuRestAPIHelper;
import com.ibm.commerce.foundation.internal.server.services.registry.StoreConfigurationRegistry;
import com.ibm.commerce.foundation.logging.LoggingHelper;
import com.ibm.commerce.payments.plugin.CommunicationException;
import com.ibm.commerce.payments.plugin.ConfigurationException;
import com.ibm.commerce.payments.plugin.ExtendedData;
import com.ibm.commerce.payments.plugin.FinancialTransaction;
import com.ibm.commerce.payments.plugin.FunctionNotSupportedException;
import com.ibm.commerce.payments.plugin.InvalidDataException;
import com.ibm.commerce.payments.plugin.InvalidPaymentInstructionException;
import com.ibm.commerce.payments.plugin.PaymentInstruction;
import com.ibm.commerce.payments.plugin.Plugin;
import com.ibm.commerce.payments.plugin.PluginContext;
import com.ibm.commerce.payments.plugin.PluginException;
import com.ibm.json.java.JSONObject;

/**
 * Session Bean implementation class LunuPaymentPluginBean
 */

@Stateless(mappedName = "LunuPaymentPluginBean")
@Local(Plugin.class)
@LocalBean
public class LunuPaymentPluginBean implements Plugin {
	
	private static final String CLASS_NAME = "LunuPaymentPluginBean";
	private static final Logger LOGGER = Logger.getLogger(CLASS_NAME);
	private static final String resource_bundle="com.hcl.commerce.payments.lunu.messages.LunuPluginMessages";
	/**
	 * Default constructor.
	 */
	public LunuPaymentPluginBean() {
	}

	@Override
	public FinancialTransaction approve(PluginContext pluginContext, FinancialTransaction transaction, boolean flag)
			throws CommunicationException, PluginException {
		final String METHOD_NAME = "approve";

		if (LoggingHelper.isEntryExitTraceEnabled(LOGGER))
			LOGGER.entering(CLASS_NAME, METHOD_NAME);
		ExtendedData data = transaction.getPayment().getPaymentInstruction().getExtendedData();

		String requestId=data.getString(HCLLunuConstants.PAYMENT_ID);
		String storeId = transaction.getPayment().getPaymentInstruction().getStore();
		StoreConfigurationRegistry storeConfigurationRegistry = StoreConfigurationRegistry.getSingleton();
	
		String apiURL = storeConfigurationRegistry.getValue(Integer.parseInt(storeId), HCLLunuConstants.LUNU_PAYMENT_GET_STATUS_URL);
		String appId = storeConfigurationRegistry.getValue(Integer.parseInt(storeId), HCLLunuConstants.LUNU_APP_ID);
		String secret = storeConfigurationRegistry.getValue(Integer.parseInt(storeId), HCLLunuConstants.LUNU_APP_Secret);
		String paymentAPIUrl= apiURL+requestId;

	
		try {
			ApiResponse response=HCLLunuRestAPIHelper.getLunuPaymentStatus(paymentAPIUrl, appId, secret);
			if(StringUtils.isNotBlank(response.getMessage())){
				JSONObject responseJSON = new JSONObject();
				responseJSON = JSONObject.parse(response.getMessage());
				JSONObject res = (JSONObject) responseJSON.get(HCLLunuConstants.RESPONSE);
				String status=(String) res.get(HCLLunuConstants.RES_STATUS);
				if(StringUtils.containsIgnoreCase(HCLLunuConstants.RES_APPROVE_STATUS, status)){
					if(status.length()>24){
						transaction.setReasonCode(status.substring(0,24));
					}else{
						transaction.setReasonCode(status.substring(0,status.length()));
					}
					
					transaction.setResponseCode(String.valueOf(response.getStatusCode()));
					transaction.setReferenceNumber(requestId);
				}else{
					data.setString("Error", "API_PAYMENT_ERROR", false);
					handleException(METHOD_NAME,"API_PAYMENT_ERROR");
				}
				
			}else{
				data.setString("Error", "API_ERROR", false);
				handleException(METHOD_NAME,"API_ERROR");
			}
		} catch (IOException e) {
			transaction.setResponseCode("IO Exception");
			transaction.setReasonCode("See Extended Data");
			data.setString("Error", e.getMessage(), false);
			e.printStackTrace();
			handleException(METHOD_NAME, String.valueOf(e.getMessage()));
		}catch (ApiException e) {
			data.setString("Error", String.valueOf(e.getCode()), false);
			transaction.setReasonCode(String.valueOf(e.getCode()));
			data.setString("Error", e.getMessage(), false);
			e.printStackTrace();
			handleException(METHOD_NAME, String.valueOf(e.getCode()));
		}
				
		return transaction;
	}

	private void handleException(String methodName,String key) throws PluginException {
		
		PluginException pluginException = new PluginException();
		pluginException.setClassSource(CLASS_NAME);
		pluginException.setMethodSource(methodName);
		pluginException.setResourceBundleName(resource_bundle);
		pluginException.setMessageKey(key);
		throw pluginException;
	}

	@Override
	public FinancialTransaction approveAndDeposit(PluginContext pluginContext, FinancialTransaction transaction, boolean flag)
			throws FunctionNotSupportedException, PluginException {
		String METHOD_NAME = "approveAndDeposit";
		throw createFunctionNotSupportedException(pluginContext, transaction, METHOD_NAME);
	}

	@Override
	public boolean checkHealth() {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public void checkPaymentInstruction(PluginContext pluginContext, PaymentInstruction transaction)
			throws InvalidPaymentInstructionException, ConfigurationException, InvalidDataException {
		// TODO Auto-generated method stub
		
	}

	@Override
	public FinancialTransaction credit(PluginContext pluginContext, FinancialTransaction transaction, boolean flag)
			throws PluginException {
		String METHOD_NAME = "credit";
		throw createFunctionNotSupportedException(pluginContext, transaction, METHOD_NAME);
	}

	@Override
	public FinancialTransaction deposit(PluginContext pluginContext, FinancialTransaction transaction, boolean flag)
			throws PluginException {
		String METHOD_NAME = "deposit";
		throw createFunctionNotSupportedException(pluginContext, transaction, METHOD_NAME);
	}

	@Override
	public String getMessage(PluginContext pluginContext, String transaction) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public FinancialTransaction reverseApproval(PluginContext pluginContext, FinancialTransaction transaction, boolean flag)
			throws CommunicationException, PluginException {
		String METHOD_NAME = "reverseApproval";
		throw createFunctionNotSupportedException(pluginContext, transaction, METHOD_NAME);
	}

	@Override
	public FinancialTransaction reverseCredit(PluginContext pluginContext, FinancialTransaction transaction, boolean flag)
			throws InvalidPaymentInstructionException, FunctionNotSupportedException, InvalidDataException {
		String METHOD_NAME = "reverseCredit";
		throw createFunctionNotSupportedException(pluginContext, transaction, METHOD_NAME);
	}

	@Override
	public FinancialTransaction reverseDeposit(PluginContext pluginContext, FinancialTransaction transaction, boolean flag)
			throws FunctionNotSupportedException, PluginException {
		String METHOD_NAME = "reverseDeposit";
		throw createFunctionNotSupportedException(pluginContext, transaction, METHOD_NAME);
	}

	@Override
	public void validatePaymentInstruction(PluginContext pluginContext, PaymentInstruction transaction)
			throws InvalidPaymentInstructionException, FunctionNotSupportedException {
		// TODO Auto-generated method stub
		
	}
	
	private FunctionNotSupportedException createFunctionNotSupportedException(PluginContext pluginContext,
			FinancialTransaction tran, String methodName) {
		FunctionNotSupportedException e = new FunctionNotSupportedException();
		e.setClassSource("StripePaymentPlugin");
		e.setMethodSource(methodName);
		e.setMessageKey("PLUGIN_FUNCTION_NOT_SUPPORTED");
		e.addProperty("plugin context", pluginContext);
		e.addProperty("Financial transaction", tran);
		return e;
	}

}
