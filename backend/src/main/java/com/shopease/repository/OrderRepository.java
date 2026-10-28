package com.shopease.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shopease.model.Orders;

public interface OrderRepository extends JpaRepository<Orders, Long> {
    List<Orders> findByUserIdOrderByCreatedAtDesc(Long userId);
}
