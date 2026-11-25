package com.penaelchole.backend.beerbatch;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.penaelchole.backend.common.BaseEntityService;
import com.penaelchole.backend.common.Filters;
import com.penaelchole.backend.common.ListQuery;
import com.penaelchole.backend.common.ResourceNotFoundException;

@Service
public class BeerBatchService implements BaseEntityService<BeerBatchRequest, BeerBatchResponse, BeerBatchPatch> {
    private final BeerBatchRepository repository;

    public BeerBatchService(BeerBatchRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BeerBatchResponse> list(ListQuery query) {
        return repository.findAll(Filters.<BeerBatch>byEquality(
                query.filters()),
                query.toPageable(BeerBatch.class)).map(BeerBatchResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BeerBatchResponse get(String id) {
        BeerBatch beerBatch = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se ha encontrado el lote"));
        return BeerBatchResponse.from(beerBatch);
    }

    @Override
    @Transactional
    public BeerBatchResponse insert(BeerBatchRequest request) {
        BeerBatch beerBatch = toEntity(request);
        return BeerBatchResponse.from(repository.saveAndFlush(beerBatch));
    }

    @Override
    @Transactional
    public List<BeerBatchResponse> bulkInsert(List<BeerBatchRequest> request) {
        List<BeerBatch> beerBatchs = request.stream().map(BeerBatchService::toEntity).toList();
        return repository.saveAllAndFlush(beerBatchs).stream().map(BeerBatchResponse::from).toList();
    }

    @Override
    @Transactional
    public BeerBatchResponse update(String id, BeerBatchPatch changes) {
        BeerBatch beerBatch = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se ha encontrado el lote"));
        beerBatch.applyChanges(changes);
        return BeerBatchResponse.from(beerBatch);
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

    private static BeerBatch toEntity(BeerBatchRequest request) {
        return new BeerBatch(
                request.quantity(),
                request.consumedAdjustment(),
                request.cost(),
                request.date(),
                request.notes(),
                request.minimumStock(),
                request.type());
    }

}
