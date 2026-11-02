
package com.shopease.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtFilter jwtFilter) throws Exception {

        http
            .csrf(c -> c.disable())

            .cors(c -> c.configurationSource(corsSource()))

            .sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .authorizeHttpRequests(a -> a

                // Allow CORS preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public authentication APIs
                .requestMatchers("/api/auth/**").permitAll()

                // Public product viewing
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()

                // Admin-only product operations
                .requestMatchers("/api/products/**").hasRole("ADMIN")

                // Authenticated order operations
                .requestMatchers("/api/orders/**").authenticated()

                // Everything else requires authentication
                .anyRequest().authenticated()
            )

            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) ->
                    res.sendError(401, "Unauthorized")
                )
            )

            .addFilterBefore(
                jwtFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsSource() {

        CorsConfiguration cfg = new CorsConfiguration();

        cfg.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "https://shopease-ten-snowy.vercel.app"
        ));

        cfg.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));

        cfg.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource src =
            new UrlBasedCorsConfigurationSource();

        src.registerCorsConfiguration("/**", cfg);

        return src;
    }
}
