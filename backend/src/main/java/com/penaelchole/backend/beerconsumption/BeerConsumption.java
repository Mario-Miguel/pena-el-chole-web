package com.penaelchole.backend.beerconsumption;

import com.penaelchole.backend.common.ApiName;
import com.penaelchole.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

/**
 * Una o varias cervezas apuntadas a un integrante. Las cervezas de alguien son
 * la suma de "quantity" de sus consumos sin archivar.
 */
@Entity
public class BeerConsumption extends BaseEntity {

    @ApiName("cantidad")
    @Column(nullable = false)
    private int quantity;

    /** id del Integrante (tabla member). null = invitados. */
    @ApiName("integrante_id")
    private String memberId;

    @ApiName("tipo")
    private String type;

    @ApiName("archivado")
    @Column(nullable = false)
    private boolean archived;

    @ApiName("anio_archivo")
    private Integer archiveYear;

    protected BeerConsumption() {
    }

    public BeerConsumption(int quantity, String memberId, String type) {
        this.quantity = checkQuantity(quantity);
        this.memberId = checkMemberId(memberId);
        this.type = type;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = checkQuantity(quantity);
    }

    public String getMemberId() {
        return memberId;
    }

    public void setMemberId(String memberId) {
        this.memberId = checkMemberId(memberId);
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public Integer getArchiveYear() {
        return archiveYear;
    }

    public void setArchiveYear(Integer archiveYear) {
        this.archiveYear = archiveYear;
    }

    // null = el campo no venía en el JSON (no se toca)
    // Optional.empty() = venía con valor null
    public void applyChanges(BeerConsumptionPatch changes) {
        if (changes.quantity() != null) {
            setQuantity(changes.quantity()
                    .orElseThrow(() -> new IllegalArgumentException("La cantidad no puede estar vacía")));
        }

        if (changes.memberId() != null) {
            setMemberId(changes.memberId().orElse(null));
        }

        if (changes.type() != null) {
            setType(changes.type().orElse(null));
        }

        if (changes.archived() != null) {
            setArchived(changes.archived().orElse(false));
        }

        if (changes.archiveYear() != null) {
            setArchiveYear(changes.archiveYear().orElse(null));
        }
    }

    private static int checkQuantity(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("La cantidad tiene que ser mayor que 0");
        }
        return quantity;
    }

    // null está permitido (invitados), pero "" no: sería un error del cliente
    private static String checkMemberId(String memberId) {
        if (memberId != null && memberId.isBlank()) {
            throw new IllegalArgumentException("El integrante no puede estar vacío");
        }
        return memberId;
    }
}
