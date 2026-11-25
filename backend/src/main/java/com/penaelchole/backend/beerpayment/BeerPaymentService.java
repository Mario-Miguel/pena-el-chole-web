package com.penaelchole.backend.beerpayment;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.penaelchole.backend.common.BaseEntityService;
import com.penaelchole.backend.common.Filters;
import com.penaelchole.backend.common.ListQuery;
import com.penaelchole.backend.common.ResourceNotFoundException;

/**
 * Los pagos los gestionan solo presidente, vicepresidente y admins
 * (puedeArchivar en Cerveza.jsx = ROLE_ADMIN en SecurityConfig). Leer es para
 * todos: cada integrante ve su historial en el perfil.
 */
@Service
@PreAuthorize("hasRole('ADMIN')")
public class BeerPaymentService
        implements BaseEntityService<BeerPaymentRequest, BeerPaymentResponse, BeerPaymentPatch> {

    private final BeerPaymentRepository repository;

    public BeerPaymentService(BeerPaymentRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<BeerPaymentResponse> list(ListQuery query) {
        return repository
                .findAll(Filters.<BeerPayment>byEquality(query.filters()), query.toPageable(BeerPayment.class))
                .map(BeerPaymentResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public BeerPaymentResponse get(String id) {
        return BeerPaymentResponse.from(find(id));
    }

    @Override
    @Transactional
    public BeerPaymentResponse insert(BeerPaymentRequest request) {
        return BeerPaymentResponse.from(repository.saveAndFlush(toEntity(request)));
    }

    @Override
    @Transactional
    public List<BeerPaymentResponse> bulkInsert(List<BeerPaymentRequest> request) {
        List<BeerPayment> payments = request.stream().map(BeerPaymentService::toEntity).toList();
        return repository.saveAllAndFlush(payments).stream().map(BeerPaymentResponse::from).toList();
    }

    @Override
    @Transactional
    public BeerPaymentResponse update(String id, BeerPaymentPatch changes) {
        BeerPayment payment = find(id);
        payment.applyChanges(changes);
        return BeerPaymentResponse.from(payment);
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

    private BeerPayment find(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se ha encontrado el pago"));
    }

    private static BeerPayment toEntity(BeerPaymentRequest request) {
        return new BeerPayment(request.memberId(), request.amount(), request.date(), request.notes());
    }
}
