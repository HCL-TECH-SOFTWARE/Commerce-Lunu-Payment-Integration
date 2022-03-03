package com.hcl.commerce.payments.lunu.api;

public class ApiException extends Exception{
	private int code = 0;
    private String responseBody = null;
	
    public int getCode() {
		return code;
	}
	public String getResponseBody() {
		return responseBody;
	}
    public ApiException() {}

    public ApiException(Throwable throwable) {
        super(throwable);
    }

    public ApiException(String message) {
        super(message);
    }

    public ApiException(String message, Throwable throwable, int code, String responseBody) {
        super(message, throwable);
        this.code = code;
        this.responseBody = responseBody;
    }

    public ApiException(int code) {
        this.code = code;
    }
    
    public ApiException(int code, String message) {
        super(message);
        this.code = code;
    }

    public ApiException(int code, String message, String responseBody) {
        this(code, message);
        this.responseBody = responseBody;
    }
	public void setResponseBody(String responseBody) {
		this.responseBody = responseBody;
	}
    
    
}
