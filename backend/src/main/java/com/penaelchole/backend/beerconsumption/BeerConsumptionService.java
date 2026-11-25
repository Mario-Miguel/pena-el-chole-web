package com.penaelchole.backend.beerconsumption;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.penaelchole.backend.common.BaseEntityService;
import com.penaelchole.backend.common.Filters;
import com.penaelchole.backend.common.ListQuery;
import com.penaelchole.backend.common.ResourceNotFoundException;

@Service
public class BeerConsumptionService
        implements BaseEntityService<BeerConsumptionRequest, BeerConsumptionResponse, BeerConsumptionPatch> {
    private final BeerConsumptionRepository repository;

    public BeerConsumptionService(BeerConsumptionRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BeerConsumptionResponse> list(ListQuery query) {
        return repository
                .findAll(Filters.<BeerConsumption>byEquality(query.filters()), query.toPageable(BeerConsumption.class))
                .map(BeerConsumptionResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BeerConsumptionResponse get(String id) {
        BeerConsumption beerConsumption = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consumo no encontrado"));
        return BeerConsumptionResponse.from(beerConsumption);
    }

    @Override
    @Transactional
    public BeerConsumptionResponse insert(BeerConsumptionRequest request) {
        BeerConsumption beerConsumption = toEntity(request);
        return BeerConsumptionResponse.from(repository.saveAndFlush(beerConsumption));
    }

    @Override
    @Transactional
    public List<BeerConsumptionResponse> bulkInsert(List<BeerConsumptionRequest> request) {
        List<BeerConsumption> beerConsumptions = request.stream().map(BeerConsumptionService::toEntity).toList();

        return repository.saveAllAndFlush(beerConsumptions).stream().map(BeerConsumptionResponse::from).toList();
    }

    @Override
    @Transactional
    public BeerConsumptionResponse update(String id, BeerConsumptionPatch changes) {
        BeerConsumption beerConsumption = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consumo no encontrado"));
        beerConsumption.applyChanges(changes);
        return BeerConsumptionResponse.from(beerConsumption);
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

    private static BeerConsumption toEntity(BeerConsumptionRequest request) {
        return new BeerConsumption(
                request.quantity(),
                request.memberId(),
                request.type());
    }

}
