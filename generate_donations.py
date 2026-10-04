import pandas as pd
import random

# -----------------------------
# SETTINGS
# -----------------------------
random.seed(42)

SOURCE_FILE = "blood_donor_dataset.csv"
FINAL_DONOR_FILE = "donors-final.csv"
OUTPUT_FILE = "donation_import.sql"

BLOOD_BANK_COUNT = 2823
CUTOFF_DATE = pd.Timestamp("2025-06-30")
FLOOR_DATE = pd.Timestamp("2015-07-01")

# -----------------------------
# LOAD DATA
# -----------------------------
src = pd.read_csv(SOURCE_FILE, dtype=str).fillna("")
final_donors = pd.read_csv(FINAL_DONOR_FILE, dtype=str).fillna("")

assert len(src) == len(final_donors), \
    "Source and final donor files have different row counts."

print("Donors:", len(src))

# -----------------------------
# GENERATE SQL
# -----------------------------
f = open(OUTPUT_FILE, "w", encoding="utf-8")

f.write("USE aero_blood;\n\n")

batch = []
batch_size = 1000
total = 0

blood_banks = list(range(1, BLOOD_BANK_COUNT + 1))

for i in range(len(src)):

    donation_count = int(src.loc[i, "number_of_donation"])

    if donation_count == 0:
        continue

    donor_email = final_donors.loc[i, "email"]
    blood_group = src.loc[i, "blood_group"]

    registration_date = pd.Timestamp(src.loc[i, "created_at"])
    months = int(src.loc[i, "months_since_first_donation"])

    # Determine historical period
    if months > 0:

        first_date = registration_date
        last_date = registration_date + pd.DateOffset(months=months)

        if last_date > CUTOFF_DATE:
            last_date = CUTOFF_DATE

    else:

        # Handle donors whose source contains
        # donation history but months_since_first_donation = 0.
        first_date = registration_date
        last_date = min(
            registration_date + pd.Timedelta(days=365),
            CUTOFF_DATE
        )

    # Make sure the range is valid
    if first_date > last_date:
        first_date = last_date

    date_range = (last_date - first_date).days

    # Generate individual donation records
    for _ in range(donation_count):

        if date_range > 0:
            random_days = random.randint(0, date_range)
            donation_date = first_date + pd.Timedelta(days=random_days)
        else:
            donation_date = first_date

        # Safety limits
        if donation_date < FLOOR_DATE:
            donation_date = FLOOR_DATE

        if donation_date > CUTOFF_DATE:
            donation_date = CUTOFF_DATE

        donation_date = donation_date.strftime("%Y-%m-%d")

        blood_bank_id = random.choice(blood_banks)

        donor_email_sql = donor_email.replace("'", "''")
        blood_group_sql = blood_group.replace("'", "''")

        row = (
            "('" +
            donor_email_sql +
            "','" +
            blood_group_sql +
            "'," +
            str(blood_bank_id) +
            ",'" +
            donation_date +
            "','ELIGIBLE','PASSED',NULL)"
        )

        batch.append(row)
        total += 1

        # Write every 1000 records
        if len(batch) >= batch_size:

            f.write(
                "INSERT INTO donation_staging "
                "(donor_email,blood_group,blood_bank_id,donation_date,"
                "eligibility_status,screening_status,remarks) VALUES\n"
            )

            f.write(",\n".join(batch))
            f.write(";\n\n")

            batch = []

# -----------------------------
# WRITE REMAINING RECORDS
# -----------------------------
if batch:

    f.write(
        "INSERT INTO donation_staging "
        "(donor_email,blood_group,blood_bank_id,donation_date,"
        "eligibility_status,screening_status,remarks) VALUES\n"
    )

    f.write(",\n".join(batch))
    f.write(";\n")

f.close()

# -----------------------------
# FINAL VERIFICATION
# -----------------------------
expected = int(
    pd.to_numeric(src["number_of_donation"]).sum()
)

print("--------------------------------")
print("Donation SQL generation complete")
print("Donation records generated:", total)
print("Expected:", expected)
print("Match:", total == expected)
print("Output file:", OUTPUT_FILE)