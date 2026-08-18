# Nexora Firestore Schema

## Authentication
Authentication is handled via Firebase Auth. The `uid` matches the `userId` in the `users` and `wallets` collections.

## Collections

### 1. `users`
Stores user profile information.
- **userId** (string): The Firebase Auth UID.
- **username** (string): Unique username.
- **email** (string): User email address.
- **displayName** (string, optional): The user's displayed name.
- **phone** (string, optional): User phone number.
- **role** (string): User role (`'USER'` or `'ADMIN'`).
- **status** (string): Account status (`'ACTIVE'`, `'FROZEN'`, `'BANNED'`).
- **vipLevel** (number): The user's current VIP level (default `0`).
- **createdAt** (number): Timestamp of creation.
- **updatedAt** (number): Timestamp of last update.

### 2. `wallets`
Stores financial balances. Each user has exactly one wallet. Operations here are highly sensitive and must be atomic.
- **userId** (string): Matches the Auth UID and document ID.
- **availableBalance** (number): The balance currently available for withdrawal or purchasing VIP plans.
- **pendingBalance** (number): Balance currently tied up in pending withdrawal requests.
- **totalEarnings** (number): Total money earned all-time.
- **totalDeposits** (number): Total money deposited all-time.
- **totalWithdrawals** (number): Total money withdrawn all-time.
- **updatedAt** (number): Timestamp of last update.

### 3. `transactions`
Immutable ledger of financial operations to prevent double-spending.
- **transactionId** (string): Unique ID.
- **userId** (string): User associated with the transaction.
- **type** (string): `'DEPOSIT'`, `'WITHDRAWAL'`, `'TASK_REWARD'`, `'AD_REWARD'`, `'VIP_UPGRADE'`.
- **amount** (number): The monetary amount involved.
- **currency** (string): `'USD'`.
- **status** (string): `'PENDING'`, `'APPROVED'`, `'REJECTED'`, `'COMPLETED'`, `'CANCELLED'`.
- **description** (string): Human-readable description.
- **createdAt** (number): Timestamp of creation.

### 4. `tasks`
Available tasks that users can complete for rewards.
- **taskId** (string): Unique ID.
- **title** (string): Title of the task.
- **description** (string): Details about what must be done.
- **reward** (number): Monetary reward upon approval.
- **requiredVipLevel** (number): Minimum VIP level to attempt.
- **status** (string): `'ACTIVE'`, `'INACTIVE'`.

### 5. `taskCompletions`
Records of user task attempts.
- **completionId** (string): Unique ID.
- **taskId** (string): ID of the task.
- **userId** (string): ID of the user.
- **reward** (number): Amount requested as reward.
- **status** (string): `'PENDING'`, `'COMPLETED'`, `'REJECTED'`.
- **completedAt** (number): Timestamp.

### 6. `ads`
Available ads to watch for rewards.
- **adId** (string): Unique ID.
- **title** (string): Ad title.
- **reward** (number): Reward amount.
- **durationSeconds** (number): Wait time required.
- **requiredVipLevel** (number): Minimum VIP level to watch.
- **status** (string): `'ACTIVE'`, `'INACTIVE'`.

### 7. `adCompletions`
Records of user ad watches.
- **completionId** (string): Unique ID.
- **adId** (string): ID of the ad.
- **userId** (string): ID of the user.
- **reward** (number): Amount requested as reward.
- **status** (string): `'PENDING'`, `'COMPLETED'`, `'REJECTED'`.
- **completedAt** (number): Timestamp.

### 8. `notifications` (New)
Stores alerts for the user.
- **notificationId** (string): Unique ID.
- **userId** (string): ID of the user.
- **title** (string): Title of the notification.
- **message** (string): Detailed message.
- **type** (string): `'SUCCESS'`, `'WARNING'`, `'INFO'`, `'ERROR'`.
- **read** (boolean): Flag indicating if the notification has been read.
- **createdAt** (number): Timestamp.

## Security Rules
Data access is restricted by Firebase rules in `firestore.rules`.
- `users`: Users can read their own. Admin can read/write all.
- `wallets`: Users can read their own. Admin can read/write all.
- `transactions`: Users can read their own, can create `PENDING` transactions. Admin can update.
- `notifications`: Users can read and update (mark read) their own. Admin can create/write all.

## Atomicity & Preventing Double Spending
Financial operations MUST use `runTransaction` to ensure atomicity. When an admin approves a withdrawal, the system subtracts from `pendingBalance` and adds to `totalWithdrawals`. When an admin approves a task, the system adds to `availableBalance` and `totalEarnings`.
