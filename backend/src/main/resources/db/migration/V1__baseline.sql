-- Baseline schema, matching the Idea and Vote entities.

CREATE TABLE ideas (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    author      VARCHAR(255) NULL,
    date        DATETIME(6)  NULL,
    description VARCHAR(255) NULL,
    up_votes    INT          NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE votes (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    ip_address VARCHAR(255) NOT NULL,
    value      INT          NOT NULL,
    idea_id    BIGINT       NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_votes_idea FOREIGN KEY (idea_id) REFERENCES ideas (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
