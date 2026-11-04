package com.feuerschvenger.codequests.config;

import com.feuerschvenger.codequests.model.IdeaSort;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Reads the {@code sort} request parameter against the whitelist in {@link IdeaSort}. Anything else fails the conversion, which the API reports as a 400.
 */
@Component
public class IdeaSortConverter implements Converter<String, IdeaSort> {

    @Override
    public IdeaSort convert(String source) {
        return IdeaSort.fromParam(source).orElseThrow(() -> new IllegalArgumentException("Unsupported sort"));
    }
}
