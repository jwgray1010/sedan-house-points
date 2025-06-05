import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Sedan Behavior Tracker title', () => {
  render(<App />);
  // Use findByText for async rendering (React Router may delay rendering)
  const titleElement = screen.getByText(/Sedan Behavior Tracker/i);
  expect(titleElement).toBeInTheDocument();
});

// SUGGESTIONS:
// 1. If your title is rendered asynchronously (e.g., after routing), use findByText:
//    const titleElement = await screen.findByText(/Sedan Behavior Tracker/i);
// 2. Add more tests for navigation and page rendering, e.g.:
//    test('renders Dashboard page', () => {
//      render(<App />);
//      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
//    });
// 3. If your app uses context/providers, wrap <App /> in those providers in your test.
// 4. For better coverage, test navigation using user-event:
//    import userEvent from '@testing-library/user-event';
//    // Simulate clicking a nav link and check the new page content.
