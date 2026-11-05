import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { makeIdea, makePage, renderWithProviders } from '@/test/utils';
import App from './App';

describe('App', () => {
  it('renders the home page with the form and the list, and no pixel art link', async () => {
    server.use(http.get('/api/ideas', () => HttpResponse.json(makePage([makeIdea({ description: 'Listed idea' })]))));
    renderWithProviders(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Programming requests' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(await screen.findByText('Listed idea')).toBeInTheDocument();
    expect(screen.queryByText('Pixel Art')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Home' }).length).toBeGreaterThan(0);
  });
});
