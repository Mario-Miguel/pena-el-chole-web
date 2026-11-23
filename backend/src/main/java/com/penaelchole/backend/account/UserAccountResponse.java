package com.penaelchole.backend.account;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record UserAccountResponse(
        String id,
        @JsonProperty("integrante_id") String memberId,
        @JsonProperty("usuario") String username,
        @JsonProperty("disabled") boolean disabled,
        @JsonProperty("avatar_url") String avatarUrl,
        Instant createdDate,
        Instant updatedDate,
        String createdById) {

    public static UserAccountResponse from(UserAccount a) {
        return new UserAccountResponse(
                a.getId(),
                a.getMemberId(),
                a.getUsername(),
                a.isDisabled(),
                a.getAvatarUrl(),
                a.getCreatedDate(),
                a.getUpdatedDate(),
                a.getCreatedById());
    }
}
