package com.lms.userservice.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.lms.userservice.dto.AuthResponse;
import com.lms.userservice.dto.LoginRequest;
import com.lms.userservice.dto.RegisterRequest;
import com.lms.userservice.entity.Role;
import com.lms.userservice.entity.User;
import com.lms.userservice.exception.BadRequestException;
import com.lms.userservice.exception.DuplicateResourceException;
import com.lms.userservice.exception.UnauthorizedException;
import com.lms.userservice.repository.UserRepository;
import com.lms.userservice.security.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthServiceImpl authService;

    private static Validator validator;
    private static ValidatorFactory validatorFactory;

    @BeforeAll
    static void setUpValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        validatorFactory.close();
    }


    // =========================================================
    // EXISTING TEST 1: Successful registration
    // =========================================================

    @Test
    void register_ShouldRegisterUserSuccessfully() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("shivam@gmail.com");

        // Changed from 123456 to strong password
        request.setPassword("Student@123");

        request.setRole("STUDENT");
        request.setBio("Java Developer");

        when(userRepository.existsByEmail("shivam@gmail.com"))
                .thenReturn(false);

        when(passwordEncoder.encode("Student@123"))
                .thenReturn("encodedPassword");

        User savedUser = User.builder()
                .id(1L)
                .fullName("Shivam Verma")
                .email("shivam@gmail.com")
                .password("encodedPassword")
                .role(Role.STUDENT)
                .bio("Java Developer")
                .active(true)
                .build();

        when(userRepository.save(any(User.class)))
                .thenReturn(savedUser);

        when(jwtService.generateToken(
                1L,
                "shivam@gmail.com",
                "STUDENT"))
                .thenReturn("test-token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("test-token", response.getToken());
        assertEquals(1L, response.getUserId());
        assertEquals("shivam@gmail.com", response.getEmail());
        assertEquals("STUDENT", response.getRole());
        assertEquals("Shivam Verma", response.getFullName());

        verify(userRepository).existsByEmail("shivam@gmail.com");
        verify(passwordEncoder).encode("Student@123");
        verify(userRepository).save(any(User.class));
    }


    // =========================================================
    // EXISTING TEST 2: Duplicate email
    // =========================================================

    @Test
    void register_WhenEmailAlreadyExists_ShouldThrowException() {

        RegisterRequest request = new RegisterRequest();

        request.setEmail("shivam@gmail.com");

        when(userRepository.existsByEmail("shivam@gmail.com"))
                .thenReturn(true);

        assertThrows(
                DuplicateResourceException.class,
                () -> authService.register(request)
        );

        verify(userRepository).existsByEmail("shivam@gmail.com");

        verify(userRepository, never())
                .save(any(User.class));
    }


    // =========================================================
    // EXISTING TEST 3: Invalid role
    // =========================================================

    @Test
    void register_WhenRoleInvalid_ShouldThrowException() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("shivam@gmail.com");
        request.setPassword("Student@123");
        request.setRole("INVALID_ROLE");

        when(userRepository.existsByEmail("shivam@gmail.com"))
                .thenReturn(false);

        assertThrows(
                BadRequestException.class,
                () -> authService.register(request)
        );

        verify(userRepository)
                .existsByEmail("shivam@gmail.com");

        verify(userRepository, never())
                .save(any(User.class));
    }


    // =========================================================
    // EXISTING TEST 4: Successful login
    // =========================================================

    @Test
    void login_ShouldLoginSuccessfully() {

        LoginRequest request = new LoginRequest();

        request.setEmail("shivam@gmail.com");
        request.setPassword("Student@123");

        User user = User.builder()
                .id(1L)
                .fullName("Shivam Verma")
                .email("shivam@gmail.com")
                .password("encodedPassword")
                .role(Role.STUDENT)
                .active(true)
                .build();

        when(userRepository.findByEmail("shivam@gmail.com"))
                .thenReturn(Optional.of(user));

        when(jwtService.generateToken(
                1L,
                "shivam@gmail.com",
                "STUDENT"))
                .thenReturn("login-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("login-token", response.getToken());
        assertEquals(1L, response.getUserId());
        assertEquals("shivam@gmail.com", response.getEmail());
        assertEquals("STUDENT", response.getRole());
        assertEquals("Shivam Verma", response.getFullName());

        verify(authenticationManager).authenticate(any());

        verify(userRepository)
                .findByEmail("shivam@gmail.com");
    }


    // =========================================================
    // EXISTING TEST 5: Wrong password
    // =========================================================

    @Test
    void login_WhenCredentialsInvalid_ShouldThrowException() {

        LoginRequest request = new LoginRequest();

        request.setEmail("shivam@gmail.com");
        request.setPassword("wrongPassword");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(
                UnauthorizedException.class,
                () -> authService.login(request)
        );

        verify(authenticationManager)
                .authenticate(any());

        verify(userRepository, never())
                .findByEmail(anyString());
    }


    // =========================================================
    // EXISTING TEST 6: User not found
    // =========================================================

    @Test
    void login_WhenUserNotFound_ShouldThrowException() {

        LoginRequest request = new LoginRequest();

        request.setEmail("unknown@gmail.com");
        request.setPassword("Student@123");

        when(userRepository.findByEmail("unknown@gmail.com"))
                .thenReturn(Optional.empty());

        assertThrows(
                UnauthorizedException.class,
                () -> authService.login(request)
        );

        verify(authenticationManager)
                .authenticate(any());

        verify(userRepository)
                .findByEmail("unknown@gmail.com");
    }


    // =========================================================
    // NEW VALIDATION TEST 7: Valid Gmail
    // =========================================================

    @Test
    void register_WithValidGmail_ShouldPassValidation() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("student@gmail.com");
        request.setPassword("Student@123");
        request.setRole("STUDENT");

        Set<ConstraintViolation<RegisterRequest>> violations =
                validator.validate(request);

        assertTrue(violations.isEmpty());
    }


    // =========================================================
    // NEW VALIDATION TEST 8: Email without @
    // =========================================================

    @Test
    void register_WithEmailWithoutAtSymbol_ShouldFailValidation() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("studentgmail.com");
        request.setPassword("Student@123");
        request.setRole("STUDENT");

        Set<ConstraintViolation<RegisterRequest>> violations =
                validator.validate(request);

        assertFalse(violations.isEmpty());
    }


    // =========================================================
    // NEW VALIDATION TEST 9: Invalid email
    // =========================================================

    @Test
    void register_WithInvalidEmail_ShouldFailValidation() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("student@");
        request.setPassword("Student@123");
        request.setRole("STUDENT");

        Set<ConstraintViolation<RegisterRequest>> violations =
                validator.validate(request);

        assertFalse(violations.isEmpty());
    }


    // =========================================================
    // NEW VALIDATION TEST 10: Other valid domain
    // =========================================================

    @Test
    void register_WithValidOtherDomain_ShouldPassValidation() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("student@yahoo.com");
        request.setPassword("Student@123");
        request.setRole("STUDENT");

        Set<ConstraintViolation<RegisterRequest>> violations =
                validator.validate(request);

        assertTrue(violations.isEmpty());
    }


    // =========================================================
    // NEW VALIDATION TEST 11: Strong password
    // =========================================================

    @Test
    void register_WithStrongPassword_ShouldPassValidation() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("student@gmail.com");
        request.setPassword("Student@123");
        request.setRole("STUDENT");

        Set<ConstraintViolation<RegisterRequest>> violations =
                validator.validate(request);

        assertTrue(violations.isEmpty());
    }


    // =========================================================
    // NEW VALIDATION TEST 12: No uppercase
    // =========================================================

    @Test
    void register_WithPasswordWithoutUppercase_ShouldFailValidation() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("student@gmail.com");
        request.setPassword("student@123");
        request.setRole("STUDENT");

        Set<ConstraintViolation<RegisterRequest>> violations =
                validator.validate(request);

        assertFalse(violations.isEmpty());
    }


    // =========================================================
    // NEW VALIDATION TEST 13: No lowercase
    // =========================================================

    @Test
    void register_WithPasswordWithoutLowercase_ShouldFailValidation() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("student@gmail.com");
        request.setPassword("STUDENT@123");
        request.setRole("STUDENT");

        Set<ConstraintViolation<RegisterRequest>> violations =
                validator.validate(request);

        assertFalse(violations.isEmpty());
    }


    // =========================================================
    // NEW VALIDATION TEST 14: No special character
    // =========================================================

    @Test
    void register_WithPasswordWithoutSpecialCharacter_ShouldFailValidation() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("student@gmail.com");
        request.setPassword("Student123");
        request.setRole("STUDENT");

        Set<ConstraintViolation<RegisterRequest>> violations =
                validator.validate(request);

        assertFalse(violations.isEmpty());
    }


    // =========================================================
    // NEW VALIDATION TEST 15: No number
    // =========================================================

    @Test
    void register_WithPasswordWithoutNumber_ShouldFailValidation() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("student@gmail.com");
        request.setPassword("Student@abc");
        request.setRole("STUDENT");

        Set<ConstraintViolation<RegisterRequest>> violations =
                validator.validate(request);

        assertFalse(violations.isEmpty());
    }
    @Test
    void register_ShouldEncodePasswordBeforeSaving() {

        RegisterRequest request = new RegisterRequest();
        request.setFullName("Shivam Verma");
        request.setEmail("shivam@gmail.com");
        request.setPassword("Student@123");
        request.setRole("STUDENT");
        request.setBio("Java Developer");

        User savedUser = User.builder()
                .id(1L)
                .fullName("Shivam Verma")
                .email("shivam@gmail.com")
                .password("encodedPassword")
                .role(Role.STUDENT)
                .bio("Java Developer")
                .active(true)
                .build();

        when(userRepository.existsByEmail("shivam@gmail.com"))
                .thenReturn(false);

        when(passwordEncoder.encode("Student@123"))
                .thenReturn("encodedPassword");

        when(userRepository.save(any(User.class)))
                .thenReturn(savedUser);

        when(jwtService.generateToken(
                1L,
                "shivam@gmail.com",
                "STUDENT"))
                .thenReturn("test-token");

        authService.register(request);

        // Verify that passwordEncoder was called
        verify(passwordEncoder).encode("Student@123");

        // Verify that encoded password, not raw password, was saved
        verify(userRepository).save(argThat(user ->
                user.getPassword().equals("encodedPassword")
                && !user.getPassword().equals("Student@123")
        ));
    }

    // =========================================================
    // NEW VALIDATION TEST 16: All password requirements
    // =========================================================

    @Test
    void register_WithPasswordContainingUpperLowerNumberSpecial_ShouldPassValidation() {

        RegisterRequest request = new RegisterRequest();

        request.setFullName("Shivam Verma");
        request.setEmail("student@gmail.com");
        request.setPassword("Student@123");
        request.setRole("STUDENT");

        Set<ConstraintViolation<RegisterRequest>> violations =
                validator.validate(request);

        assertTrue(violations.isEmpty());
    }
}