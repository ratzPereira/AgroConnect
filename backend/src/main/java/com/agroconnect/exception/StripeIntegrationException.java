package com.agroconnect.exception;

public class StripeIntegrationException extends AgroConnectException {

    public StripeIntegrationException(String message) {
        super(message);
    }

    public StripeIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
