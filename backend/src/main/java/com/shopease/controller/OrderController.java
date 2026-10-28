package com.shopease.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // Full package names are used on purpose, so no class name can be ambiguous
    private final com.shopease.repository.OrderRepository orders;
    private final com.shopease.repository.ProductRepository products;
    private final com.shopease.repository.UserRepository users;

    public OrderController(com.shopease.repository.OrderRepository orders,
                           com.shopease.repository.ProductRepository products,
                           com.shopease.repository.UserRepository users) {
        this.orders = orders;
        this.products = products;
        this.users = users;
    }

    public record CartLine(@NotNull Long productId, @Min(1) int quantity) {}

    public record ShippingInfo(
            @NotBlank(message = "Full name is required") String fullName,
            @Pattern(regexp = "\\d{10}", message = "Phone must be 10 digits") String phone,
            @NotBlank(message = "Address is required") String addressLine,
            @NotBlank(message = "City is required") String city,
            @Pattern(regexp = "\\d{6}", message = "Pincode must be 6 digits") String pincode) {}

    public record OrderRequest(
            @NotEmpty(message = "Cart is empty") List<@Valid CartLine> items,
            @NotNull(message = "Delivery details are required") @Valid ShippingInfo shipping) {}

    @PostMapping
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public com.shopease.model.Orders place(@RequestBody @Valid OrderRequest req, Authentication auth) {
        com.shopease.model.Orders order = new com.shopease.model.Orders();
        order.setUserId(currentUser(auth).getId());

        ShippingInfo s = req.shipping();
        order.setFullName(s.fullName().trim());
        order.setPhone(s.phone());
        order.setAddressLine(s.addressLine().trim());
        order.setCity(s.city().trim());
        order.setPincode(s.pincode());

        double total = 0;
        for (CartLine line : req.items()) {
            com.shopease.model.Product p = products.findByIdForUpdate(line.productId()).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Product " + line.productId() + " not found"));

            if (p.getStock() < line.quantity()) {
                String message = p.getStock() == 0
                        ? p.getName() + " is out of stock"
                        : "Only " + p.getStock() + " of " + p.getName() + " left in stock";
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
            }

            p.setStock(p.getStock() - line.quantity());
            order.getItems().add(new com.shopease.model.OrderItem(
                    p.getId(), p.getName(), p.getPrice(), line.quantity()));
            total += p.getPrice() * line.quantity();
        }

        order.setTotal(total);
        return orders.save(order);
    }

    @GetMapping
    public List<com.shopease.model.Orders> myOrders(Authentication auth) {
        return orders.findByUserIdOrderByCreatedAtDesc(currentUser(auth).getId());
    }

    private com.shopease.model.User currentUser(Authentication auth) {
        return users.findByEmail(auth.getName()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}