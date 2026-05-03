"""
One-shot repair script for the corrupted Tailwind class output produced by
an earlier buggy run of `apply-dark-mode.py`.

Background
----------
The original `from-{hue}-50` / `to-{hue}-50` / `via-{hue}-50` rules were not
anchored with a `(?=[ "\n])` lookahead, so they greedily matched the `-50`
*prefix* inside `from-{hue}-500` (i.e. solid 500-tone gradients), splitting
the class as `from-{hue}-50` + `0` and emitting

    from-{hue}-50 dark:from-{hue}-500/10  +  the trailing `0`

which the runtime then stitched back into the broken token

    from-{hue}-50 dark:from-{hue}-500/100

The same happened on `to-` and `via-` stops. The visible result was:

* status badges and buttons that were *meant* to be solid 500-tone gradients
  rendered as light-pastel→dark-tinted gradients in dark mode (the "muted
  card" look on the Orders page),
* and a sprinkling of unreachable `/100` / `/50` opacity suffixes that
  Tailwind silently dropped.

Repair strategy
---------------
Restore the original solid-tone classes by collapsing the broken tokens:

    from-{hue}-50 dark:from-{hue}-500/100  →  from-{hue}-500
    to-{hue}-50   dark:to-{hue}-500/50     →  to-{hue}-500
    via-{hue}-50  dark:via-{hue}-500/(50|100) → via-{hue}-500

The script is idempotent — re-running it after a successful repair is a no-op.

Run with:  python scripts/repair-corrupted-gradients.py
"""
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(__file__), '..', 'src')

REPAIRS = [
    # `from-{hue}-50 dark:from-{hue}-500/100` was originally `from-{hue}-500`
    (re.compile(r'from-([a-z]+)-50 dark:from-\1-500/100'), r'from-\1-500'),
    # `to-{hue}-50 dark:to-{hue}-500/50` was originally `to-{hue}-500`
    (re.compile(r'to-([a-z]+)-50 dark:to-\1-500/50\b'), r'to-\1-500'),
    # `via-{hue}-50 dark:via-{hue}-500/{50|100}` was originally `via-{hue}-500`
    (re.compile(r'via-([a-z]+)-50 dark:via-\1-500/(?:50|100)\b'), r'via-\1-500'),
    # The `border-t` rule was applied to lines that already had it, producing
    # `border-slate-200 dark:border-slate-700 border-slate-200 dark:border-slate-700`.
    # Collapse repeats.
    (re.compile(r'(border-slate-200 dark:border-slate-700)(?:\s+\1)+'), r'\1'),
    (re.compile(r'(border-slate-100 dark:border-slate-800)(?:\s+\1)+'), r'\1'),
]


def patch(text: str) -> tuple[str, int]:
    fixes = 0
    for pattern, repl in REPAIRS:
        new_text, count = pattern.subn(repl, text)
        text = new_text
        fixes += count
    return text, fixes


def main() -> int:
    grand = 0
    touched = 0
    for dirpath, _dirs, files in os.walk(ROOT):
        for name in files:
            if not name.endswith(('.js', '.jsx')):
                continue
            path = os.path.join(dirpath, name)
            with open(path, 'r', encoding='utf-8') as fh:
                original = fh.read()
            new_text, fixes = patch(original)
            if fixes:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new_text)
                rel = os.path.relpath(path, ROOT)
                print(f'  {rel}: fixed={fixes}')
                grand += fixes
                touched += 1
    print(f'\nTotal repaired={grand} across {touched} files')
    return 0


if __name__ == '__main__':
    sys.exit(main())
