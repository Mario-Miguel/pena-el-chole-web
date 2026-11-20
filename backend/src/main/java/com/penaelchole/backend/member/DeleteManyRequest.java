package com.penaelchole.backend.member;

import java.util.List;

public record DeleteManyRequest(
        List<String> ids) {
}
