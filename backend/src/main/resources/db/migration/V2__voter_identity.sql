-- Voter identity and score model.
--
-- Votes used to be keyed by a raw client IP address. They are now keyed by an HMAC of the IP, which the application computes with a secret, so the existing rows cannot be converted. They are discarded and every idea score is reset to match, which keeps score equal to the sum of its votes.
-- The migration runs on an empty or a populated V1 schema.

-- ideas: normalise legacy rows so the stricter column definitions below apply cleanly.
UPDATE ideas SET `date` = CURRENT_TIMESTAMP(6) WHERE `date` IS NULL;
UPDATE ideas SET description = '' WHERE description IS NULL;
UPDATE ideas SET author = NULL WHERE author IS NOT NULL AND TRIM(author) = '';
UPDATE ideas SET author = LEFT(TRIM(author), 60) WHERE author IS NOT NULL;
UPDATE ideas SET up_votes = 0;

ALTER TABLE ideas
    CHANGE COLUMN `date` created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CHANGE COLUMN up_votes score INT NOT NULL DEFAULT 0,
    MODIFY COLUMN author VARCHAR(60) NULL,
    MODIFY COLUMN description VARCHAR(1000) NOT NULL,
    ADD INDEX idx_ideas_created_at (created_at, id),
    ADD INDEX idx_ideas_score (score, created_at, id);

-- votes: one row per voter and idea.
DELETE FROM votes;

ALTER TABLE votes DROP FOREIGN KEY fk_votes_idea;

-- MySQL created this index for the old foreign key. The unique index below serves lookups by idea_id, so it is redundant.
ALTER TABLE votes DROP INDEX fk_votes_idea;

ALTER TABLE votes
    DROP COLUMN ip_address,
    ADD COLUMN voter_hash BINARY(32) NOT NULL AFTER id,
    MODIFY COLUMN idea_id BIGINT NOT NULL,
    ADD COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ADD COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    ADD CONSTRAINT uq_votes_idea_voter UNIQUE (idea_id, voter_hash),
    ADD CONSTRAINT chk_votes_value CHECK (value IN (-1, 1)),
    ADD CONSTRAINT fk_votes_idea FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE;
