package com.agroconnect.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = PasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {
    String message() default "A palavra-passe deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e dígito.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
