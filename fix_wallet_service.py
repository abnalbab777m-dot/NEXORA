import re
content = open("server/services/wallet.service.ts").read()
# Replace .toString() for numbers
content = content.replace("newAvailable.toString()", "newAvailable")
content = content.replace("newPending.toString()", "newPending")
content = content.replace("newEarnings.toString()", "newEarnings")
content = content.replace("newDeposits.toString()", "newDeposits")
content = content.replace("newWithdrawals.toString()", "newWithdrawals")
content = content.replace("amount.toString()", "amount")
content = content.replace("currentAvailable.toString()", "currentAvailable")

# Replace FOR UPDATE which SQLite doesn't support
# SQLite uses DB-level locking, so FOR UPDATE is invalid.
content = content.replace("FOR UPDATE", "")

open("server/services/wallet.service.ts", "w").write(content)
