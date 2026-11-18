import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  _id?: string;
  name: string;
  mascot: string;
  members: string[];
};

type ApiResponse = { teams: Team[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<ApiResponse>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <div role="alert" className="alert alert-danger">
            Unable to load teams: {error}
          </div>
        </div>
      </section>
    );
  }

  if (teams === null) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p role="status">Loading...</p>
        </div>
      </section>
    );
  }

  if (teams.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>No teams yet. Manage teams and members.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <ul className="list-unstyled">
          {teams.map((team) => (
            <li key={team._id} className="mb-3">
              <strong>{team.name}</strong> ({team.mascot})
              {team.members.length > 0 && (
                <ul className="list-unstyled ms-3 small">
                  {team.members.map((member, i) => (
                    <li key={i}>{member}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
