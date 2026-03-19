package com.agroconnect.exception;

public class DuplicateEmailException extends AgroConnectException {

    public DuplicateEmailException(String email) {
        super("Já existe uma conta registada com o email: " + email);
    }
}
