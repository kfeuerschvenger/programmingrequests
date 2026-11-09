import { describe, expect, it } from 'vitest';
import { voteAnnouncement } from '@/hooks/useVote';
import { makeIdea } from '@/test/utils';
import { announce, clearAnnouncement, firstWords, getAnnouncement } from './announcer';

describe('announcer', () => {
  it('keeps the latest sentence and a new nonce each time, so a repeat is read out again', () => {
    announce('Same');
    const first = getAnnouncement();
    announce('Same');

    expect(getAnnouncement().text).toBe('Same');
    expect(getAnnouncement().nonce).toBeGreaterThan(first.nonce);

    clearAnnouncement();
    expect(getAnnouncement().text).toBe('');
  });

  it('keeps the first words of a quest', () => {
    expect(firstWords('  one two   three four five six seven eight ')).toBe('one two three four five six');
    expect(firstWords('short')).toBe('short');
  });
});

describe('voteAnnouncement', () => {
  const idea = makeIdea({ description: 'Build a tiny dungeon crawler in the terminal.', score: 13 });

  it('names the quest and the score for each result', () => {
    expect(voteAnnouncement({ ...idea, myVote: 1 })).toBe('You backed: Build a tiny dungeon crawler in. Score 13.');
    expect(voteAnnouncement({ ...idea, myVote: -1 })).toBe('You rejected: Build a tiny dungeon crawler in. Score 13.');
    expect(voteAnnouncement({ ...idea, myVote: 0 })).toBe(
      'You withdrew your vote on: Build a tiny dungeon crawler in. Score 13.',
    );
  });
});
