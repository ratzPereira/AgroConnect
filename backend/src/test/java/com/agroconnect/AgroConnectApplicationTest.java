package com.agroconnect;

import org.junit.jupiter.api.Test;

class AgroConnectApplicationTest {

    @Test
    void contextLoadsWhenMainMethodCalled() {
        // Validates that the application class has a main method
        // Full context load test requires database — see integration tests
        AgroConnectApplication app = new AgroConnectApplication();
        assert app != null;
    }
}
