package com.inventory.cucumber.runner;

import io.cucumber.junit.Cucumber;
import io.cucumber.junit.CucumberOptions;
import org.junit.runner.RunWith;

@RunWith(Cucumber.class)
@CucumberOptions(
        features = "src/test/resources/features/product",
        glue = {
                "com.inventory.cucumber.steps",
                "com.inventory.cucumber" // Para encontrar la clase de configuración
        },
        plugin = {
                "pretty",
                "html:target/cucumber-reports/cucumber.html",
                "json:target/cucumber-reports/cucumber.json"
        },
        monochrome = true
        //,
//        tags = "@Frontend or @Backend" // Adjust if using specific tags
)
public class CucumberTestRunner {
}