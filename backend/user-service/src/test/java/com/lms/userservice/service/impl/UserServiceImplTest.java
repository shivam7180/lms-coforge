package com.lms.userservice.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.lms.userservice.dto.UserResponse;
import com.lms.userservice.entity.Role;
import com.lms.userservice.entity.User;
import com.lms.userservice.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;


    // Test 1: Get user by ID - user exists
    @Test
    void getUserById_ShouldReturnUser() {

        User user = User.builder()
                .id(1L)
                .fullName("Shivam Verma")
                .email("shivam@gmail.com")
                .role(Role.STUDENT)
                .build();

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user));

        UserResponse result = userService.getUserById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Shivam Verma", result.getFullName());
        assertEquals("shivam@gmail.com", result.getEmail());

        verify(userRepository).findById(1L);
    }


    // Test 2: Get user by ID - user does not exist
    @Test
    void getUserById_WhenUserNotFound_ShouldThrowException() {

        when(userRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                RuntimeException.class,
                () -> userService.getUserById(99L)
        );

        verify(userRepository).findById(99L);
    }


    // Test 3: Get user by email - user exists
    @Test
    void getUserByEmail_ShouldReturnUser() {

        User user = User.builder()
                .id(1L)
                .fullName("Shivam Verma")
                .email("shivam@gmail.com")
                .role(Role.STUDENT)
                .build();

        when(userRepository.findByEmail("shivam@gmail.com"))
                .thenReturn(Optional.of(user));

        UserResponse result =
                userService.getUserByEmail("shivam@gmail.com");

        assertNotNull(result);
        assertEquals("Shivam Verma", result.getFullName());
        assertEquals("shivam@gmail.com", result.getEmail());

        verify(userRepository)
                .findByEmail("shivam@gmail.com");
    }


    // Test 4: Get all users
    @Test
    void getAllUsers_ShouldReturnUsers() {

        User user1 = User.builder()
                .id(1L)
                .fullName("Shivam Verma")
                .email("shivam@gmail.com")
                .role(Role.STUDENT)
                .build();

        User user2 = User.builder()
                .id(2L)
                .fullName("Rahul")
                .email("rahul@gmail.com")
                .role(Role.STUDENT)
                .build();

        when(userRepository.findAll())
                .thenReturn(List.of(user1, user2));

        List<UserResponse> result =
                userService.getAllUsers();

        assertNotNull(result);
        assertEquals(2, result.size());

        verify(userRepository).findAll();
    }


    // Test 5: User exists by ID - true
    @Test
    void existsById_ShouldReturnTrue() {

        when(userRepository.existsById(1L))
                .thenReturn(true);

        boolean result = userService.existsById(1L);

        assertTrue(result);

        verify(userRepository).existsById(1L);
    }


    // Test 6: User exists by ID - false
    @Test
    void existsById_ShouldReturnFalse() {

        when(userRepository.existsById(99L))
                .thenReturn(false);

        boolean result = userService.existsById(99L);

        assertFalse(result);

        verify(userRepository).existsById(99L);
    }
}