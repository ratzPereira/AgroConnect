package com.agroconnect.integration;

import com.agroconnect.controller.TestDataController;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.service.TestDataResetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("prod")
class TestDataControllerProfileGuardIT extends TestContainersConfig {

    @Autowired
    private ApplicationContext context;

    @Test
    void inProdProfile_testDataControllerBean_shouldNotExist() {
        assertThatThrownBy(() -> context.getBean(TestDataController.class))
                .isInstanceOf(NoSuchBeanDefinitionException.class);
    }

    @Test
    void inProdProfile_testDataResetServiceBean_shouldNotExist() {
        assertThatThrownBy(() -> context.getBean(TestDataResetService.class))
                .isInstanceOf(NoSuchBeanDefinitionException.class);
    }
}
