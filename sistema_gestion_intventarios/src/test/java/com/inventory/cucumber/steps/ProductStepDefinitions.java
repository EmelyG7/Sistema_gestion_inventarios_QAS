package com.inventory.cucumber.steps;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.And;
import io.cucumber.datatable.DataTable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.example.Main;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(classes = Main.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class ProductStepDefinitions {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Long> productIds = new HashMap<>(); // Store product name to ID mappings
    private String accessToken = "mock-jwt-token"; // Mock token for tests

    @Before
    public void setup() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
    }

    @Given("el sistema tiene los siguientes productos:")
    public void systemHasProducts(DataTable dataTable) throws Exception {
        for (Map<String, String> productData : dataTable.asMaps()) {
            String json = String.format(
                    "{\"name\":\"%s\",\"description\":\"%s\",\"category\":\"%s\",\"price\":%s,\"initialQuantity\":%s}",
                    productData.get("nombre"),
                    productData.get("descripción"),
                    productData.get("categoría"),
                    productData.get("precio"),
                    productData.get("cantidad")
            );

            String response = mockMvc.perform(post("/api/products")
                            .contentType("application/json")
                            .header("Authorization", "Bearer " + accessToken)
                            .content(json))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();

            JsonNode product = objectMapper.readTree(response);
            productIds.put(productData.get("nombre"), product.get("id").asLong());
        }
    }

    @Given("el producto {string} tiene el ID {int}")
    public void productHasId(String productName, int id) {
        productIds.put(productName, (long) id);
    }

    @When("agrego un nuevo producto con:")
    public void addNewProduct(DataTable dataTable) throws Exception {
        Map<String, String> productData = dataTable.asMaps().get(0);

        String json = String.format(
                "{\"name\":\"%s\",\"description\":\"%s\",\"category\":\"%s\",\"price\":%s,\"initialQuantity\":%s}",
                productData.get("nombre"),
                productData.get("descripción"),
                productData.get("categoría"),
                productData.get("precio"),
                productData.get("cantidad")
        );

        String response = mockMvc.perform(post("/api/products")
                        .contentType("application/json")
                        .header("Authorization", "Bearer " + accessToken)
                        .content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode product = objectMapper.readTree(response);
        productIds.put(productData.get("nombre"), product.get("id").asLong());
    }

    @Then("el producto {string} debería existir en el sistema")
    public void productShouldExist(String productName) throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + productName + "')]").exists());
    }

    @And("la cantidad del producto {string} debería ser {int}")
    public void productShouldHaveQuantity(String productName, int expectedQuantity) throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + productName + "')].initialQuantity").value(expectedQuantity));
    }

    @When("edito el producto con ID {int} con:")
    public void editProduct(int id, DataTable dataTable) throws Exception {
        Map<String, String> updates = dataTable.asMap(String.class, String.class);

        // Fetch existing product
        String response = mockMvc.perform(get("/api/products/" + id))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode existingProduct = objectMapper.readTree(response);

        String json = String.format(
                "{\"name\":\"%s\",\"description\":\"%s\",\"category\":\"%s\",\"price\":%s,\"quantity\":%s}",
                existingProduct.get("name").asText(),
                updates.getOrDefault("descripción", existingProduct.get("description").asText()),
                existingProduct.get("category").asText(),
                updates.getOrDefault("precio", existingProduct.get("price").asText()),
                existingProduct.get("quantity").asText()
        );

        mockMvc.perform(put("/api/products/" + id)
                        .contentType("application/json")
                        .header("Authorization", "Bearer " + accessToken)
                        .content(json))
                .andExpect(status().isOk());
    }

    @Then("el producto {string} debería tener descripción {string}")
    public void productShouldHaveDescription(String productName, String expectedDescription) throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + productName + "')].description").value(expectedDescription));
    }

    @And("el producto {string} debería tener precio {int}")
    public void productShouldHavePrice(String productName, int expectedPrice) throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + productName + "')].price").value(expectedPrice));
    }

    @When("elimino el producto con ID {int}")
    public void deleteProduct(int id) throws Exception {
        mockMvc.perform(delete("/api/products/" + id))
                .andExpect(status().isNoContent());
    }

    @Then("el producto {string} no debería existir en el sistema")
    public void productShouldNotExist(String productName) throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + productName + "')]").doesNotExist());
    }
}