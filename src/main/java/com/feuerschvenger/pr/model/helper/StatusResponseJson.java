package com.feuerschvenger.pr.model.helper;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatusResponseJson {
    private Status status;
    private String title;
    private String message;

    public enum Status {
        OK, ERROR
    }

}
