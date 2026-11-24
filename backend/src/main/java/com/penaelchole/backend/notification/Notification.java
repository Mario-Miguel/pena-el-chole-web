package com.penaelchole.backend.notification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.penaelchole.backend.common.ApiName;
import com.penaelchole.backend.common.BaseEntity;
import com.penaelchole.backend.common.NotFilterable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class Notification extends BaseEntity {

    @ApiName("archivada")
    @Column(nullable = false)
    private boolean archived;

    @ApiName("fecha_archivo")
    private Instant archiveDate;

    @ApiName("fecha_publicacion")
    @Column(nullable = false)
    private Instant publishDate;

    @ApiName("leida_por")
    @NotFilterable
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<String> readBy;

    @ApiName("mensaje")
    private String message;

    @ApiName("tipo")
    @Column(nullable = false)
    private String type;

    @ApiName("titulo")
    @Column(nullable = false)
    private String title;

    protected Notification() {
    }

    public Notification(
            boolean archived,
            Instant archiveDate,
            Instant publishDate,
            List<String> readBy,
            String message,
            String type,
            String title) {
        this.archived = archived;
        this.archiveDate = archiveDate;
        this.publishDate = publishDate;
        this.readBy = readBy == null ? new ArrayList<>() : new ArrayList<>(new LinkedHashSet<>(readBy));
        this.message = message;
        this.type = type;
        this.title = title;
    }

    public boolean getArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public Instant getArchiveDate() {
        return archiveDate;
    }

    public void setArchiveDate(Instant archiveDate) {
        this.archiveDate = archiveDate;
    }

    public Instant getPublishDate() {
        return publishDate;
    }

    public void setPublishDate(Instant publishDate) {
        this.publishDate = publishDate;
    }

    public List<String> getReadBy() {
        return List.copyOf(readBy);
    }

    public void setReadBy(List<String> readBy) {
        this.readBy = new ArrayList<>(readBy);
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void applyChanges(NotificationPatch changes) {
        if (changes.title() != null && !changes.title().map(title::equals).orElse(false)) {
            throw new IllegalArgumentException("El titulo no se puede modificar");
        }

        if (changes.type() != null && !changes.type().map(type::equals).orElse(false)) {
            throw new IllegalArgumentException("El tipo no se puede modificar");
        }

        if (changes.message() != null && !changes.message().map(message::equals).orElse(false)) {
            throw new IllegalArgumentException("El mensaje no se puede modificar");
        }

        if (changes.publishDate() != null && !changes.publishDate().map(publishDate::equals).orElse(false)) {
            throw new IllegalArgumentException("La fecha de publicación no se puede modificar");
        }

        if (changes.archived() != null) {
            setArchived(changes.archived().orElse(this.archived));
        }

        if (changes.archiveDate() != null) {
            setArchiveDate(changes.archiveDate().orElse(null));
        }

        if (changes.readBy() != null) {
            List<String> ids = changes.readBy().orElse(List.of());
            this.readBy = new ArrayList<>(new LinkedHashSet<>(ids));
        }
    }
}
