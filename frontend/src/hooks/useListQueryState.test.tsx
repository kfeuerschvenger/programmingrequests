import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useListQueryState } from './useListQueryState';

const setup = (route: string) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
  );
  return renderHook(() => ({ state: useListQueryState(), location: useLocation() }), { wrapper });
};

describe('useListQueryState', () => {
  it('defaults to newest', () => {
    expect(setup('/').result.current.state.sort).toBe('newest');
  });

  it('reads the sort from the URL', () => {
    expect(setup('/?sort=top').result.current.state.sort).toBe('top');
  });

  it('falls back to the default for an unknown value', () => {
    expect(setup('/?sort=nonsense').result.current.state.sort).toBe('newest');
  });

  it('writes a non-default sort to the URL and removes it for the default', () => {
    const { result } = setup('/?foo=1');

    act(() => result.current.state.setSort('oldest'));
    expect(result.current.location.search).toBe('?foo=1&sort=oldest');
    expect(result.current.state.sort).toBe('oldest');

    act(() => result.current.state.setSort('newest'));
    expect(result.current.location.search).toBe('?foo=1');
  });
});
