package com.agroconnect.unit;

import com.agroconnect.security.SanitizationAdvice;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SanitizationAdviceTest {

    private SanitizationAdvice advice;

    @BeforeEach
    void setUp() {
        advice = new SanitizationAdvice();
    }

    @Test
    void sanitizeJson_givenHtmlInStringValue_shouldStripTags() {
        String input = "{\"name\":\"<script>alert('xss')</script>Hello\",\"age\":25}";
        String result = advice.sanitizeJsonString(input);
        assertEquals("{\"name\":\"Hello\",\"age\":25}", result);
    }

    @Test
    void sanitizeJson_givenPlainText_shouldPreserveIt() {
        String input = "{\"name\":\"Jo\u00e3o Silva\",\"email\":\"joao@example.pt\"}";
        String result = advice.sanitizeJsonString(input);
        assertEquals(input, result);
    }

    @Test
    void sanitizeJson_givenNestedHtml_shouldStripRecursively() {
        String input = "{\"data\":{\"title\":\"<b>bold</b>\"},\"note\":\"<img src=x>clean\"}";
        String result = advice.sanitizeJsonString(input);
        assertEquals("{\"data\":{\"title\":\"bold\"},\"note\":\"clean\"}", result);
    }

    @Test
    void sanitizeJson_givenArrayOfStrings_shouldSanitizeElements() {
        String input = "{\"items\":[\"<em>a</em>\",\"b\",\"<div>c</div>\"]}";
        String result = advice.sanitizeJsonString(input);
        assertEquals("{\"items\":[\"a\",\"b\",\"c\"]}", result);
    }

    @Test
    void sanitizeJson_givenHtmlEntities_shouldDecodeAfterSanitizing() {
        String input = "{\"text\":\"Price: 5 > 3\"}";
        String result = advice.sanitizeJsonString(input);
        assertEquals("{\"text\":\"Price: 5 > 3\"}", result);
    }

    @Test
    void supports_givenRawStringBody_shouldReturnFalse() {
        // Raw String bodies (e.g. Stripe webhook) must not be re-serialized — would break the HMAC.
        assertFalse(advice.supports(null, String.class, null));
    }

    @Test
    void supports_givenRawByteArrayBody_shouldReturnFalse() {
        assertFalse(advice.supports(null, byte[].class, null));
    }

    @Test
    void supports_givenStructuredDtoBody_shouldReturnTrue() {
        assertTrue(advice.supports(null, Object.class, null));
    }
}
