package com.shopease.controller;

import com.shopease.model.User;
import com.shopease.repository.UserRepository;
import com.shopease.security.JwtUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtUtil jwt) {
        this.users = users; this.encoder = encoder; this.jwt = jwt;
    }

    public record RegisterRequest(@NotBlank String name, @Email @NotBlank String email,
                                  @Size(min = 6, message = "Password must be at least 6 characters") String password) {}
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    @PostMapping("/register")
    public Map<String, Object> register(@Valid @RequestBody RegisterRequest r) {
        if (users.existsByEmail(r.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        User u = new User(null, r.name(), r.email(), encoder.encode(r.password()), "ROLE_USER");
        users.save(u);
        return response(u);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest r) {
        User u = users.findByEmail(r.email())
                .filter(x -> encoder.matches(r.password(), x.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return response(u);
    }

    private Map<String, Object> response(User u) {
        return Map.of("token", jwt.generateToken(u.getEmail(), u.getRole()),
                      "name", u.getName(), "role", u.getRole());
    }
}
