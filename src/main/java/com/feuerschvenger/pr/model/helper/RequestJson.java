package com.feuerschvenger.pr.model.helper;

import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;

@Getter
@Setter
public class RequestJson {
    private String author;
    private Timestamp date;
    private String description;
    private int upVotes;
}
