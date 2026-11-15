package com.penaelchole.backend.integrante;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Lógica de negocio de integrantes. El controller solo traduce HTTP <-> llamadas a este servicio. */
@Service
public class IntegranteService {

    private final IntegranteRepository repository;

    // Inyección por constructor: Spring pasa el repositorio automáticamente
    public IntegranteService(IntegranteRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<IntegranteResponse> listar() {
        return repository.findAll().stream()
                .map(IntegranteResponse::from)
                .toList();
    }
}
