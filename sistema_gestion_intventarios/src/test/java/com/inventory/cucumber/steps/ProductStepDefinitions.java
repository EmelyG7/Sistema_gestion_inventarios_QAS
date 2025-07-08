package com.inventory.cucumber.steps;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.And;
import io.cucumber.datatable.DataTable;
import org.junit.After;
import org.junit.jupiter.api.Assertions;
import org.openqa.selenium.By;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.example.Main;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
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
    private final Map<String, Long> productIds = new HashMap<>();
    private WebDriver driver;

    @Before
    public void setup() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
        System.setProperty("webdriver.chrome.driver", "path/to/chromedriver"); // Set path to chromedriver
    }

    @Given("el sistema tiene los siguientes productos:")
    @WithMockUser(roles = "ADMIN")
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
                            .content(json))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            JsonNode product = objectMapper.readTree(response);
            productIds.put(productData.get("nombre"), product.get("id").asLong());
        }
    }

    @Given("el producto {string} tiene el ID {int}")
    @WithMockUser(roles = "ADMIN")
    public void productHasId(String productName, int id) {
        productIds.put(productName, (long) id);
    }

    @Given("estoy autenticado como empleado")
    @WithMockUser(roles = "EMPLOYEE")
    public void authenticatedAsEmployee() {
        // No additional setup needed for backend; handled by @WithMockUser
    }

    @When("solicito la lista de productos")
    @WithMockUser(roles = "EMPLOYEE")
    public void requestProductList() throws Exception {
        mockMvc.perform(get("/api/products")
                        .contentType("application/json"))
                .andExpect(status().isOk());
    }

    @Then("debería ver los productos {string} y {string} en el sistema")
    public void verifyProductsInSystem(String product1, String product2) throws Exception {
        mockMvc.perform(get("/api/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + product1 + "')]").exists())
                .andExpect(jsonPath("$[?(@.name == '" + product2 + "')]").exists());
    }

    @And("debería ver un resumen con el total de productos {int} y el valor total del inventario {int}")
    public void verifySummary(int totalProducts, int totalValue) throws Exception {
        mockMvc.perform(get("/api/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(totalProducts))
                .andExpect(jsonPath("$").value(hasSize(totalProducts)));

        String response = mockMvc.perform(get("/api/products")
                        .contentType("application/json"))
                .andReturn().getResponse().getContentAsString();
        JsonNode products = objectMapper.readTree(response);
        double calculatedValue = 0;
        for (JsonNode product : products) {
            calculatedValue += product.get("price").asDouble() * product.get("initialQuantity").asInt();
        }
        Assertions.assertEquals(totalValue, calculatedValue, 0.01, "Total inventory value mismatch");
    }

    @When("intento agregar un nuevo producto con:")
    @WithMockUser(roles = "EMPLOYEE")
    public void attemptAddNewProduct(DataTable dataTable) throws Exception {
        Map<String, String> productData = dataTable.asMaps().get(0);

        String json = String.format(
                "{\"name\":\"%s\",\"description\":\"%s\",\"category\":\"%s\",\"price\":%s,\"initialQuantity\":%s}",
                productData.get("nombre"),
                productData.get("descripción"),
                productData.get("categoría"),
                productData.get("precio"),
                productData.get("cantidad")
        );

        mockMvc.perform(post("/api/products")
                        .contentType("application/json")
                        .content(json))
                .andExpect(status().isForbidden());
    }

    @Then("debería recibir un error 403")
    public void verify403Error() {
        // Handled in attemptAddNewProduct
    }

    @When("agrego un nuevo producto con:")
    @WithMockUser(roles = "ADMIN")
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
                        .content(json))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode product = objectMapper.readTree(response);
        productIds.put(productData.get("nombre"), product.get("id").asLong());
    }

    @Then("el producto {string} debería existir en el sistema")
    public void productShouldExist(String productName) throws Exception {
        mockMvc.perform(get("/api/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + productName + "')]").exists());
    }

    @And("la cantidad del producto {string} debería ser {int}")
    public void productShouldHaveQuantity(String productName, int expectedQuantity) throws Exception {
        mockMvc.perform(get("/api/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + productName + "')].initialQuantity").value(expectedQuantity));
    }

    @When("edito el producto con ID {int} con:")
    @WithMockUser(roles = "ADMIN")
    public void editProduct(int id, DataTable dataTable) throws Exception {
        Map<String, String> updates = dataTable.asMap();

        String response = mockMvc.perform(get("/api/products/" + id)
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode existingProduct = objectMapper.readTree(response);

        String json = String.format(
                "{\"name\":\"%s\",\"description\":\"%s\",\"category\":\"%s\",\"price\":%s,\"initialQuantity\":%s}",
                existingProduct.get("name").asText(),
                updates.getOrDefault("descripción", existingProduct.get("description").asText()),
                existingProduct.get("category").asText(),
                updates.getOrDefault("precio", existingProduct.get("price").asText()),
                existingProduct.get("initialQuantity").asText()
        );

        mockMvc.perform(put("/api/products/" + id)
                        .contentType("application/json")
                        .content(json))
                .andExpect(status().isOk());
    }

    @Then("el producto {string} debería tener descripción {string}")
    public void productShouldHaveDescription(String productName, String expectedDescription) throws Exception {
        mockMvc.perform(get("/api/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + productName + "')].description").value(expectedDescription));
    }

    @And("el producto {string} debería tener precio {int}")
    public void productShouldHavePrice(String productName, int expectedPrice) throws Exception {
        mockMvc.perform(get("/api/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + productName + "')].price").value(expectedPrice));
    }

    @When("elimino el producto con ID {int}")
    @WithMockUser(roles = "ADMIN")
    public void deleteProduct(int id) throws Exception {
        mockMvc.perform(delete("/api/products/" + id)
                        .contentType("application/json"))
                .andExpect(status().isNoContent());
    }

    @Then("el producto {string} no debería existir en el sistema")
    public void productShouldNotExist(String productName) throws Exception {
        mockMvc.perform(get("/api/products")
                        .contentType("application/json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == '" + productName + "')]").doesNotExist());
    }

    @Given("estoy autenticado como empleado en el frontend")
    @WithMockUser(roles = "EMPLOYEE")
    public void authenticatedAsEmployeeFrontend() {
        driver = new ChromeDriver();
        driver.get("http://localhost:8180/realms/inventory-realm/protocol/openid-connect/auth?client_id=inventory-app-public&redirect_uri=http://localhost:3000&response_type=code&scope=openid");
        driver.findElement(By.id("username")).sendKeys("employee");
        driver.findElement(By.id("password")).sendKeys("employee");
        driver.findElement(By.id("kc-login")).click();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    }

    @When("navego a la página de lista de productos")
    public void navigateToProductListPage() {
        driver.get("http://localhost:3000"); // App.js renders product list at root
    }

    @Then("debería ver la lista de productos con un resumen")
    public void verifyProductListWithSummary() {
        // Verify product list
        List<org.openqa.selenium.WebElement> products = driver.findElements(By.cssSelector(".product-table tbody tr"));
        Assertions.assertTrue(products.size() >= 2, "Product list should contain at least 2 products");

        // Verify specific products
        String pageSource = driver.getPageSource();
        Assertions.assertTrue(pageSource.contains("Laptop HP"), "Product 'Laptop HP' should be visible");
        Assertions.assertTrue(pageSource.contains("Mouse Logi"), "Product 'Mouse Logi' should be visible");

        // Verify summary section
        Assertions.assertTrue(driver.findElement(By.cssSelector(".advanced-stats")).isDisplayed(), "Summary section should be visible");
        Assertions.assertTrue(driver.findElement(By.cssSelector(".stat-card")).isDisplayed(), "At least one stat card should be visible");
    }

    @And("no debería ver el formulario de creación de productos ni botones de edición o eliminación")
    public void verifyNoCrudElements() {
        List<org.openqa.selenium.WebElement> addButtons = driver.findElements(By.cssSelector(".add-product-button"));
        List<org.openqa.selenium.WebElement> editButtons = driver.findElements(By.cssSelector(".edit-btn"));
        List<org.openqa.selenium.WebElement> deleteButtons = driver.findElements(By.cssSelector(".delete-btn"));
        List<org.openqa.selenium.WebElement> createForms = driver.findElements(By.cssSelector(".modal-form"));

        Assertions.assertTrue(addButtons.isEmpty(), "Add product button should not be visible for employees");
        Assertions.assertTrue(editButtons.isEmpty(), "Edit buttons should not be visible for employees");
        Assertions.assertTrue(deleteButtons.isEmpty(), "Delete buttons should not be visible for employees");
        Assertions.assertTrue(createForms.isEmpty(), "Create product form should not be visible for employees");
    }

    @After
    public void tearDown() {
        if ( driver != null ) {
            driver.quit();
        }
    }


    @Given("estoy autenticado como administrador en el frontend")
    @WithMockUser(roles = "ADMIN")
    public void authenticatedAsAdminFrontend() {
        driver = new ChromeDriver();
        driver.get("http://localhost:8180/realms/inventory-realm/protocol/openid-connect/auth?client_id=inventory-app-public&redirect_uri=http://localhost:3000&response_type=code&scope=openid");
        driver.findElement(By.id("username")).sendKeys("admin");
        driver.findElement(By.id("password")).sendKeys("admin");
        driver.findElement(By.id("kc-login")).click();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    }

    @When("abro el formulario de creación de producto")
    public void openCreateProductForm() {
        driver.findElement(By.cssSelector(".add-product-button")).click();
    }

    @When("lleno el formulario con nombre {string}, descripción {string}, categoría {string}, precio {int} y cantidad {int}")
    public void fillCreateForm(String name, String description, String category, int price, int quantity) {
        driver.findElement(By.cssSelector(".modal-form input[name='name']")).sendKeys(name);
        driver.findElement(By.cssSelector(".modal-form input[name='description']")).sendKeys(description);
        driver.findElement(By.cssSelector(".modal-form input[name='category']")).sendKeys(category);
        driver.findElement(By.cssSelector(".modal-form input[name='price']")).sendKeys(String.valueOf(price));
        driver.findElement(By.cssSelector(".modal-form input[name='initialQuantity']")).sendKeys(String.valueOf(quantity));
    }

    @When("envío el formulario de creación")
    public void submitCreateForm() {
        driver.findElement(By.cssSelector(".modal-form button[type='submit']")).click();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    }

    @Then("debería ver el producto {string} en la lista de productos")
    public void verifyProductInList(String productName) {
        String pageSource = driver.getPageSource();
        Assertions.assertTrue(pageSource.contains(productName), "Product '" + productName + "' should be visible in the product list");
    }

    @When("abro el formulario de edición para el producto con ID {int}")
    public void openEditForm(int id) {
        driver.findElement(By.cssSelector(".edit-btn[data-id='" + id + "']")).click();
    }

    @When("actualizo el formulario con descripción {string} y precio {int}")
    public void fillEditForm(String description, int price) {
        driver.findElement(By.cssSelector(".modal-form input[name='description']")).clear();
        driver.findElement(By.cssSelector(".modal-form input[name='description']")).sendKeys(description);
        driver.findElement(By.cssSelector(".modal-form input[name='price']")).clear();
        driver.findElement(By.cssSelector(".modal-form input[name='price']")).sendKeys(String.valueOf(price));
    }

    @When("envío el formulario de edición")
    public void submitEditForm() {
        driver.findElement(By.cssSelector(".modal-form button[type='submit']")).click();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    }

    @Then("debería ver el producto {string} con descripción {string} en la lista de productos")
    public void verifyUpdatedProductInList(String productName, String description) {
        String pageSource = driver.getPageSource();
        Assertions.assertTrue(pageSource.contains(productName), "Product '" + productName + "' should be visible");
        Assertions.assertTrue(pageSource.contains(description), "Description '" + description + "' should be visible");
    }

    @When("elimino el producto con ID {int}")
    public void deleteProductFrontend(int id) {
        driver.findElement(By.cssSelector(".delete-btn[data-id='" + id + "']")).click();
        driver.switchTo().alert().accept(); // Handle confirmation dialog
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    }

    @Then("el producto {string} no debería estar en la lista de productos")
    public void verifyProductNotInList(String productName) {
        String pageSource = driver.getPageSource();
        Assertions.assertFalse(pageSource.contains(productName), "Product '" + productName + "' should not be visible");
    }
}