package com.penaelchole.backend.account;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;

import com.penaelchole.backend.auth.UsersResponse;
import com.penaelchole.backend.common.BaseRepository;

public interface UserAccountRepository extends BaseRepository<UserAccount> {
  Optional<UserAccount> findByUsernameIgnoreCase(String username);

  Optional<UserAccount> findByMemberId(String memberId);

  @Query("""
      select new com.penaelchole.backend.auth.UsersResponse(m.id, m.name, a.username)
      from UserAccount a, Member m
      where m.id = a.memberId
        and a.disabled = false
        and (m.category is null or m.category <> 'patitas')
      order by m.name
      """)
  List<UsersResponse> findLoginUsers();
}
