# Source spreadsheets

Drop the master price-list workbooks here. `build_prices.py` reads them from
this folder and regenerates `../site/prices.json`.

Expected filenames (must match exactly — they are referenced in build_prices.py):

- `Master_price_list_Stonewater_com_pro_wef_01_04_2026.xlsx`
- `Kasper_Professional_Audio_Price_List_2026.xlsx`

To regenerate the catalogue after editing a sheet:

    cd stonewater-price-app
    pip install openpyxl        # one-time
    python build_prices.py      # writes site/prices.json
    git add site/prices.json data/*.xlsx
    git commit -m "Update prices"
    git push                    # Netlify redeploys automatically

If you add a NEW brand, also add its column-mapping block in build_prices.py.
