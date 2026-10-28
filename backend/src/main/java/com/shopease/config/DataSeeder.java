package com.shopease.config;

import com.shopease.model.Product;
import com.shopease.model.User;
import com.shopease.repository.ProductRepository;
import com.shopease.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final ProductRepository products;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, ProductRepository products, PasswordEncoder encoder) {
        this.users = users; this.products = products; this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (users.count() == 0) {
            users.save(new User(null, "Admin", "admin@shopease.com", encoder.encode("admin123"), "ROLE_ADMIN"));
        }
        if (products.count() == 0) {
            products.save(new Product(null, "Wireless Headphones", "Bluetooth over-ear headphones", 1999, "https://picsum.photos/seed/headphones/400/300", 25, "Electronics"));
            products.save(new Product(null, "Smart Watch", "Fitness tracking smart watch", 2999, "https://picsum.photos/seed/watch/400/300", 15, "Electronics"));
            products.save(new Product(null, "Backpack", "Water-resistant laptop backpack", 1299, "https://picsum.photos/seed/backpack/400/300", 40, "Accessories"));
            products.save(new Product(null, "Running Shoes", "Lightweight everyday running shoes", 2499, "https://picsum.photos/seed/shoes/400/300", 30, "Footwear"));
            products.save(new Product(null, "Mechanical Keyboard", "RGB mechanical keyboard", 3499, "https://picsum.photos/seed/keyboard/400/300", 20, "Electronics"));
            products.save(new Product(null, "Water Bottle", "Insulated steel bottle, 1 litre", 599, "https://picsum.photos/seed/bottle/400/300", 60, "Accessories"));
        }

        // Existing database: give products that have no category one
        Map<String, String> known = Map.of(
                "Wireless Headphones", "Electronics", "Smart Watch", "Electronics",
                "Mechanical Keyboard", "Electronics", "Backpack", "Accessories",
                "Water Bottle", "Accessories", "Running Shoes", "Footwear");
        for (Product p : products.findAll()) {
            if (p.getCategory() == null || p.getCategory().isBlank()) {
                p.setCategory(known.getOrDefault(p.getName(), "General"));
                products.save(p);
            }
        }
    }
}
