import os
import glob
import re

for filepath in glob.glob("server/controllers/*.ts"):
    with open(filepath, "r") as f:
        content = f.read()

    # Generic replacements
    content = content.replace("reward.toString()", "reward")
    content = content.replace("reward?.toString()", "reward")
    content = content.replace("newAvailable.toString()", "newAvailable")
    content = content.replace("absAmount.toString()", "absAmount")
    content = content.replace("currentAvailable.toString()", "currentAvailable")
    content = content.replace("price.toString()", "price")
    content = content.replace("updates.price = updates.price.toString();", "updates.price = updates.price;")
    content = content.replace("amount.toString()", "amount")
    content = content.replace("(available - amount).toString()", "(available - amount)")
    content = content.replace("parseFloat(wallet.pendingBalance as string)", "wallet.pendingBalance")
    content = content.replace("(parseFloat(wallet.pendingBalance) + amount).toString()", "(wallet.pendingBalance + amount)")
    content = content.replace("(wallet.pendingBalance + amount).toString()", "(wallet.pendingBalance + amount)")

    with open(filepath, "w") as f:
        f.write(content)

