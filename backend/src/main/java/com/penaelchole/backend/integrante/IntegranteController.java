package com.penaelchole.backend.integrante;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints REST de Integrante. Contrato en backend/API.md, sección "Entities". */
@RestController
@RequestMapping("/api/entities/Integrante")
public class IntegranteController {

    private final IntegranteService service;

    public IntegranteController(IntegranteService service) {
        this.service = service;
    }

    // GET /api/entities/Integrante -> frontend: api.entities.Integrante.list()
    @GetMapping
    public List<IntegranteResponse> listar() {
        return service.listar();
    }
}
