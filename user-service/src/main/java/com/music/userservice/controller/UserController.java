package com.music.userservice.controller;

import com.music.userservice.dto.UserCreateDTO;
import com.music.userservice.dto.UserDTO;
import com.music.userservice.dto.UserUpdateDTO;
import com.music.userservice.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Controller", description = "API for managing users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @PostMapping
    @Operation(summary = "Create a new user")
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserCreateDTO userCreateDTO) {
        UserDTO createdUser = userService.createUser(userCreateDTO);
        return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }
    
    @GetMapping
    @Operation(summary = "Get all users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/page")
    @Operation(summary = "Get all users with pagination")
    public ResponseEntity<Page<UserDTO>> getAllUsers(Pageable pageable) {
        Page<UserDTO> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update user")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, 
                                              @Valid @RequestBody UserUpdateDTO userUpdateDTO) {
        UserDTO updatedUser = userService.updateUser(id, userUpdateDTO);
        return ResponseEntity.ok(updatedUser);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/login")
    @Operation(summary = "Login user")
    public ResponseEntity<UserDTO> login(@RequestBody LoginRequest loginRequest) {
        UserDTO user = userService.login(loginRequest.getEmailOrUsername(), loginRequest.getPassword());
        return ResponseEntity.ok(user);
    }
    
    // Inner class for login request
    public static class LoginRequest {
        private String emailOrUsername;
        private String password;
        
        public String getEmailOrUsername() {
            return emailOrUsername;
        }
        
        public void setEmailOrUsername(String emailOrUsername) {
            this.emailOrUsername = emailOrUsername;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
    }
}

