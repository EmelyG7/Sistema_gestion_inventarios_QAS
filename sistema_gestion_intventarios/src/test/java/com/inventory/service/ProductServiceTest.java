package com.inventory.service;

import org.example.dto.ProductDTO;
import org.example.entity.Product;
import org.example.repository.ProductRepository;
import org.example.service.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

//TODO : Rehacer tests con los métodos de la nueva api y agregar tests de lógica de negocios
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product product;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(1L);
        product.setName("Laptop HP");
        product.setDescription("High-end laptop");
        product.setCategory("Electronics");
        product.setPrice(BigDecimal.valueOf(999.99));
        product.setInitialQuantity(10);
    }

    @Test
    void save_savesAndReturnsProduct() {
        when(productRepository.save(any(Product.class))).thenReturn(product);

        Product savedProduct = productService.saveLegacy(product);

        assertNotNull(savedProduct);
        assertEquals("Laptop HP", savedProduct.getName());
        assertEquals(0, BigDecimal.valueOf(999.99).compareTo(savedProduct.getPrice()));
        assertEquals(10, savedProduct.getInitialQuantity());
        verify(productRepository, times(1)).save(product);
    }

    @Test
    void save_throwsExceptionForNullProduct() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> productService.saveLegacy(null));
        assertEquals("Product cannot be null", exception.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void save_throwsExceptionForInvalidPrice() {
        Product invalidProduct = new Product();
        invalidProduct.setName("Laptop HP");
        invalidProduct.setDescription("High-end laptop");
        invalidProduct.setCategory("Electronics");
        invalidProduct.setPrice(BigDecimal.valueOf(-10));
        invalidProduct.setInitialQuantity(10);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> productService.saveLegacy(invalidProduct));
        assertEquals("Price must be positive", exception.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void save_throwsExceptionForInvalidQuantity() {
        Product invalidProduct = new Product();
        invalidProduct.setName("Laptop HP");
        invalidProduct.setDescription("High-end laptop");
        invalidProduct.setCategory("Electronics");
        invalidProduct.setPrice(BigDecimal.valueOf(999.99));
        invalidProduct.setInitialQuantity(-5);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> productService.saveLegacy(invalidProduct));
        assertEquals("Quantity must be non-negative", exception.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void save_throwsExceptionForEmptyName() {
        Product invalidProduct = new Product();
        invalidProduct.setName("");
        invalidProduct.setDescription("High-end laptop");
        invalidProduct.setCategory("Electronics");
        invalidProduct.setPrice(BigDecimal.valueOf(999.99));
        invalidProduct.setInitialQuantity(10);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> productService.saveLegacy(invalidProduct));
        assertEquals("Name cannot be empty", exception.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void save_throwsExceptionForNullName() {
        Product invalidProduct = new Product();
        invalidProduct.setName(null);
        invalidProduct.setDescription("High-end laptop");
        invalidProduct.setCategory("Electronics");
        invalidProduct.setPrice(BigDecimal.valueOf(999.99));
        invalidProduct.setInitialQuantity(10);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> productService.saveLegacy(invalidProduct));
        assertEquals("Name cannot be empty", exception.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void save_acceptsZeroQuantity() {
        Product validProduct = new Product();
        validProduct.setName("Laptop HP");
        validProduct.setDescription("High-end laptop");
        validProduct.setCategory("Electronics");
        validProduct.setPrice(BigDecimal.valueOf(999.99));
        validProduct.setInitialQuantity(0);

        when(productRepository.save(any(Product.class))).thenReturn(validProduct);

        Product savedProduct = productService.saveLegacy(validProduct);

        assertNotNull(savedProduct);
        assertEquals(0, savedProduct.getInitialQuantity());
        verify(productRepository, times(1)).save(validProduct);
    }

    @Test
    void save_throwsExceptionForZeroPrice() {
        Product invalidProduct = new Product();
        invalidProduct.setName("Laptop HP");
        invalidProduct.setDescription("High-end laptop");
        invalidProduct.setCategory("Electronics");
        invalidProduct.setPrice(BigDecimal.ZERO);
        invalidProduct.setInitialQuantity(10);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> productService.saveLegacy(invalidProduct));
        assertEquals("Price must be positive", exception.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void save_acceptsNullCategory() {
        Product validProduct = new Product();
        validProduct.setName("Laptop HP");
        validProduct.setDescription("High-end laptop");
        validProduct.setCategory(null);
        validProduct.setPrice(BigDecimal.valueOf(999.99));
        validProduct.setInitialQuantity(10);

        when(productRepository.save(any(Product.class))).thenReturn(validProduct);

        Product savedProduct = productService.saveLegacy(validProduct);

        assertNotNull(savedProduct);
        assertNull(savedProduct.getCategory());
        verify(productRepository, times(1)).save(validProduct);
    }

    @Test
    void findAll_returnsProductList() {
        List<Product> products = Collections.singletonList(product);
        when(productRepository.findAll()).thenReturn(products);

        List<Product> result = productService.findAll();

        assertEquals(1, result.size());
        assertEquals("Laptop HP", result.getFirst().getName());
        verify(productRepository, times(1)).findAll();
    }

    @Test
    void findAll_returnsEmptyListWhenNoProducts() {
        when(productRepository.findAll()).thenReturn(Collections.emptyList());

        List<Product> result = productService.findAll();

        assertTrue(result.isEmpty());
        verify(productRepository, times(1)).findAll();
    }

    @Test
    void findById_returnsProduct() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        Product result = productService.findById(1L);

        assertNotNull(result);
        assertEquals("Laptop HP", result.getName());
        verify(productRepository, times(1)).findById(1L);
    }

    @Test
    void findById_throwsExceptionForInvalidId() {
        when(productRepository.findById(2L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> productService.findById(2L));
        assertEquals("Product not found", exception.getMessage());
        verify(productRepository, times(1)).findById(2L);
    }

    @Test
    void update_updatesAndReturnsProduct() {
        Product updatedProduct = new Product();
        updatedProduct.setName("Laptop HP");
        updatedProduct.setDescription("Updated description");
        updatedProduct.setCategory("Electronics");
        updatedProduct.setPrice(BigDecimal.valueOf(1099.99));
        updatedProduct.setInitialQuantity(15);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(updatedProduct);

        Product result = productService.updateLegacy(1L, updatedProduct);

        assertEquals("Updated description", result.getDescription());
        assertEquals(0, BigDecimal.valueOf(1099.99).compareTo(result.getPrice()));
        assertEquals(15, result.getInitialQuantity());
        verify(productRepository, times(1)).findById(1L);
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void update_partialUpdateDescription() {
        Product updatedProduct = new Product();
        updatedProduct.setName("Laptop HP");
        updatedProduct.setDescription("New description");
        updatedProduct.setCategory("Electronics");
        updatedProduct.setPrice(BigDecimal.valueOf(999.99));
        updatedProduct.setInitialQuantity(10);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(updatedProduct);

        Product result = productService.updateLegacy(1L, updatedProduct);

        assertEquals("New description", result.getDescription());
        assertEquals(0, BigDecimal.valueOf(999.99).compareTo(result.getPrice()));
        assertEquals(10, result.getInitialQuantity());
        verify(productRepository, times(1)).findById(1L);
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void update_throwsExceptionForInvalidId() {
        when(productRepository.findById(2L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> productService.updateLegacy(2L, product));
        assertEquals("Product not found", exception.getMessage());
        verify(productRepository, times(1)).findById(2L);
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void update_throwsExceptionForNullProduct() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> productService.updateLegacy(1L, null));
        assertEquals("Product cannot be null", exception.getMessage());
        verify(productRepository, never()).findById(anyLong());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void update_throwsExceptionForInvalidPrice() {
        Product invalidProduct = new Product();
        invalidProduct.setName("Laptop HP");
        invalidProduct.setDescription("Updated description");
        invalidProduct.setCategory("Electronics");
        invalidProduct.setPrice(BigDecimal.valueOf(-10));
        invalidProduct.setInitialQuantity(15);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> productService.updateLegacy(1L, invalidProduct));
        assertEquals("Price must be positive", exception.getMessage());
        verify(productRepository, never()).findById(anyLong());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void update_throwsExceptionForNullName() {
        Product invalidProduct = new Product();
        invalidProduct.setName(null);
        invalidProduct.setDescription("Updated description");
        invalidProduct.setCategory("Electronics");
        invalidProduct.setPrice(BigDecimal.valueOf(1099.99));
        invalidProduct.setInitialQuantity(15);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> productService.updateLegacy(1L, invalidProduct));
        assertEquals("Name cannot be empty", exception.getMessage());
        verify(productRepository, never()).findById(anyLong());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void update_throwsExceptionForZeroPrice() {
        Product invalidProduct = new Product();
        invalidProduct.setName("Laptop HP");
        invalidProduct.setDescription("Updated description");
        invalidProduct.setCategory("Electronics");
        invalidProduct.setPrice(BigDecimal.ZERO);
        invalidProduct.setInitialQuantity(15);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> productService.updateLegacy(1L, invalidProduct));
        assertEquals("Price must be positive", exception.getMessage());
        verify(productRepository, never()).findById(anyLong());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void update_acceptsNullCategory() {
        Product updatedProduct = new Product();
        updatedProduct.setName("Laptop HP");
        updatedProduct.setDescription("Updated description");
        updatedProduct.setCategory(null);
        updatedProduct.setPrice(BigDecimal.valueOf(1099.99));
        updatedProduct.setInitialQuantity(15);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(updatedProduct);

        Product result = productService.updateLegacy(1L, updatedProduct);

        assertNull(result.getCategory());
        assertEquals("Updated description", result.getDescription());
        verify(productRepository, times(1)).findById(1L);
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void delete_deletesProduct() {
        when(productRepository.existsById(1L)).thenReturn(true);
        doNothing().when(productRepository).deleteById(1L);

        productService.deleteProduct(1L);

        verify(productRepository, times(1)).existsById(1L);
        verify(productRepository, times(1)).deleteById(1L);
    }

    @Test
    void delete_throwsExceptionForNonExistentId() {
        when(productRepository.existsById(2L)).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> productService.deleteProduct(2L));
        assertEquals("Product not found with id: 2", exception.getMessage());
        verify(productRepository, times(1)).existsById(2L);
        verify(productRepository, never()).deleteById(2L);
    }

    @Test
    void findByCategory_returnsProducts() {
        List<Product> products = Collections.singletonList(product);
        when(productRepository.findByCategory("Electronics")).thenReturn(products);

        List<ProductDTO> result = productService.findProductsByCategory("Electronics");

        assertEquals(1, result.size());
        assertEquals("Laptop HP", result.getFirst().getName());
        verify(productRepository, times(1)).findByCategory("Electronics");
    }

    @Test
    void findByCategory_returnsEmptyListWhenNoProducts() {
        when(productRepository.findByCategory("Electronics")).thenReturn(Collections.emptyList());

        List<ProductDTO> result = productService.findProductsByCategory("Electronics");

        assertTrue(result.isEmpty());
        verify(productRepository, times(1)).findByCategory("Electronics");
    }
}