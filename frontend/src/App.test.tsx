import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { makeIdea, makePage, renderWithProviders } from '@/test/utils';
import App from './App';

describe('App', () => {
  it('renders the landmarks, the tagline, the form and the board', async () => {
    server.use(http.get('/api/ideas', () => HttpResponse.json(makePage([makeIdea({ description: 'Listed idea' })]))));
    renderWithProviders(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Code Quests' })).toBeInTheDocument();
    expect(screen.getByText('Post a quest.')).toBeInTheDocument();
    expect(screen.getByText('Let the hero code.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post the quest' })).toBeInTheDocument();
    expect(await screen.findByText('Listed idea')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'The Quest Board' })).toBeInTheDocument();
  });

  it('offers a skip link to the main landmark and a home link on the brand', () => {
    server.use(http.get('/api/ideas', () => HttpResponse.json(makePage([]))));
    renderWithProviders(<App />);

    expect(screen.getByRole('link', { name: 'Skip to the quest board' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('link', { name: 'Code Quests' })).toHaveAttribute('href', '/');
  });
});
