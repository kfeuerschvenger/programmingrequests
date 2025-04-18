package com.feuerschvenger.pr.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "votes")
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;

    @Column(nullable = false)
    private String ipAddress;

    @Column(nullable = false)
    private int value;

    @ManyToOne
    @JoinColumn(name = "request_id")
    private Request request;

    public Vote(String ipAddress, int value, Request request) {
        this.ipAddress = ipAddress;
        this.value = value;
        this.request = request;
    }

    @Override
    public String toString() {
        return "Vote ID: " + id + ", ipAddress: " + ipAddress + ", value: " + value + ", request.id: " + request.getId();
    }
}
