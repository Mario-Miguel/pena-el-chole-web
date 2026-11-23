package com.penaelchole.backend.common;

import java.util.List;

public record DeleteManyRequest(
                List<String> ids) {
}
