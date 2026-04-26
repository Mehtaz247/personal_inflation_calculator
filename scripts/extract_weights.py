import pandas as pd
import json
import os

# Build state_weights.json keyed by the MoSPI eSankhyiki *API* state_code,
# not the codes used inside the source xlsx (which differ).
API_STATE_CODE = {
    "All India": 0,
    "Andaman And Nicobar Islands": 2,
    "Andhra Pradesh": 3,
    "Arunachal Pradesh": 4,
    "Assam": 5,
    "Bihar": 6,
    "Chandigarh": 7,
    "Chhattisgarh": 8,
    "Goa": 9,
    "Gujarat": 10,
    "Haryana": 11,
    "Himachal Pradesh": 12,
    "Jammu And Kashmir": 13,
    "Jharkhand": 14,
    "Karnataka": 15,
    "Kerala": 16,
    "Ladakh": 17,
    "Lakshadweep": 18,
    "Madhya Pradesh": 19,
    "Maharashtra": 20,
    "Manipur": 21,
    "Meghalaya": 22,
    "Mizoram": 23,
    "Nagaland": 24,
    "NCT of Delhi": 25,
    "Odisha": 26,
    "Puducherry": 27,
    "Punjab": 28,
    "Rajasthan": 29,
    "Sikkim": 30,
    "Tamil Nadu": 31,
    "Telangana": 32,
    "The Dadra And Nagar Haveli And Daman And Diu": 33,
    "Tripura": 34,
    "Uttar Pradesh": 35,
    "Uttarakhand": 36,
    "West Bengal": 37,
}

df = pd.read_excel('cpi_weights.xlsx', sheet_name='Division')
sector_map = {'Rural': 'rural', 'Urban': 'urban', 'Combined': 'combined'}

output = {}
unmapped = set()
for _, row in df.iterrows():
    name = str(row['State name']).strip()
    if name not in API_STATE_CODE:
        unmapped.add(name)
        continue
    sector_raw = row['Sector']
    if sector_raw not in sector_map:
        continue
    api_code = API_STATE_CODE[name]
    sector = sector_map[sector_raw]
    div_code = str(row['Division']).zfill(2)
    weight = float(row['weight']) / 100.0  # xlsx stores percent, store as fraction

    output.setdefault(api_code, {}).setdefault(sector, {})[div_code] = weight

if unmapped:
    print(f"Warning: unmapped state names: {sorted(unmapped)}")

# The xlsx column stores each state+sector cell as its share of the national CPI
# basket (so per-state sums are << 1). For the gap decomposition we need each
# division's weight as a fraction of that state's own basket — normalize so
# per-(state,sector) weights sum to 1.
for state, sectors in output.items():
    for sector, weights in sectors.items():
        s = sum(weights.values())
        if s > 0:
            for k in weights:
                weights[k] = weights[k] / s

os.makedirs('data/cpi', exist_ok=True)
with open('data/cpi/state_weights.json', 'w') as f:
    json.dump(output, f, indent=2, sort_keys=True)

print("Created data/cpi/state_weights.json keyed by MoSPI API state_code")
