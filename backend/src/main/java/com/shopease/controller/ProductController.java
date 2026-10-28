package com.shopease.controller;

import com.shopease.model.Product;
import com.shopease.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository repo;

    public ProductController(ProductRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Product> all(@RequestParam(required = false) String q) {
        return (q == null || q.isBlank()) ? repo.findAll() : repo.findByNameContainingIgnoreCase(q);
    }

    @GetMapping("/{id}")
    public Product one(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@Valid @RequestBody Product p) {
        p.setId(null);
        return repo.save(p);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @Valid @RequestBody Product p) {
        Product existing = one(id);
        existing.setName(p.getName());
        existing.setDescription(p.getDescription());
        existing.setPrice(p.getPrice());
        existing.setImageUrl(p.getImageUrl());
        existing.setStock(p.getStock());
        existing.setCategory(p.getCategory());
        return repo.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repo.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        repo.deleteById(id);
    }
}
