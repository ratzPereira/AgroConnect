package com.agroconnect.exception;

public abstract class AgroConnectException extends RuntimeException {

    protected AgroConnectException(String message) {
        super(message);
    }

    protected AgroConnectException(String message, Throwable cause) {
        super(message, cause);
    }
}
