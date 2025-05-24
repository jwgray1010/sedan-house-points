import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Sedan Behavior Tracker title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Sedan Behavior Tracker/i);
  expect(titleElement).toBeInTheDocument();
});
