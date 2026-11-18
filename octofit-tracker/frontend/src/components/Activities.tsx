import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  _id: string;
  user?: string;
  team?: string;
  type: string;
  minutes: number;
  points: number;
  occurredAt?: string;
};

type ApiResponse = { activities: Activity[] };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<ApiResponse>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <div role="alert" className="alert alert-danger">
            Unable to load activities: {error}
          </div>
        </div>
      </section>
    );
  }

  if (activities === null) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p role="status">Loading...</p>
        </div>
      </section>
    );
  }

  if (activities.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>No activities yet. Track student activity minutes and points.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <ul className="list-unstyled">
          {activities.map((activity) => (
            <li key={activity._id} className="mb-2">
              <strong>{activity.type}</strong> - {activity.minutes} min ({activity.points} points)
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
