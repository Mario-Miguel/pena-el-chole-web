package com.penaelchole.backend.integrante;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data genera la implementación en tiempo de ejecución:
 * findAll(), findById(), save(), deleteById()... sin escribir SQL.
 */
public interface IntegranteRepository extends JpaRepository<Integrante, String> {
}
