package com.feuerschvenger.codequests;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class CodeQuestsApplication {

	public static void main(String[] args) {
		SpringApplication.run(CodeQuestsApplication.class, args);
	}

}
