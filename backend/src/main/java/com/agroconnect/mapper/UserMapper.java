package com.agroconnect.mapper;

import com.agroconnect.dto.response.UserResponse;
import com.agroconnect.model.User;

public final class UserMapper {

    private UserMapper() {}

    public static UserResponse toResponse(User user, String displayName) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                displayName,
                user.getRole().name()
        );
    }
}
