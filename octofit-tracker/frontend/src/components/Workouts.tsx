import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = {
  _id?: string;
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason?: string;
};

type ApiResponse = { suggestions: Workout[] };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<ApiResponse>('/api/workouts/suggestions/mona@example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <div role="alert" className="alert alert-danger">
            Unable to load suggestions: {error}
          </div>
        </div>
      </section>
    );
  }

  if (suggestions === null) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p role="status">Loading...</p>
        </div>
      </section>
    );
  }

  if (suggestions.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>No workout suggestions. Recommend workouts from activity patterns.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <ul className="list-unstyled">
          {suggestions.map((workout) => (
            <li key={workout._id} className="mb-3">
              <strong>{workout.title}</strong>
              <div className="small text-muted">
                <div>Focus: {workout.focus}</div>
                <div>Duration: {workout.minutes} min</div>
                <div>Difficulty: {workout.difficulty}</div>
                {workout.reason && <div className="mt-1">{workout.reason}</div>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
