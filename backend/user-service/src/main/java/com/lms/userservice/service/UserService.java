package com.lms.userservice.service;

import com.lms.userservice.dto.UserResponse;
import java.util.List;

public interface UserService {
    UserResponse getUserById(Long id);
    UserResponse getUserByEmail(String email);
    List<UserResponse> getAllUsers();
    boolean existsById(Long id);
}
