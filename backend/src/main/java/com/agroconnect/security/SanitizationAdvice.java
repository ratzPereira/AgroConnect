package com.agroconnect.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.jsoup.Jsoup;
import org.jsoup.parser.Parser;
import org.jsoup.safety.Safelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;

@RestControllerAdvice
public class SanitizationAdvice extends RequestBodyAdviceAdapter {

    private static final Logger log = LoggerFactory.getLogger(SanitizationAdvice.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean supports(MethodParameter methodParameter, Type targetType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        // Raw-body endpoints (e.g. the Stripe webhook, which verifies an HMAC over the exact
        // bytes received) must NOT be re-serialized — re-parsing and re-writing the JSON changes
        // the byte stream and breaks signature verification. Sanitization only applies to
        // structured JSON DTOs, never to raw String/byte[] payloads.
        return !String.class.equals(targetType) && !byte[].class.equals(targetType);
    }

    @Override
    public HttpInputMessage beforeBodyRead(HttpInputMessage inputMessage, MethodParameter parameter,
                                           Type targetType, Class<? extends HttpMessageConverter<?>> converterType) throws IOException {
        String rawBody = new String(inputMessage.getBody().readAllBytes(), StandardCharsets.UTF_8);
        String sanitized = sanitizeJsonString(rawBody);

        return new HttpInputMessage() {
            @Override
            public InputStream getBody() {
                return new ByteArrayInputStream(sanitized.getBytes(StandardCharsets.UTF_8));
            }

            @Override
            public HttpHeaders getHeaders() {
                return inputMessage.getHeaders();
            }
        };
    }

    public String sanitizeJsonString(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            sanitizeNode(root);
            return objectMapper.writeValueAsString(root);
        } catch (JsonProcessingException e) {
            log.warn("Failed to sanitize request body: {}", e.getMessage());
            return json;
        }
    }

    private void sanitizeNode(JsonNode node) {
        if (node.isObject()) {
            ObjectNode obj = (ObjectNode) node;
            obj.fields().forEachRemaining(entry -> {
                JsonNode value = entry.getValue();
                if (value.isTextual()) {
                    obj.set(entry.getKey(), new TextNode(sanitizeString(value.asText())));
                } else {
                    sanitizeNode(value);
                }
            });
        } else if (node.isArray()) {
            ArrayNode arr = (ArrayNode) node;
            for (int i = 0; i < arr.size(); i++) {
                JsonNode elem = arr.get(i);
                if (elem.isTextual()) {
                    arr.set(i, new TextNode(sanitizeString(elem.asText())));
                } else {
                    sanitizeNode(elem);
                }
            }
        }
    }

    private String sanitizeString(String input) {
        String cleaned = Jsoup.clean(input, Safelist.none()).trim();
        return Parser.unescapeEntities(cleaned, false);
    }
}
