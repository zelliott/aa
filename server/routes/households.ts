import { Router } from 'express';
import type { Database } from '../db.js';
import { requireMember } from '../middleware/auth.js';
import {
  addMember,
  createHousehold,
  findHousehold,
  householdsForUser,
  listMembers,
  removeMember,
} from '../lib/households.js';
import { findUserByEmail } from '../lib/users.js';

export function householdsRouter(db: Database): Router {
  const router = Router();

  router.get('/', (req, res) => {
    res.json({ households: householdsForUser(db, req.user!.id) });
  });

  router.post('/', (req, res) => {
    const name = req.body?.name;
    if (typeof name !== 'string' || !name.trim() || name.length > 80) {
      res.status(400).json({ error: 'Give the household a name' });
      return;
    }
    res.status(201).json({ household: createHousehold(db, name, req.user!.id) });
  });

  router.get('/:householdId', requireMember(db), (req, res) => {
    const id = Number(req.params.householdId);
    res.json({ household: findHousehold(db, id), members: listMembers(db, id) });
  });

  router.post('/:householdId/members', requireMember(db), (req, res) => {
    const household = findHousehold(db, Number(req.params.householdId))!;
    if (household.owner_id !== req.user!.id) {
      res.status(403).json({ error: 'Only the owner can invite people' });
      return;
    }
    const email = req.body?.email;
    const invitee = typeof email === 'string' ? findUserByEmail(db, email) : undefined;
    if (!invitee) {
      res.status(404).json({ error: 'No account with that email' });
      return;
    }
    addMember(db, household.id, invitee.id);
    res.status(201).json({ members: listMembers(db, household.id) });
  });

  router.delete('/:householdId/members/:userId', requireMember(db), (req, res) => {
    const household = findHousehold(db, Number(req.params.householdId))!;
    const userId = Number(req.params.userId);
    const isSelf = userId === req.user!.id;
    if (household.owner_id !== req.user!.id && !isSelf) {
      res.status(403).json({ error: 'Only the owner can remove people' });
      return;
    }
    if (userId === household.owner_id) {
      res.status(400).json({ error: 'The owner cannot leave the household' });
      return;
    }
    removeMember(db, household.id, userId);
    res.status(204).end();
  });

  return router;
}
