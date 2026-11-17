package com.penaelchole.backend.integrante;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.penaelchole.backend.common.Filters;
import com.penaelchole.backend.common.ListQuery;
import com.penaelchole.backend.common.ResourceNotFoundException;

/**
 * Lógica de negocio de integrantes. El controller solo traduce HTTP <->
 * llamadas a este servicio.
 */
@Service
public class IntegranteService {

    private final IntegranteRepository repository;

    // Inyección por constructor: Spring pasa el repositorio automáticamente
    public IntegranteService(IntegranteRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<IntegranteResponse> list(ListQuery query) {
        return repository.findAll(Filters.<Integrante>byEquality(query.filters()),
                query.toPageable(Integrante.class))
                .map(IntegranteResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public IntegranteResponse get(String id) {
        Integrante member = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Integrante no encontrado"));
        return IntegranteResponse.from(member);
    }

    @Transactional
    public IntegranteResponse insert(IntegranteRequest request) {
        Integrante member = IntegranteService.toEntity(request);
        return IntegranteResponse.from(repository.saveAndFlush(member));
    }

    @Transactional
    public List<IntegranteResponse> bulkInsert(List<IntegranteRequest> request) {
        List<Integrante> members = request.stream().map(IntegranteService::toEntity).toList();
        return repository.saveAllAndFlush(members).stream().map(IntegranteResponse::from).toList();
    }

    @Transactional
    public IntegranteResponse update(String id, IntegrantePatch changes) {
        Integrante member = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Integrante no encontrado"));
        member.applyChanges(changes);
        return IntegranteResponse.from(member);
    }

    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }

    @Transactional
    public void bulkDelete(List<String> ids) {
        repository.deleteAllByIdInBatch(ids);
    }

    private static Integrante toEntity(IntegranteRequest r) {
        Integrante m = new Integrante(r.nombre(), r.categoria(), r.cargo());
        if (r.cervezas() != null)
            m.setCervezas(r.cervezas());
        m.setFechaNacimiento(r.fechaNacimiento());
        return m;
    }
}
