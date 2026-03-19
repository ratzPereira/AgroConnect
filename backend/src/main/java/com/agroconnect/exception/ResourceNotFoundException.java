package com.agroconnect.exception;

public class ResourceNotFoundException extends AgroConnectException {

    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " não encontrado(a) com id: " + id);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
