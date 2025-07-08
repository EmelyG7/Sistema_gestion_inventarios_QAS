package org.example.service;

import org.example.entity.Product;
import org.example.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository repository;

    public ProductServiceImpl(ProductRepository repository) {
        this.repository = repository;
    }

    @Override
    public Product save(Product product) {
        return repository.save(product);
    }

    @Override
    public List<Product> findAll() {
        return repository.findAll();
    }

    @Override
    public Product findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));
    }

    @Override
    public Product update(Long id, Product product) {
        Product existing = findById(id);
        existing.setName(product.getName());
        existing.setDescription(product.getDescription());
        existing.setCategory(product.getCategory());
        existing.setPrice(product.getPrice());
        existing.setInitialQuantity(product.getInitialQuantity());
        return repository.save(existing);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        repository.deleteById(id);
        repository.flush();
    }
}