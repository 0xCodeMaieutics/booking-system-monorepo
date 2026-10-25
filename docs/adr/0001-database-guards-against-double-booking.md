# The database guards against double booking

Two Patients can see the same Available Slot and confirm within the same second, so an application-level "is it still free?" check cannot be trusted on its own. A Postgres exclusion constraint on Appointments rejects any two Booked Appointments for the same Practitioner whose time ranges overlap; the application still checks first to give a friendly message, but the constraint is what guarantees correctness. This applies to Admins too: an Admin override can book outside Available Slots, but never double-books a Practitioner.

## Consequences

- Appointments store their own start and end (not just a Treatment reference), so the constraint does not depend on a Treatment's current duration.
- Cancelled, Completed and No-show Appointments are excluded from the constraint; only Booked ones hold time.
- Requires the `btree_gist` extension.
