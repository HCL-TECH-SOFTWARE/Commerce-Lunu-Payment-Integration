package com.hcl.commerce.lunu.payment.handler;

import java.util.logging.Logger;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.hcl.commerce.payments.lunu.constants.HCLLunuConstants;
import com.ibm.commerce.datatype.TypedProperty;
import com.ibm.commerce.foundation.logging.LoggingHelper;
import com.ibm.commerce.rest.classic.core.AbstractConfigBasedClassicHandler;
import com.ibm.commerce.rest.javadoc.ResponseSchema;

@Path("lunu/{storeId}")
public class HCLLunuPaymentHandler extends AbstractConfigBasedClassicHandler {

	public static final String COPYRIGHT = "(c) Copyright International Business Machines Corporation 1996,2008";
	private static final String CLASSNAME = HCLLunuPaymentHandler.class.getName();
	private static final Logger LOGGER = LoggingHelper.getLogger(HCLLunuPaymentHandler.class);
	private static final String RESOURCE_NAME = "lunu";

	private static final String CLASS_NAME_PARAMETER = "com.hcl.commerce.lunu.payment.commands.HCLLunuPaymentProcessCmd";
	
	
	@Override
	public String getResourceName() {
		
		return RESOURCE_NAME;
	}

	@Path(HCLLunuConstants.CREATE_PAYMENT_PATH)
	@POST
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML, MediaType.APPLICATION_XHTML_XML,
			MediaType.APPLICATION_ATOM_XML })
	@ResponseSchema(parameterGroup = RESOURCE_NAME, responseCodes = {
			@com.ibm.commerce.rest.javadoc.ResponseCode(code = 200, reason = "The requested completed successfully."),
			@com.ibm.commerce.rest.javadoc.ResponseCode(code = 400, reason = "Bad request. Some of the inputs provided to the request aren't valid."),
			@com.ibm.commerce.rest.javadoc.ResponseCode(code = 401, reason = "Not authenticated. The user session isn't valid."),
			@com.ibm.commerce.rest.javadoc.ResponseCode(code = 403, reason = "The user isn't authorized to perform the specified request."),
			@com.ibm.commerce.rest.javadoc.ResponseCode(code = 404, reason = "The specified resource couldn't be found."),
			@com.ibm.commerce.rest.javadoc.ResponseCode(code = 500, reason = "Internal server error. Additional details will be contained on the server logs.") })
	public Response createLunuOrder(@PathParam("storeId") String storeId,
			@QueryParam(value = "responseFormat") String responseFormat) throws Exception {

		String METHODNAME = "createLunuOrder";
		boolean entryExitTraceEnabled = LoggingHelper.isEntryExitTraceEnabled(LOGGER);
		if (entryExitTraceEnabled) {
			Object[] objArr = new Object[] { storeId, responseFormat };
			LOGGER.entering(CLASSNAME, METHODNAME, objArr);
		}

		Response response = this.prepareAndValidate(storeId, this.getResourceName(), "POST", this.request,
				responseFormat);
		if (response == null) {
			try {
				String cmdRefKey = CLASS_NAME_PARAMETER;
				TypedProperty requestProperties = initializeRequestPropertiesFromRequestMap(responseFormat);
				response = executeControllerCommandWithContext(storeId, cmdRefKey, requestProperties,
						responseFormat);
			} catch (Exception ex) {
				response = this.handleException(responseFormat, ex, METHODNAME);
			}
		}

		if (entryExitTraceEnabled) {
			LOGGER.exiting(CLASSNAME, "moveOrderItem(String storeId, String responseFormat)", response);
		}

		return response;
	}

	
}
