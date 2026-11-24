package com.penaelchole.backend.appconfig;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.penaelchole.backend.common.BaseEntityService;
import com.penaelchole.backend.common.Filters;
import com.penaelchole.backend.common.ListQuery;
import com.penaelchole.backend.common.ResourceNotFoundException;

@Service
public class AppConfigService implements BaseEntityService<AppConfigRequest, AppConfigResponse, AppConfigPatch> {
    private final AppConfigRepository repository;

    public AppConfigService(AppConfigRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppConfigResponse> list(ListQuery query) {
        return repository.findAll(
                Filters.<AppConfig>byEquality(query.filters()),
                query.toPageable(AppConfig.class)).map(AppConfigResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AppConfigResponse get(String id) {
        AppConfig config = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración no encontrada"));
        return AppConfigResponse.from(config);
    }

    @Override
    @Transactional
    public AppConfigResponse insert(AppConfigRequest request) {
        AppConfig config = toEntity(request);
        return AppConfigResponse.from(repository.saveAndFlush(config));
    }

    @Override
    @Transactional
    public List<AppConfigResponse> bulkInsert(List<AppConfigRequest> request) {
        List<AppConfig> configs = request.stream().map(r -> toEntity(r)).toList();
        return repository.saveAllAndFlush(configs).stream().map(AppConfigResponse::from).toList();
    }

    @Override
    @Transactional
    public AppConfigResponse update(String id, AppConfigPatch changes) {
        AppConfig appConfig = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración no encontrada"));

        appConfig.applyChanges(changes);
        return AppConfigResponse.from(appConfig);
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

    private AppConfig toEntity(AppConfigRequest request) {
        AppConfig config = new AppConfig(request.key(), request.value());
        return config;
    }

}
