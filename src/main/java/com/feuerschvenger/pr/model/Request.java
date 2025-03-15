package com.feuerschvenger.pr.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "requests")
public class Request {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String author = "Anónimo";

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Timestamp date;

    private String description = "";

    private int upVotes = 0;

    @PrePersist
    public void prePersist() {
        if (this.date == null) {
            this.date = new Timestamp(System.currentTimeMillis());
        }
    }

    public Request(String author, Timestamp date, String description, int upVotes) {
        this.author = author;
        this.date = date;
        this.description = description;
        this.upVotes = upVotes;
    }

}


