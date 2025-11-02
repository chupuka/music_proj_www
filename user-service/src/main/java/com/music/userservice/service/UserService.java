package com.music.userservice.service;

import com.music.userservice.dto.UserCreateDTO;
import com.music.userservice.dto.UserDTO;
import com.music.userservice.dto.UserUpdateDTO;
import com.music.userservice.entity.User;
import com.music.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    public UserDTO createUser(UserCreateDTO userCreateDTO) {
        if (userRepository.existsByUsername(userCreateDTO.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(userCreateDTO.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        User user = new User();
        user.setUsername(userCreateDTO.getUsername());
        user.setEmail(userCreateDTO.getEmail());
        user.setPassword(userCreateDTO.getPassword());
        user.setFirstName(userCreateDTO.getFirstName());
        user.setLastName(userCreateDTO.getLastName());
        
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }
    
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<UserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::convertToDTO);
    }
    
    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return convertToDTO(user);
    }
    
    public UserDTO updateUser(Long id, UserUpdateDTO userUpdateDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        if (userUpdateDTO.getUsername() != null) {
            if (userRepository.existsByUsername(userUpdateDTO.getUsername()) && 
                !user.getUsername().equals(userUpdateDTO.getUsername())) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(userUpdateDTO.getUsername());
        }
        
        if (userUpdateDTO.getEmail() != null) {
            if (userRepository.existsByEmail(userUpdateDTO.getEmail()) && 
                !user.getEmail().equals(userUpdateDTO.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(userUpdateDTO.getEmail());
        }
        
        if (userUpdateDTO.getPassword() != null) {
            user.setPassword(userUpdateDTO.getPassword());
        }
        
        if (userUpdateDTO.getFirstName() != null) {
            user.setFirstName(userUpdateDTO.getFirstName());
        }
        
        if (userUpdateDTO.getLastName() != null) {
            user.setLastName(userUpdateDTO.getLastName());
        }
        
        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }
    
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }
    
    @Transactional(readOnly = true)
    public UserDTO login(String emailOrUsername, String password) {
        Optional<User> userOpt = userRepository.findByUsername(emailOrUsername);
        if (!userOpt.isPresent()) {
            userOpt = userRepository.findByEmail(emailOrUsername);
        }
        
        User user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Invalid password");
        }
        
        return convertToDTO(user);
    }
    
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}

