package com.hcl.commerce.lunu.payment.commands;

import java.io.IOException;
import java.text.NumberFormat;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.apache.commons.lang3.StringUtils;
import org.json.JSONException;
import org.json.JSONObject;

import com.hcl.commerce.payments.lunu.api.HCLLunuRESTApiHelper;
import com.hcl.commerce.payments.lunu.constants.HCLLunuConstants;
import com.ibm.commerce.command.ControllerCommandImpl;
import com.ibm.commerce.datatype.TypedProperty;
import com.ibm.commerce.exception.ECApplicationException;
import com.ibm.commerce.exception.ECException;
import com.ibm.commerce.foundation.logging.LoggingHelper;
import com.ibm.commerce.ras.ECMessage;
/**
 * This command get confirmation token by invoke Lunu create service.
 *
 */
public class HCLLunuPaymentProcessCmdImpl extends ControllerCommandImpl  implements HCLLunuPaymentProcessCmd{

	private TypedProperty requestProperties = new TypedProperty();
	public String store_Id;
	public String methodFlagVal;
	private static final String CLASSNAME = HCLLunuPaymentProcessCmdImpl.class.getName();
	private static final Logger LOGGER = LoggingHelper.getLogger(HCLLunuPaymentProcessCmdImpl.class);
	private String orderId;
	private String email;
	private String amount;
	private String idempotenceKey;


	/**
	 * This method call Lunu payment create API service. 
	 */
	public void performExecute() throws ECApplicationException {
		String METHOD_NAME = "performExecute";
		LOGGER.entering(CLASSNAME, METHOD_NAME);
		if (LOGGER.isLoggable(Level.FINEST)) {
			LOGGER.logp(Level.FINEST, CLASSNAME, METHOD_NAME, " requestProperties:: " + requestProperties);
		}
		TypedProperty response = new TypedProperty();
		JSONObject jsonResult = null;
		try {
			jsonResult = HCLLunuRESTApiHelper.sendLunuRESTApiOrderCreateRequest(this.orderId, this.email, this.amount,
					getStoreId(),idempotenceKey);
			response.putAll(jsonResult.toMap());
		} catch (JSONException | IOException e) {
			e.printStackTrace();
			throw new ECApplicationException(ECMessage._ERR_CMD_BAD_EXEC_CMD, CLASSNAME, METHOD_NAME);
		}

		setResponseProperties(response);
		if (LoggingHelper.isEntryExitTraceEnabled(LOGGER))
			LOGGER.exiting(CLASSNAME, METHOD_NAME);
	}

	/**
	 * Set the request properties
	 */
	public void setRequestProperties(TypedProperty requestProperties) {
		this.requestProperties = requestProperties;
	}

	/**
	 * Validate the mandatory parameter.
	 */
	public void validateParameters() throws ECException {

		String METHOD_NAME = "validateParameters";
		if (LoggingHelper.isEntryExitTraceEnabled(LOGGER))
			LOGGER.entering(CLASSNAME, METHOD_NAME);
		
			if (LOGGER.isLoggable(Level.FINEST)) {
				LOGGER.logp(Level.FINEST, CLASSNAME, METHOD_NAME,
						"request Properties are: " + getCommandContext().getRequestProperties());
			}
			this.email = this.requestProperties.getString(HCLLunuConstants.LUNU_CREATE_JSONBODY_KEY_EMAIL, null);
			this.amount = this.requestProperties.getString(HCLLunuConstants.LUNU_CREATE_JSONBODY_KEY_AMOUNT,
					null);
			this.orderId = this.requestProperties.getString(HCLLunuConstants.WCS_ORDER_ID, null);
			this.idempotenceKey = this.requestProperties.getString(HCLLunuConstants.REQ_IDEMPOTENCE_KEY);
			if (this.email == null || StringUtils.isEmpty(this.email)) {
				throw new ECApplicationException(ECMessage._ERR_CMD_BAD_PARAMETER, CLASSNAME, METHOD_NAME,
						new Object[] { "email" });
			}
			if (this.amount == null || StringUtils.isEmpty(this.amount)) {
				throw new ECApplicationException(ECMessage._ERR_CMD_BAD_PARAMETER, CLASSNAME, METHOD_NAME,
						new Object[] { "amount" });
			}
			if (this.orderId == null || StringUtils.isEmpty(this.orderId)) {
				throw new ECApplicationException(ECMessage._ERR_CMD_BAD_PARAMETER, CLASSNAME, METHOD_NAME,
						new Object[] { "orderId" });
			}
			if (this.idempotenceKey == null || StringUtils.isEmpty(this.idempotenceKey)) {
				throw new ECApplicationException(ECMessage._ERR_CMD_BAD_PARAMETER, CLASSNAME, METHOD_NAME,
						new Object[] { "idempotenceKey" });
			}
			try {
				NumberFormat.getInstance().parse(this.amount.trim());
			} catch (Exception ex) {
				throw new ECApplicationException(ECMessage._ERR_NUMBER_FORMAT_EXCEPTION, CLASSNAME, METHOD_NAME,
						new Object[] { this.amount });
			}
			this.email = StringUtils.trim(this.email);
			this.amount = StringUtils.trim(this.amount);
			this.orderId = StringUtils.trim(this.orderId);

			if (LOGGER.isLoggable(Level.FINEST)) {
				LOGGER.logp(Level.FINEST, CLASSNAME, METHOD_NAME, "StoreId is " + store_Id);
			}
		
		if (LoggingHelper.isEntryExitTraceEnabled(LOGGER))
			LOGGER.exiting(CLASSNAME, METHOD_NAME);

	}

	
}
