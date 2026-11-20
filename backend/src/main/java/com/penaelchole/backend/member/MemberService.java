package com.penaelchole.backend.member;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.penaelchole.backend.common.Filters;
import com.penaelchole.backend.common.ListQuery;
import com.penaelchole.backend.common.ResourceNotFoundException;

/**
 * Lógica de negocio de los miembros. El controller solo traduce HTTP <->
 * llamadas a este servicio.
 */
@Service
public class MemberService {

    private final MemberRepository repository;

    // Inyección por constructor: Spring pasa el repositorio automáticamente
    public MemberService(MemberRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> list(ListQuery query) {
        return repository.findAll(Filters.<Member>byEquality(query.filters()),
                query.toPageable(Member.class))
                .map(MemberResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MemberResponse get(String id) {
        Member member = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Integrante no encontrado"));
        return MemberResponse.from(member);
    }

    @Transactional
    public MemberResponse insert(MemberRequest request) {
        Member member = MemberService.toEntity(request);
        return MemberResponse.from(repository.saveAndFlush(member));
    }

    @Transactional
    public List<MemberResponse> bulkInsert(List<MemberRequest> request) {
        List<Member> members = request.stream().map(MemberService::toEntity).toList();
        return repository.saveAllAndFlush(members).stream().map(MemberResponse::from).toList();
    }

    @Transactional
    public MemberResponse update(String id, MemberPatch changes) {
        Member member = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Integrante no encontrado"));
        member.applyChanges(changes);
        return MemberResponse.from(member);
    }

    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }

    @Transactional
    public void bulkDelete(List<String> ids) {
        repository.deleteAllByIdInBatch(ids);
    }

    private static Member toEntity(MemberRequest r) {
        Member m = new Member(r.name(), r.category(), r.role());
        if (r.beers() != null)
            m.setBeers(r.beers());
        m.setBirthDate(r.birthDate());
        return m;
    }
}
