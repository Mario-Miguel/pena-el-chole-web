package com.penaelchole.backend.integrante;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import tools.jackson.databind.JsonNode;

/**
 * Endpoints REST de Integrante. Contrato en backend/API.md, sección "Entities".
 */
@RestController
@RequestMapping("/api/entities/Integrante")
public class IntegranteController {

    private final IntegranteService service;

    public IntegranteController(IntegranteService service) {
        this.service = service;
    }

    // GET /api/entities/Integrante -> frontend: api.entities.Integrante.list()
    @GetMapping
    public List<IntegranteResponse> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IntegranteResponse insert(@Valid @RequestBody IntegranteRequest request) {
        return service.insert(request);
    }

    @PatchMapping("/{id}")
    public IntegranteResponse update(@PathVariable String id, @RequestBody JsonNode changes) {
        return service.update(id, IntegrantePatch.from(changes));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        service.delete(id);
    }

}
