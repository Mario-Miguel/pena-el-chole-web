package com.penaelchole.backend.auth;

import com.penaelchole.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class UserAccount extends BaseEntity {

    @Column(nullable = false)
    private String memberId;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private boolean disabled;

    private String avatarUrl;

    protected UserAccount() {
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
            String memberId = changes.memberId().orElse(null);
            if (memberId == null || memberId.isBlank()) {
                throw new IllegalArgumentException("El memberId no puede estar vacío");
            }
            setMemberId(memberId);
        }

        if (changes.username() != null) {
            String name = changes.username().orElse(null);
            if (name == null || name.isBlank()) {
                throw new IllegalArgumentException("El username no puede estar vacío");
            }
            setUsername(name);
        }

        if (changes.passwordHash() != null) {
            String passwordHash = changes.passwordHash().orElse(null);
            if (passwordHash == null || passwordHash.isBlank()) {
                throw new IllegalArgumentException("El passwordHash no puede estar vacío");
            }
            setPasswordHash(passwordHash);
        }

        if (changes.disabled() != null) {
            setDisabled(changes.disabled().orElse(false));
        }

        if (changes.avatarUrl() != null) {
            setAvatarUrl(changes.avatarUrl().orElse(null));
        }
    }

}
