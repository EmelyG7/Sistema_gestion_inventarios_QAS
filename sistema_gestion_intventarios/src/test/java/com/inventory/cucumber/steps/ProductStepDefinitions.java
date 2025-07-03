package com.inventory.cucumber.steps;

import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ProductStepDefinitions {

    @Autowired
    private MockMvc mockMvc;

    private String lastResponse;

    @Given("el sistema tiene los siguientes productos:")
    public void systemHasProducts(io.cucumber.datatable.DataTable dataTable) {
        // Implementación para inicializar la base de datos con los productos dados
        // Puedes usar un servicio de repositorio o llamadas a la API
    }

    @When("agrego un nuevo producto con:")
    public void addNewProduct(io.cucumber.datatable.DataTable dataTable) throws Exception {
        Map<String, String> productData = dataTable.asMaps().get(0);

        String json = String.format(
                "{\"name\":\"%s\",\"description\":\"%s\",\"category\":\"%s\",\"price\":%s,\"quantity\":%s}",
                productData.get("nombre"),
                productData.get("descripción"),
                productData.get("categoría"),
                productData.get("precio"),
                productData.get("cantidad")
        );

        mockMvc.perform(post("/api/products")
                        .contentType("application/json")
                        .content(json))
                .andExpect(status().isCreated());
    }

    @Then("el producto {string} debería existir en el sistema")
    public void productShouldExist(String productName) throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + productName + "')]").exists());
    }

    // Implementa los demás steps según sea necesario
}