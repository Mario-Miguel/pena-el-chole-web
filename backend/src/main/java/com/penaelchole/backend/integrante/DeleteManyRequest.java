package com.penaelchole.backend.integrante;

import java.util.List;

public record DeleteManyRequest(
        List<String> ids) {
}
