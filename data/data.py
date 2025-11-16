import argparse
from pathlib import Path


def clean_csv(input_path: Path, output_path: Path) -> None:
    try:
        import pandas as pd
    except ImportError as e:
        raise SystemExit(
            "pandas is required. Install with: pip install pandas"
        ) from e

    input_path = Path(input_path)
    output_path = Path(output_path)

    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    # Load CSV robustly: handle BOM and fallback to delimiter sniffing if needed
    try:
        df = pd.read_csv(input_path, encoding="utf-8-sig")
    except pd.errors.ParserError:
        df = pd.read_csv(
            input_path,
            sep=None,  # let pandas sniff the delimiter
            engine="python",  # more tolerant parser
            encoding="utf-8-sig",
            on_bad_lines="skip",
        )
    # Optionally combine the last two columns by taking the one that isn't -999
    # This happens before cleaning, so the combined value participates in the check.
    if df.shape[1] >= 3:  # needs at least date + two data cols
        import pandas as pd
        last_two = list(df.columns[-2:])
        col_a, col_b = last_two[0], last_two[1]

        def is_neg999(series):
            num_eq = pd.to_numeric(series, errors="coerce").eq(-999)
            str_eq = series.astype(str).str.strip().eq("-999")
            return num_eq | str_eq

        a = df[col_a]
        b = df[col_b]
        a_neg = is_neg999(a)
        b_neg = is_neg999(b)

        # Prefer A when it's valid; otherwise take B. If both invalid, result stays -999 from B.
        combined = a.where(~a_neg, b)
        df[col_a] = combined
        df.drop(columns=[col_b], inplace=True)

    # Drop rows where all non-date columns equal -999 (numeric or string)
    if df.shape[1] <= 1:
        cleaned_df = df.copy()
    else:
        data_cols = df.columns[1:]
        num_eq = df[data_cols].apply(pd.to_numeric, errors="coerce").eq(-999)
        str_eq = df[data_cols].astype(str).apply(lambda c: c.str.strip().eq("-999"))
        all_neg = (num_eq | str_eq).all(axis=1)
        cleaned_df = df.loc[~all_neg].copy()

    total_rows = len(df)
    kept_rows = len(cleaned_df)

    cleaned_df.to_csv(output_path, index=False)

    print(
        f"Wrote cleaned CSV to {output_path} (kept {kept_rows} of {total_rows} data rows)"
    )


def main():
    parser = argparse.ArgumentParser(
        description="Remove rows where all non-date columns equal -999."
    )
    parser.add_argument(
        "-i",
        "--input",
        type=Path,
        default=Path("visibility.csv"),
        help="Path to input CSV (default: data/airQualityData.csv)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("visibility.csv"),
        help="Path to output CSV (default: data/airQualityData_clean.csv)",
    )

    args = parser.parse_args()
    clean_csv(args.input, args.output)


if __name__ == "__main__":
    main()
