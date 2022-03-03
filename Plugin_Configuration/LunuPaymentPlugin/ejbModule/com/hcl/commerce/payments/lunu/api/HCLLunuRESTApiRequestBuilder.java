package com.hcl.commerce.payments.lunu.api;

import java.util.logging.Level;
import java.util.logging.Logger;

import org.json.JSONException;
import org.json.JSONObject;

import com.hcl.commerce.payments.lunu.constants.HCLLunuConstants;

/**
 * This class is request builder for Lunu Payment
 *
 */
public class HCLLunuRESTApiRequestBuilder {

	final static String CLASS_NAME = HCLLunuRESTApiRequestBuilder.class.getName();
	final static Logger LOGGER = Logger.getLogger(CLASS_NAME);

	/**
	 * body: { "email": "customer@example.com", "amount": "1.00",
	 *  "description":
	 * "Order #1", "expires": "2020-02-22T00:00:00-00:00" }
	 * 
	 * @param return_merchant_url
	 * @param email
	 * @param amount
	 * @param orderId
	 * @param expire
	 * @return
	 * @throws JSONException
	 */
	public static JSONObject buildLunuRESTApiOrderCreateRequest(String email, String amount,
			String orderId, String expire) throws JSONException {
		final String METHOD_NAME = "buildLunuRESTApiOrderCreateRequest";

		JSONObject jsonObject = new JSONObject();

		try {
			jsonObject.put(HCLLunuConstants.LUNU_CREATE_JSONBODY_KEY_EMAIL, email);
			jsonObject.put(HCLLunuConstants.LUNU_CREATE_JSONBODY_KEY_AMOUNT, amount);
			jsonObject.put(HCLLunuConstants.LUNU_CREATE_JSONBODY_KEY_DESC, orderId);
			jsonObject.put(HCLLunuConstants.LUNU_CREATE_JSONBODY_KEY_EXPIRES, expire);

		} catch (JSONException e) {
			// TODO: handle exception
			LOGGER.logp(Level.WARNING, CLASS_NAME, METHOD_NAME, "Error while building Lunu Create Payment REST Api.");
			e.printStackTrace();
			throw e;
		} catch (Exception e) {
			LOGGER.logp(Level.WARNING, CLASS_NAME, METHOD_NAME,
					"Error while building Lunu Create Payment/Order REST Api.");
			e.printStackTrace();
		}
		LOGGER.logp(Level.FINE, CLASS_NAME, METHOD_NAME, "Lunu Order Create request json object= " + jsonObject);

		return jsonObject;
	}

}
