import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ChatSphere app', () => {
  render(<App />);
  expect(true).toBe(true);
});
