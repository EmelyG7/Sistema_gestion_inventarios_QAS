package org.example.service;

import org.example.entity.Product;

import java.util.List;

public interface ProductService {
    Product save(Product product);
    List<Product> findAll();
    Product findById(Long id);
    Product update(Long id, Product product);
    void delete(Long id);
}
