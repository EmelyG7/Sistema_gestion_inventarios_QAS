package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.ProductDTO;
import org.example.dto.ProductSearchDTO;
import org.example.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/products")
public class ProductControllerV2 {

    private final ProductService productService;

    public ProductControllerV2(ProductService productService) {
        this.productService = productService;
    }

    // === CRUD BÁSICO ===

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO request) {
        ProductDTO product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @GetMapping
    public List<ProductDTO> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{id}")
    public ProductDTO getProductById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductDTO updateProduct(@PathVariable Long id, @Valid @RequestBody ProductDTO request) {
        return productService.updateProduct(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // === BÚSQUEDA ===

    @PostMapping("/search")
    public List<ProductDTO> searchProducts(@RequestBody ProductSearchDTO searchRequest) {
        return productService.searchProducts(searchRequest);
    }

    @GetMapping("/search")
    public List<ProductDTO> simpleSearch(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(required = false) Boolean outOfStock) {

        ProductSearchDTO search = new ProductSearchDTO();
        search.setSearchTerm(searchTerm);
        search.setCategory(category);
        search.setLowStockOnly(lowStock);
        search.setOutOfStockOnly(outOfStock);

        return productService.searchProducts(search);
    }

    @GetMapping("/category/{category}")
    public List<ProductDTO> getByCategory(@PathVariable String category) {
        return productService.findProductsByCategory(category);
    }

    // === STOCK STATUS ===

    @GetMapping("/low-stock")
    public List<ProductDTO> getLowStockProducts() {
        return productService.findLowStockProducts();
    }

    @GetMapping("/out-of-stock")
    public List<ProductDTO> getOutOfStockProducts() {
        return productService.findOutOfStockProducts();
    }

    // === UTILIDADES ===

    @GetMapping("/categories")
    public List<String> getAllCategories() {
        return productService.getAllCategories();
    }

    @GetMapping("/stats")
    public Map<String, Object> getBasicStats() {
        return productService.getBasicStats();
    }
}