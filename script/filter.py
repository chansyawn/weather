import os
import tempfile
from typing import List, Set

import xarray as xr


VARIABLES_TO_KEEP: Set[str] = {"t2m", "u10", "v10", "tp6h"}


def filter_nc_file(path: str) -> None:
    try:
        ds = xr.open_dataset(path)
    except Exception as exc:
        print(f"[skip] Failed to open {path}: {exc}")
        return

    try:
        present_vars: Set[str] = set(map(str, ds.data_vars))
        keep_vars: List[str] = sorted(list(present_vars.intersection(VARIABLES_TO_KEEP)))

        if not keep_vars:
            print(f"[skip] No target variables found in {os.path.basename(path)}")
            ds.close()
            return

        subset = ds[keep_vars]

        # Reduce coordinate point density to 1/100 by sampling every 10th point
        # in both latitude and longitude dimensions
        if 'latitude' in subset.dims and 'longitude' in subset.dims:
            # Get the size of latitude and longitude dimensions
            lat_size = len(subset.latitude)
            lon_size = len(subset.longitude)
            
            # Sample every 10th point (reducing density to 1/100)
            lat_indices = slice(0, lat_size, 10)
            lon_indices = slice(0, lon_size, 10)
            
            subset = subset.isel(latitude=lat_indices, longitude=lon_indices)
            print(f"[info] Reduced coordinate density: lat {lat_size}->{len(subset.latitude)}, lon {lon_size}->{len(subset.longitude)}")

        # Write to a temporary file first for safety, then move to a new file (no in-place overwrite)
        dir_name = os.path.dirname(path)
        base_name = os.path.basename(path)
        tmp_fd, tmp_path = tempfile.mkstemp(prefix=f".tmp_{base_name}_", suffix=".nc", dir=dir_name)
        os.close(tmp_fd)

        try:
            subset.to_netcdf(tmp_path)
        finally:
            subset.close()
            ds.close()

        out_path = os.path.join(dir_name, f"filtered_{base_name}")
        os.replace(tmp_path, out_path)
        print(f"[ok] Wrote {os.path.basename(out_path)} -> kept {keep_vars}")
    except Exception as exc:
        print(f"[error] Failed processing {path}: {exc}")

        
if __name__ == "__main__":
    filter_nc_file("./data/2025-06-01T00_00_00_cn_flatted.nc")
