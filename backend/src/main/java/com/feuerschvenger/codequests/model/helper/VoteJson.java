package com.feuerschvenger.codequests.model.helper;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VoteJson {
    private Long requestId;
    private String ipAddress;
    private int value;
}
