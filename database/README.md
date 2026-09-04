# Database migration target

The exact-parity v1 deliberately keeps the existing browser data engine unchanged so visual and functional parity can be verified first.
The next migration layer moves persistence and accounting transactions behind an API + PostgreSQL while keeping the UI contract stable.
