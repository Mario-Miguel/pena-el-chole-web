package com.penaelchole.backend.integrante;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public List<IntegranteResponse> list() {
        return repository.findAll().stream()
                .map(IntegranteResponse::from)
                .toList();
    }

    @Transactional
    public IntegranteResponse insert(IntegranteRequest request) {
        Integrante member = new Integrante(request.nombre(), request.categoria(), request.cargo());
        if (request.cervezas() != null)
            member.setCervezas(request.cervezas());
        member.setFechaNacimiento(request.fechaNacimiento());
        return IntegranteResponse.from(repository.save(member));
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
}
