package com.hcl.commerce.payments.lunu.helper;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonWriter;
import javax.xml.bind.DatatypeConverter;

import com.hcl.commerce.payments.lunu.api.ApiException;
import com.hcl.commerce.payments.lunu.api.ApiResponse;
import com.hcl.commerce.payments.lunu.constants.HCLLunuConstants;


public class HCLLunuRestAPIHelper {

	final static String CLASS_NAME = HCLLunuRestAPIHelper.class.getName();
	final static Logger LOGGER = Logger.getLogger(CLASS_NAME);
	
	public static ApiResponse getLunuPaymentStatus(String url, String appId, String sceret) throws IOException, ApiException {
		final String METHOD_NAME = "getLunuPaymentStatus";
		
		ApiResponse apiResponse=null;
	    
	    int responseCode = 0;
	    String output = null;
	    //encode credentials
        String credential = appId + ":" + sceret;
	    String encodedCredentials = DatatypeConverter.printBase64Binary(credential.getBytes());
	    
	    URL apiURL = new URL(url);
	    //create connection
	    HttpURLConnection connection = (HttpURLConnection) apiURL.openConnection();
		connection.setRequestProperty(HCLLunuConstants.HEADER_CONNECTION, HCLLunuConstants.HEADER_CONNECTION_CLOSE);
		connection.setRequestProperty(HCLLunuConstants.HEADER_CONTENT_TYPE, HCLLunuConstants.HEADER_APPLICATION_JSON);
		connection.setRequestProperty(HCLLunuConstants.HEADER_CHARSET,HCLLunuConstants.HEADER_UTF_8);
		connection.setRequestProperty(HCLLunuConstants.HEADER_AUTHORIZATION, HCLLunuConstants.BASIC + encodedCredentials);
	
	    connection.setRequestMethod(HCLLunuConstants.HTTP_METHOD_GET);
	    connection.setDoOutput(true);
	    connection.setUseCaches(false);
	    LOGGER.logp(Level.WARNING, CLASS_NAME, METHOD_NAME,
				"Lunu Get payment request service Response code.... " +connection.getResponseCode());
	    if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
	    	ApiException apiException=new ApiException(connection.getResponseCode());
	    	if (null !=connection.getErrorStream()) {
				String errorOutput = readResponse(connection.getErrorStream());
				apiException.setResponseBody(errorOutput);
				LOGGER.logp(Level.WARNING, CLASS_NAME, METHOD_NAME,
						"Lunu Get payment request service url.... " + url.toString() + " errorResponse= " + errorOutput);
	    	}
	    	
	    	throw apiException;
	    	
		} else {
			output = readResponse(connection.getInputStream());
			 apiResponse = new ApiResponse(connection.getResponseCode(),output);
			 LOGGER.logp(Level.WARNING, CLASS_NAME, METHOD_NAME,
						"Lunu Get payment request service Response.... " +output);

		}
    
	    return apiResponse;
	}
	
	/**
	 * This method call payment create API using HTTPURLConnection.
	 * @param authUrl
	 * @param request
	 * @param appId
	 * @param sceret
	 * @return JsonObject
	 * @throws IOException
	 */
	public static JsonObject sendLunuRESTApiCreateRequest(URL authUrl, JsonObject request, String appId, String sceret,String idempotenceKey)
			throws IOException {
		final String METHOD_NAME = "sendLunuRESTApiCreateRequest";

		JsonObject response = null;
		StringBuilder errorResponse = new StringBuilder();
		int responseCode = 0;

		// encode credentials
		String credential = appId + ":" + sceret;
		String encodedCredentials = DatatypeConverter.printBase64Binary(credential.getBytes());

		// create connection
		HttpURLConnection connection = (HttpURLConnection) authUrl.openConnection();
		connection.setRequestProperty(HCLLunuConstants.HEADER_CONNECTION, HCLLunuConstants.HEADER_CONNECTION_CLOSE);
		connection.setRequestProperty(HCLLunuConstants.HEADER_CONTENT_TYPE, HCLLunuConstants.HEADER_APPLICATION_JSON);
		connection.setRequestProperty(HCLLunuConstants.HEADER_CHARSET,HCLLunuConstants.HEADER_UTF_8);
		connection.setRequestProperty(HCLLunuConstants.HEADER_AUTHORIZATION, HCLLunuConstants.BASIC + encodedCredentials);
		connection.setRequestProperty(HCLLunuConstants.IDEMPOTENCE_KEY, idempotenceKey);
		connection.setRequestMethod(HCLLunuConstants.HTTP_METHOD_POST);
		connection.setDoOutput(true);
		connection.setUseCaches(false);
		

		try {
			LOGGER.logp(Level.FINE, CLASS_NAME, METHOD_NAME, "Lunu create payment request service.... " + request.toString());
			// write JSON to output stream
			JsonWriter writer = Json.createWriter(connection.getOutputStream());
			writer.writeObject(request);
			writer.close();

			// send request
			responseCode = connection.getResponseCode();
			// get correct input stream
			InputStream readerStream = responseCode == 200 ? connection.getInputStream() : connection.getErrorStream();
			LOGGER.logp(Level.FINE, CLASS_NAME, METHOD_NAME, "Lunu create payment request service Response code...." + responseCode);
			// Read the Error Stream in case of
			if (responseCode >= 400) {
				// Read API response; returned as JSON object
				InputStreamReader is = new InputStreamReader(connection.getErrorStream());
				BufferedReader reader = new BufferedReader(is);
				errorResponse = new StringBuilder();
				String line;
				while ((line = reader.readLine()) != null) {
					errorResponse.append(line);
				}
				// Convert error response to Json
				LOGGER.logp(Level.WARNING, CLASS_NAME, METHOD_NAME,
						"Lunu create payment request service url.... " + authUrl.toString() + " errorResponse= " + errorResponse.toString());
				// response = jsonFromString(errorResponse.toString());
			} else {
				response = Json.createReader(readerStream).readObject();
			}
		} finally {
			connection.disconnect();
		}
		LOGGER.logp(Level.FINE, CLASS_NAME, METHOD_NAME, "Lunu create payment request service Response...." + response);

		return response;
	}
	
	
	/**
	 * Read the rest response
	 * 
	 * @param inputStream
	 * @return responseString
	 * @throws IOException
	 */
	private static String readResponse(InputStream inputStream) throws IOException {
		final String METHODNAME = "readResponse";
		LOGGER.entering(CLASS_NAME, METHODNAME, new Object[] { inputStream });
		String output = null;
		BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
		String inputLine;
		StringBuffer response = new StringBuffer();

		while ((inputLine = bufferedReader.readLine()) != null) {
			response.append(inputLine);
		}
		bufferedReader.close();
		if (null != response) {
			output = response.toString();

			LOGGER.logp(Level.FINEST, CLASS_NAME, METHODNAME, "Response:" + output);
		}
		LOGGER.exiting(CLASS_NAME, METHODNAME);
		return output;
	}
	
	public static String getRandomNumberString() {
		int aNumber = 0;
		aNumber = (int)((Math.random() * 9000000)+1000000);

		// this will convert any number sequence into 6 character.
		return String.valueOf(aNumber);
	}
}
