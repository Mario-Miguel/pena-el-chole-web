package com.penaelchole.backend.account;

import com.penaelchole.backend.common.ApiName;
import com.penaelchole.backend.common.BaseEntity;
import com.penaelchole.backend.common.NotFilterable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class UserAccount extends BaseEntity {
    public static final String ADMIN_USERNAME = "__admin__";

    @ApiName("integrante_id")
    @Column(nullable = false)
    private String memberId;

    @ApiName("usuario")
    @Column(nullable = false)
    private String username;

    @NotFilterable
    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private boolean disabled;

    private String avatarUrl;

    protected UserAccount() {
    }

    public UserAccount(String memberId, String username, String avatarUrl) {
        this.memberId = memberId;
        this.username = username;
        this.avatarUrl = avatarUrl;
    }

    public UserAccount(String memberId, String username, String passwordHash, String avatarUrl) {
        this.memberId = memberId;
        this.username = username;
        this.passwordHash = passwordHash;
        this.avatarUrl = avatarUrl;
    }

    public String getMemberId() {
        return memberId;
    }

    public void setMemberId(String memberId) {
        this.memberId = memberId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public boolean isDisabled() {
        return disabled;
    }

    public void setDisabled(boolean disabled) {
        this.disabled = disabled;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public void applyChanges(UserAccountPatch changes) {
        if (changes.memberId() != null) {
            String member = changes.memberId().orElse(null);
            if (member == null || member.isBlank()) {
                throw new IllegalArgumentException("El miembro no puede estar vacío");
            }
            setMemberId(member);
        }

        if (changes.username() != null) {
            String name = changes.username().orElse(null);
            if (name == null || name.isBlank()) {
                throw new IllegalArgumentException("El nopmbre de usuario no puede estar vacío");
            }
            setUsername(name);
        }

        if (changes.disabled() != null) {
            setDisabled(changes.disabled().orElse(false));
        }

        if (changes.avatarUrl() != null) {
            setAvatarUrl(changes.avatarUrl().orElse(null));
        }
    }

}
