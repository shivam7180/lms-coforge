package com.lms.userservice.service;

import com.lms.userservice.dto.AuthResponse;
import com.lms.userservice.dto.LoginRequest;
import com.lms.userservice.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
