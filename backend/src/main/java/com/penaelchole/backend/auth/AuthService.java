package com.penaelchole.backend.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.penaelchole.backend.member.Member;
import com.penaelchole.backend.member.MemberRepository;

@Service
public class AuthService {

    public static final String ADMIN_ID = "__admin__";

    private final PasswordEncoder passwordEncoder;
    private final UserAccountRepository userAccountRepository;
    private final MemberRepository memberRepository;
    private final TokenService tokenService;
    private final AdminProperties adminProperties;

    public AuthService(
            PasswordEncoder passwordEncoder,
            UserAccountRepository userAccountRepository,
            MemberRepository memberRepository,
            TokenService tokenService,
            AdminProperties adminProperties) {
        this.passwordEncoder = passwordEncoder;
        this.userAccountRepository = userAccountRepository;
        this.memberRepository = memberRepository;
        this.tokenService = tokenService;
        this.adminProperties = adminProperties;
    }

    public LoginResponse login(LoginRequest request) {
        UserSession session = ADMIN_ID.equals(request.username()) ? loginAdmin(request.password())
                : loginAccount(request);
        return new LoginResponse(tokenService.createToken(session), session);
    }

    private UserSession loginAccount(LoginRequest request) {
        UserAccount account = userAccountRepository.findByUsernameIgnoreCase(request.username())
                .orElseThrow(InvalidCredentialsException::new);
        if (account.isDisabled() || !passwordEncoder.matches(request.password(), account.getPasswordHash()))
            throw new InvalidCredentialsException();
        UserSession session = toSession(account);
        return session;
    }

    private UserSession toSession(UserAccount account) {
        Member member = memberRepository.findById(account.getMemberId()).orElseThrow(InvalidCredentialsException::new);
        return new UserSession(member.getId(), member.getName(), member.getRole(), account.getAvatarUrl(), false);
    }

    private UserSession loginAdmin(String password) {
        String hash = adminProperties.passwordHash();
        if (hash == null || hash.isBlank() || !passwordEncoder.matches(password, hash))
            throw new InvalidCredentialsException();
        return adminSession();
    }

    private static UserSession adminSession() {
        return new UserSession(ADMIN_ID, "Admin", null, null, true);
    }
}
