package com.penaelchole.backend.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.admin")
public record AdminProperties(String passwordHash) {
}
