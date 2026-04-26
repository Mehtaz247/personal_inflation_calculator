import pandas as pd
import json
import os

# Define SUBGROUP_SPECS keys to match names
# The keys in the UI are: 'food_and_beverages', 'pan_tobacco_and_intoxicants', etc.
# But we can just use the Division code (01, 02, etc) or Division Name.
# The `SUBGROUP_SPECS` has `code` field. Let's map it by Division code since it's robust.

df = pd.read_excel('cpi_weights.xlsx', sheet_name='Division')

# Columns: State, State name, Sector, Division, Division name, weight
# Sectors: 'Rural', 'Urban', 'Combined'
sector_map = {'Rural': 'rural', 'Urban': 'urban', 'Combined': 'combined'}

output = {}
for index, row in df.iterrows():
    state_code = int(row['State'])
    sector_raw = row['Sector']
    if sector_raw not in sector_map: continue
    sector = sector_map[sector_raw]
    div_code = str(row['Division']).zfill(2)
    weight = float(row['weight'])
    
    if state_code not in output:
        output[state_code] = {}
    if sector not in output[state_code]:
        output[state_code][sector] = {}
    
    output[state_code][sector][div_code] = weight / 100.0  # store as percentage fraction

os.makedirs('data/cpi', exist_ok=True)
with open('data/cpi/state_weights.json', 'w') as f:
    json.dump(output, f, indent=2)

print("Created data/cpi/state_weights.json")
