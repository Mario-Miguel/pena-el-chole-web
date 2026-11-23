package com.penaelchole.backend.auth;

import java.util.Optional;

import com.penaelchole.backend.common.BaseRepository;

public interface UserAccountRepository extends BaseRepository<UserAccount> {
    Optional<UserAccount> findByUsernameIgnoreCase(String username);
}
