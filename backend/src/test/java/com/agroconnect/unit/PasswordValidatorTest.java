package com.agroconnect.unit;

import com.agroconnect.validation.PasswordValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordValidatorTest {

    private PasswordValidator validator;

    @BeforeEach
    void setUp() {
        validator = new PasswordValidator();
    }

    @Test
    void isValid_givenStrongPassword_shouldReturnTrue() {
        assertTrue(validator.isValid("Password1", null));
    }

    @Test
    void isValid_givenTooShort_shouldReturnFalse() {
        assertFalse(validator.isValid("Pass1", null));
    }

    @Test
    void isValid_givenNoUppercase_shouldReturnFalse() {
        assertFalse(validator.isValid("password1", null));
    }

    @Test
    void isValid_givenNoLowercase_shouldReturnFalse() {
        assertFalse(validator.isValid("PASSWORD1", null));
    }

    @Test
    void isValid_givenNoDigit_shouldReturnFalse() {
        assertFalse(validator.isValid("Password", null));
    }

    @Test
    void isValid_givenNull_shouldReturnFalse() {
        assertFalse(validator.isValid(null, null));
    }
}
