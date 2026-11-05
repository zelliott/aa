import { useEffect, useState, type FormEvent } from 'react';
import { api, type Household, type Member, type User } from '../api';

export function HouseholdPanel({
  household,
  currentUser,
  onCreated,
}: {
  household: Household;
  currentUser: User;
  onCreated: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.household(household.id).then((r) => setMembers(r.members));
  }, [household.id]);

  const invite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get('email'));
    setError(null);
    try {
      const r = await api.invite(household.id, email);
      setMembers(r.members);
      form.reset();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const create = async () => {
    const name = prompt('Name for the new household');
    if (!name) return;
    await api.createHousehold(name);
    onCreated();
  };

  return (
    <div className="card">
      <h2>{household.name}</h2>
      <ul className="members">
        {members.map((m) => (
          <li key={m.id}>
            {m.name} <span className="muted">{m.email}</span>
            {m.id === household.owner_id && <span className="badge">owner</span>}
          </li>
        ))}
      </ul>
      {household.owner_id === currentUser.id && (
        <form onSubmit={invite} className="inline">
          <input name="email" type="email" placeholder="Invite by email" required />
          <button type="submit">Invite</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      <button className="link" onClick={create}>
        New household
      </button>
    </div>
  );
}
