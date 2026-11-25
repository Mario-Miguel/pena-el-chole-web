package com.penaelchole.backend.achievement;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.penaelchole.backend.common.BaseEntityService;
import com.penaelchole.backend.common.Filters;
import com.penaelchole.backend.common.ListQuery;
import com.penaelchole.backend.common.ResourceNotFoundException;

/**
 * Los logros se gestionan desde el panel de Admin (GamificacionesPanel.jsx),
 * así que escribir es solo para admins. Leer es para todos (pages/Logros.jsx).
 */
@Service
@PreAuthorize("hasRole('ADMIN')")
public class AchievementService
        implements BaseEntityService<AchievementRequest, AchievementResponse, AchievementPatch> {

    private final AchievementRepository repository;

    public AchievementService(AchievementRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<AchievementResponse> list(ListQuery query) {
        return repository.findAll(
                Filters.<Achievement>byEquality(query.filters()),
                query.toPageable(Achievement.class)).map(AchievementResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public AchievementResponse get(String id) {
        Achievement achievement = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se ha encontrado el logro"));
        return AchievementResponse.from(achievement);
    }

    @Override
    @Transactional
    public AchievementResponse insert(AchievementRequest request) {
        Achievement achievement = toEntity(request);
        return AchievementResponse.from(repository.saveAndFlush(achievement));
    }

    @Override
    @Transactional
    public List<AchievementResponse> bulkInsert(List<AchievementRequest> request) {
        List<Achievement> achievements = request.stream().map(AchievementService::toEntity).toList();
        return repository.saveAllAndFlush(achievements).stream().map(AchievementResponse::from).toList();
    }

    @Override
    @Transactional
    public AchievementResponse update(String id, AchievementPatch changes) {
        Achievement achievement = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se ha encontrado el logro"));
        achievement.applyChanges(changes);
        return AchievementResponse.from(achievement);
    }

    @Override
    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public void bulkDelete(List<String> ids) {
        repository.deleteAllById(ids);
    }

    private static Achievement toEntity(AchievementRequest request) {
        return new Achievement(
                Boolean.TRUE.equals(request.active()),
                request.category(),
                request.description(),
                request.icon(),
                request.name(),
                request.points() != null ? request.points() : 0,
                request.threshold() != null ? request.threshold() : 0);
    }

}
