package com.hcl.commerce.payments.lunu.api;

import java.io.IOException;
import java.io.StringReader;
import java.net.URL;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.TimeZone;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonReader;

import org.json.JSONException;
import org.json.JSONObject;

import com.hcl.commerce.payments.lunu.constants.HCLLunuConstants;
import com.hcl.commerce.payments.lunu.helper.HCLLunuRestAPIHelper;
import com.ibm.commerce.foundation.internal.server.services.registry.StoreConfigurationRegistry;
/**
 * This rest API helper is used  
 *
 */
public class HCLLunuRESTApiHelper {

	final static String CLASS_NAME = HCLLunuRESTApiHelper.class.getName();
	final static Logger LOGGER = Logger.getLogger(CLASS_NAME);

	/**
	 * This method call build request and send request to Lunu payment API.
	 * @param orderId
	 * @param email
	 * @param amount
	 * @param storeId
	 * @return
	 * @throws IOException
	 * @throws JSONException
	 */
	public static JSONObject sendLunuRESTApiOrderCreateRequest(String orderId, String email, String amount,
			Integer storeId,String idempotenceKey) throws IOException, JSONException {
		final String METHOD_NAME = "sendLunuRESTApiOrderCreateRequest";
		String APP_ID = getConfigurationRegistryValue(HCLLunuConstants.LUNU_APP_ID, storeId);
		String SECRET = getConfigurationRegistryValue(HCLLunuConstants.LUNU_APP_Secret, storeId);
		String CREATE_URL = getConfigurationRegistryValue(HCLLunuConstants.LUNU_PAYMENT_CREATE_URL, storeId);
		String expireTime = getConfigurationRegistryValue(HCLLunuConstants.LUNU_EXPIRE_TOKEN_TIME, storeId);
		String calculatedExpireTime = getExpireTime(expireTime);
		LOGGER.logp(Level.FINE, CLASS_NAME, METHOD_NAME, "CREATE_URL= " + CREATE_URL);
		
		//Build the request
		JSONObject createPaymentJsonReq = HCLLunuRESTApiRequestBuilder.buildLunuRESTApiOrderCreateRequest(
				email, amount, orderId, calculatedExpireTime);
		
		//Request string to json format
		JsonObject gsonReqObject = jsonFromString(createPaymentJsonReq.toString());

		URL apiUrl = new URL(CREATE_URL);
		//Call the Lunu payment API
		JsonObject authTokenJsonResp = HCLLunuRestAPIHelper.sendLunuRESTApiCreateRequest(apiUrl,
				gsonReqObject, APP_ID, SECRET,idempotenceKey);
		//Parse string to JSON format.
		JSONObject response = parseLunuRESTApiOrderCreateRequestResponse(authTokenJsonResp);
		return response;
	}

	/**
	 * This method will return JsonObhect from a String representation of Json
	 * Object.
	 * 
	 * @param jsonObjectStr
	 * @return
	 */
	private static JsonObject jsonFromString(String jsonObjectStr) {
		final String METHOD_NAME = "jsonFromString";

		JsonReader jsonReader = Json.createReader(new StringReader(jsonObjectStr));
		JsonObject object = jsonReader.readObject();
		jsonReader.close();

		return object;
	}

	/**
	 * This method will return JsonObhect from a String representation of Json
	 * Object.
	 * 
	 * @param jsonObjectStr
	 * @return JsonArray
	 */
	private static JsonArray jsonArrFromString(String jsonObjectStr) {
		final String METHOD_NAME = "jsonFromString";

		JsonReader jsonReader = Json.createReader(new StringReader(jsonObjectStr));
		JsonArray object = jsonReader.readArray();
		jsonReader.close();

		return object;
	}

	/**
	 * This method will fetch the key values from STORECONF table for input key
	 * name.
	 * 
	 * @param configurationKey
	 *            key
	 * @return boolean
	 */
	public static String getConfigurationRegistryValue(String configurationKey, Integer storeId) {
		final String METHOD_NAME = "getConfigurationRegistryValue";

		String configurationKeyValue = "";
		try {
			StoreConfigurationRegistry storeConfigurationRegistry = StoreConfigurationRegistry.getSingleton();
			String valueFromRegistry = storeConfigurationRegistry.getValue(storeId, configurationKey);

			if (valueFromRegistry != null) {
				configurationKeyValue = valueFromRegistry;
			}
		} catch (Exception e) {
			LOGGER.logp(Level.WARNING, CLASS_NAME, METHOD_NAME,
					"Configuration Key = " + configurationKey + " Exception during  getting value from registry :" + e);
		}
		LOGGER.logp(Level.FINER, CLASS_NAME, METHOD_NAME,
				"Configuration Key= " + configurationKey + " configurationKeyValue= " + configurationKeyValue);
		return configurationKeyValue;
	}

	private static String getExpireTime(String expires) {
		final long ONE_MINUTE_IN_MILLIS = 60000;// millisecs
		Date currentTime = new Date();
		Date afterAddingMins = new Date(currentTime.getTime() + (Long.valueOf(expires).intValue() * ONE_MINUTE_IN_MILLIS));
		String dateString = dateToRFC3339(afterAddingMins);
		
		return dateString;
	}

	/**
	 * format date to RFC3339
	 * @param d
	 * @return String
	 */
	public static String dateToRFC3339(Date d) {

		NumberFormat doubleDigit = new DecimalFormat("00");

		StringBuilder result = new StringBuilder(new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").format(d));
		Calendar cal = new GregorianCalendar();

		cal.setTime(d);
		cal.setTimeZone(TimeZone.getDefault());
		int offset_millis = cal.get(Calendar.ZONE_OFFSET) + cal.get(Calendar.DST_OFFSET);
		int offset_hours = Math.abs(offset_millis / (1000 * 60 * 60));
		int offset_minutes = Math.abs((offset_millis / (1000 * 60)) % 60);

		if (offset_millis == 0) {
			result.append("Z");
		} else {
			result.append((offset_millis > 0) ? "+" : "-").append(doubleDigit.format(offset_hours)).append(":")
					.append(doubleDigit.format(offset_minutes));
		}

		return result.toString();
	}

	public static JSONObject parseLunuRESTApiOrderCreateRequestResponse(JsonObject res) {
		final String METHOD_NAME = "parseLunuRESTApiOrderCreateRequestResponse";

		LOGGER.logp(Level.FINE, CLASS_NAME, METHOD_NAME, "Order Create Response Json Object= " + res);

		JsonObject jsonValue = res.getJsonObject("response");
		JSONObject innerJSON = new JSONObject(jsonValue.toString());

		LOGGER.logp(Level.FINE, CLASS_NAME, METHOD_NAME, "Lunu Creete order Response= " + jsonValue);
		return innerJSON;
	}

}
