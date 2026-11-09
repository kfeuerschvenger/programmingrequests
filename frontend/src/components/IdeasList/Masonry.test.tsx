import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Masonry, type MasonryItem } from './Masonry';

const quests = (count: number, from = 0): MasonryItem[] =>
  Array.from({ length: count }, (_, index) => ({ key: from + index, node: <p>{`Quest ${from + index}`}</p> }));

const decorations: MasonryItem[] = [{ key: 'paper', node: <span>paper</span>, decoration: true }];

const columnsOf = () => screen.getAllByRole('listitem', { hidden: true }).map(item => item.getAttribute('data-column'));

describe('Masonry', () => {
  let width = 1000;

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => 100);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    width = 1000;
  });

  it('lays three columns out left to right in the order of the list, keeping the DOM in that order', () => {
    render(<Masonry items={quests(7)} />);

    expect(columnsOf()).toEqual(['0', '1', '2', '0', '1', '2', '0']);
    expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual(
      Array.from({ length: 7 }, (_, index) => `Quest ${index}`),
    );
  });

  it('uses two columns on a medium board and one on a narrow one', () => {
    width = 700;
    const { unmount } = render(<Masonry items={quests(5)} />);
    expect(columnsOf()).toEqual(['0', '1', '0', '1', '0']);
    unmount();

    width = 400;
    render(<Masonry items={quests(3)} />);
    expect(columnsOf()).toEqual(['0', '0', '0']);
  });

  it('sizes every cell to its column and places it with a transform', () => {
    render(<Masonry items={quests(4)} gap={10} />);

    const [first, second, , fourth] = screen.getAllByRole('listitem');
    expect(first).toHaveStyle({ width: `${(1000 - 20) / 3}px` });
    expect(first?.style.transform).toBe('translate(0px, 0px)');
    expect(second?.style.transform).toBe(`translate(${(1000 - 20) / 3 + 10}px, 0px)`);
    expect(fourth?.style.transform).toBe('translate(0px, 110px)');
  });

  it('adds decorations on three columns only, hidden from assistive technology', () => {
    const items = [...quests(4), ...decorations];
    const { unmount } = render(<Masonry items={items} />);
    const paper = screen.getByText('paper').closest('li');
    expect(paper).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    unmount();

    width = 700;
    render(<Masonry items={items} />);
    expect(screen.queryByText('paper')).not.toBeInTheDocument();
  });

  it('does not move the quests already shown when more are appended', () => {
    const { rerender } = render(<Masonry items={quests(5)} />);
    const before = screen
      .getAllByRole('listitem')
      .map(item => [item.getAttribute('data-column'), item.style.transform]);

    rerender(<Masonry items={quests(10)} />);

    const after = screen.getAllByRole('listitem').map(item => [item.getAttribute('data-column'), item.style.transform]);
    expect(after.slice(0, 5)).toEqual(before);
    expect(after).toHaveLength(10);
  });
});
