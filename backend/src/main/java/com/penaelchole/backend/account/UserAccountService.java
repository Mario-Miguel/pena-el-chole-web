package com.penaelchole.backend.account;

import java.util.List;
import java.util.Optional;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.penaelchole.backend.common.BaseEntityService;
import com.penaelchole.backend.common.Filters;
import com.penaelchole.backend.common.ListQuery;
import com.penaelchole.backend.common.ResourceNotFoundException;
import com.penaelchole.backend.member.MemberRepository;

@Service
public class UserAccountService
        implements BaseEntityService<UserAccountRequest, UserAccountResponse, UserAccountPatch> {

    private final UserAccountRepository repository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAccountService(
            UserAccountRepository repository,
            PasswordEncoder passwordEncoder,
            MemberRepository memberRepository) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.memberRepository = memberRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserAccountResponse> list(ListQuery query) {
        return repository.findAll(
                Filters.<UserAccount>byEquality(query.filters()),
                query.toPageable(UserAccount.class)).map(UserAccountResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserAccountResponse get(String id) {
        UserAccount account = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cuenta no encontrada"));
        return UserAccountResponse.from(account);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserAccountResponse insert(UserAccountRequest request) {
        validate(request.memberId(), request.username(), null);
        UserAccount account = toEntity(request);
        return UserAccountResponse.from(repository.saveAndFlush(account));
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserAccountResponse> bulkInsert(List<UserAccountRequest> request) {
        request.forEach(r -> validate(r.memberId(), r.username(), null));
        List<UserAccount> accounts = request.stream().map(r -> toEntity(r)).toList();
        return repository.saveAllAndFlush(accounts).stream().map(UserAccountResponse::from).toList();
    }

    @Override
    @Transactional
    public UserAccountResponse update(String id, UserAccountPatch changes) {
        UserAccount account = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cuenta no encontrada"));
        checkCanUpdate(account, changes);
        validate(valueOf(changes.memberId()), valueOf(changes.username()), account.getId());
        account.applyChanges(changes);
        if (changes.password() != null) {
            String password = changes.password().orElse(null);
            if (password == null || password.isBlank())
                throw new IllegalArgumentException("La contraseña no puede estar vacía");
            account.setPasswordHash(passwordEncoder.encode(password));
        }
        return UserAccountResponse.from(account);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(String id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void bulkDelete(List<String> ids) {
        repository.deleteAllByIdInBatch(ids);
    }

    private UserAccount toEntity(UserAccountRequest r) {
        UserAccount a = new UserAccount(
                r.memberId(),
                r.username(),
                passwordEncoder.encode(r.password()),
                r.avatarUrl());
        a.setDisabled(Boolean.TRUE.equals(r.disabled()));
        return a;
    }

    private void validate(String memberId, String username, String currentAccountId) {
        if (memberId != null) {
            if (!memberRepository.existsById(memberId))
                throw new IllegalArgumentException("El integrante no existe");
            repository.findByMemberId(memberId)
                    .filter(other -> !other.getId().equals(currentAccountId))
                    .ifPresent(other -> {
                        throw new IllegalArgumentException("Ese integrante ya tiene una cuenta");
                    });
        }
        if (username != null) {
            if (UserAccount.ADMIN_USERNAME.equalsIgnoreCase(username))
                throw new IllegalArgumentException("Ese nombre de usuario está reservado");
            repository.findByUsernameIgnoreCase(username)
                    .filter(other -> !other.getId().equals(currentAccountId))
                    .ifPresent(other -> {
                        throw new IllegalArgumentException("Ese usuario ya existe");
                    });
        }
    }

    private static String valueOf(Optional<String> field) {
        return field == null ? null : field.orElse(null);
    }

    private static void checkCanUpdate(UserAccount account, UserAccountPatch changes) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean admin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (admin)
            return;

        if (!account.getMemberId().equals(auth.getName()))
            throw new AccessDeniedException("Solo puedes modificar tu propia cuenta");
        if (changes.memberId() != null || changes.username() != null || changes.disabled() != null)
            throw new AccessDeniedException("Solo puedes cambiar tu contraseña y tu avatar");
    }

}
