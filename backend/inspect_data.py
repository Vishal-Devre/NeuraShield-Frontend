import pandas as pd
import sys
import os

base_dir = r"C:\Users\LENOVO\Desktop\DOCS-Local\CodeVault\AIML_Lab\NeuraShield\backend"

def inspect():
    with open(os.path.join(base_dir, 'data_info.txt'), 'w', encoding='utf-8') as f:
        # Storms
        df_storm = pd.read_csv(os.path.join(base_dir, 'storms_2013.csv'), low_memory=False)
        f.write(f"Storms 2013 Columns:\n{df_storm.columns.tolist()}\n\n")
        f.write(f"Storms 2013 Head:\n{df_storm.head(2)}\n\n")

        # Volcanoes
        df_volc1 = pd.read_csv(os.path.join(base_dir, 'volcano.csv'), low_memory=False)
        f.write(f"Volcano Columns:\n{df_volc1.columns.tolist()}\n\n")
        f.write(f"Volcano Head:\n{df_volc1.head(2)}\n\n")
        
        df_volc2 = pd.read_csv(os.path.join(base_dir, 'The_Volcanoes_Of_Earth.csv'), low_memory=False)
        f.write(f"The Volcanoes Of Earth Columns:\n{df_volc2.columns.tolist()}\n\n")
        f.write(f"The Volcanoes Of Earth Head:\n{df_volc2.head(2)}\n\n")

if __name__ == '__main__':
    inspect()
