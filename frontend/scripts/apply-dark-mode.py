"""
One-shot helper to apply consistent Tailwind `dark:` variants to customer
and role-specific pages.

Idempotent: classes already followed by a `dark:` variant are skipped, and
classes already prefixed with `dark:` are not double-patched.

Run with:  python scripts/apply-dark-mode.py
"""
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(__file__), '..', 'src', 'pages')
TARGETS = [
    'Cart.js', 'Orders.js', 'Profile.js', 'AskDoctor.js', 'Chatbot.js', 'MedicalHistory.js',
    'admin/ManageUsers.js',
    'admin/ManageProducts.js',
    'admin/ManageOrders.js',
    'admin/ManageCategories.js',
    'admin/ManageBatches.js',
    'admin/ManageStockRequests.js',
    'doctor/DoctorQuestions.js',
    'doctor/PatientMedicalRecords.js',
    'manager/StockManagement.js',
]

# Cleanup pass: collapse any duplicated dark variants introduced by an earlier
# buggy run. e.g. `text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500`
# becomes `text-slate-400 dark:text-slate-500` (keep the first dark variant).
CLEANUP_RULES = [
    (r'((?:bg|text|border)-(?:slate|teal|white)-?\d*\s+dark:(?:bg|text|border)-(?:slate|teal|white)-?\d+(?:/\d+)?)(\s+dark:(?:bg|text|border)-(?:slate|teal|white)-?\d+(?:/\d+)?)+',
     r'\1'),
]

# Application rules — each pattern is anchored so it CANNOT match inside an
# already-patched `dark:text-slate-N` (negative lookbehind for `dark:`) and
# WON'T re-add a dark variant if one is already present (negative lookahead).
RULES = [
    # Page background — only when used as a min-h-screen wrapper
    (r'min-h-screen bg-slate-50(?!\s+dark:)', 'min-h-screen bg-slate-50 dark:bg-slate-950'),

    # Card / surface backgrounds — anchored to next-class space or end-of-attr quote
    (r'(?<![:\-])bg-white(?=[ "\n])(?!\s*dark:)', 'bg-white dark:bg-slate-900'),
    (r'(?<![:\-])bg-slate-50(?=[ "\n])(?!\s*dark:)(?!.*min-h-screen)', 'bg-slate-50 dark:bg-slate-800'),
    (r'(?<![:\-])bg-slate-100(?=[ "\n])(?!\s*dark:)', 'bg-slate-100 dark:bg-slate-800'),

    # Text — negative lookbehind prevents matching inside `dark:text-slate-N`
    (r'(?<!dark:)text-slate-800(?!\s*dark:)', 'text-slate-800 dark:text-slate-100'),
    (r'(?<!dark:)text-slate-700(?!\s*dark:)', 'text-slate-700 dark:text-slate-200'),
    (r'(?<!dark:)text-slate-600(?!\s*dark:)', 'text-slate-600 dark:text-slate-300'),
    (r'(?<!dark:)text-slate-500(?!\s*dark:)', 'text-slate-500 dark:text-slate-400'),
    (r'(?<!dark:)text-slate-400(?!\s*dark:)', 'text-slate-400 dark:text-slate-500'),

    # Borders
    (r'(?<!dark:)border-slate-100(?!\s*dark:)', 'border-slate-100 dark:border-slate-800'),
    (r'(?<!dark:)border-slate-200(?!\s*dark:)', 'border-slate-200 dark:border-slate-700'),

    # Brand accents
    (r'(?<!dark:)bg-teal-50(?=[ "\n])(?!\s*dark:)', 'bg-teal-50 dark:bg-teal-500/15'),
    (r'(?<!dark:)text-teal-700(?!\s*dark:)', 'text-teal-700 dark:text-teal-300'),
    (r'(?<!dark:)text-teal-600(?!\s*dark:)', 'text-teal-600 dark:text-teal-300'),

    # Gray equivalents — many older role-specific pages use `gray-*` instead of
    # `slate-*`. Map them to slate dark variants so the whole app is consistent.
    (r'(?<!dark:)text-gray-800(?!\s*dark:)', 'text-gray-800 dark:text-slate-100'),
    (r'(?<!dark:)text-gray-700(?!\s*dark:)', 'text-gray-700 dark:text-slate-200'),
    (r'(?<!dark:)text-gray-600(?!\s*dark:)', 'text-gray-600 dark:text-slate-300'),
    (r'(?<!dark:)text-gray-500(?!\s*dark:)', 'text-gray-500 dark:text-slate-400'),
    (r'(?<!dark:)text-gray-400(?!\s*dark:)', 'text-gray-400 dark:text-slate-500'),
    (r'(?<!dark:)text-gray-300(?!\s*dark:)', 'text-gray-300 dark:text-slate-600'),

    (r'(?<![:\-])bg-gray-50(?=[ "\n])(?!\s*dark:)', 'bg-gray-50 dark:bg-slate-800'),
    (r'(?<![:\-])bg-gray-100(?=[ "\n])(?!\s*dark:)', 'bg-gray-100 dark:bg-slate-800'),
    (r'(?<![:\-])bg-gray-200(?=[ "\n])(?!\s*dark:)', 'bg-gray-200 dark:bg-slate-700'),

    (r'(?<!dark:)border-gray-100(?!\s*dark:)', 'border-gray-100 dark:border-slate-800'),
    (r'(?<!dark:)border-gray-200(?!\s*dark:)', 'border-gray-200 dark:border-slate-700'),
    (r'(?<!dark:)border-gray-300(?!\s*dark:)', 'border-gray-300 dark:border-slate-600'),

    # Soft pastel row highlights used for status (red-50/yellow-50/green-50).
    # These should fall back to a tinted-dark equivalent so they don't blast
    # the eye in dark mode.
    (r'(?<![:\-])bg-red-50(?=[ "\n])(?!\s*dark:)', 'bg-red-50 dark:bg-red-500/10'),
    (r'(?<![:\-])bg-yellow-50(?=[ "\n])(?!\s*dark:)', 'bg-yellow-50 dark:bg-yellow-500/10'),
    (r'(?<![:\-])bg-green-50(?=[ "\n])(?!\s*dark:)', 'bg-green-50 dark:bg-green-500/10'),
    (r'(?<![:\-])bg-amber-50(?=[ "\n])(?!\s*dark:)', 'bg-amber-50 dark:bg-amber-500/10'),
    (r'(?<![:\-])bg-rose-50(?=[ "\n])(?!\s*dark:)', 'bg-rose-50 dark:bg-rose-500/10'),
    (r'(?<![:\-])bg-emerald-50(?=[ "\n])(?!\s*dark:)', 'bg-emerald-50 dark:bg-emerald-500/10'),
    (r'(?<![:\-])bg-cyan-50(?=[ "\n])(?!\s*dark:)', 'bg-cyan-50 dark:bg-cyan-500/10'),
    (r'(?<![:\-])bg-blue-50(?=[ "\n])(?!\s*dark:)', 'bg-blue-50 dark:bg-blue-500/10'),
    (r'(?<![:\-])bg-orange-50(?=[ "\n])(?!\s*dark:)', 'bg-orange-50 dark:bg-orange-500/10'),
    (r'(?<![:\-])bg-violet-50(?=[ "\n])(?!\s*dark:)', 'bg-violet-50 dark:bg-violet-500/10'),
    (r'(?<![:\-])bg-purple-50(?=[ "\n])(?!\s*dark:)', 'bg-purple-50 dark:bg-purple-500/10'),
    (r'(?<![:\-])bg-pink-50(?=[ "\n])(?!\s*dark:)', 'bg-pink-50 dark:bg-pink-500/10'),

    # Bare `border-t` defaults to gray-200 in light mode — leaves a too-bright
    # line on dark backgrounds. Anchor so we don't match `border-t-2` etc.
    (r'(?<!dark:)border-t(?!-|\w)(?!\s*dark:)', 'border-t border-slate-200 dark:border-slate-700'),
]

# Per-color rules — generated for every Tailwind hue actually used in the
# codebase. Mid-tone text and pastel gradients had no dark variants and were
# rendering nearly invisibly on dark backgrounds (the Orders page stat cards
# were the most visible offender).
_HUES = [
    'cyan', 'sky', 'blue', 'indigo',
    'violet', 'purple', 'fuchsia', 'pink',
    'rose', 'red', 'orange', 'amber', 'yellow',
    'lime', 'green', 'emerald',
]

for _hue in _HUES:
    RULES.extend([
        # Mid-tone text — bump to a lighter dark variant
        (rf'(?<!dark:)text-{_hue}-700(?!\s*dark:)', f'text-{_hue}-700 dark:text-{_hue}-300'),
        (rf'(?<!dark:)text-{_hue}-600(?!\s*dark:)', f'text-{_hue}-600 dark:text-{_hue}-300'),
        (rf'(?<!dark:)text-{_hue}-500(?!\s*dark:)', f'text-{_hue}-500 dark:text-{_hue}-400'),

        # Light pill backgrounds — fade to a tinted dark surface
        (rf'(?<![:\-])bg-{_hue}-100(?=[ "\n])(?!\s*dark:)', f'bg-{_hue}-100 dark:bg-{_hue}-500/15'),

        # Light borders → low-opacity dark accent
        (rf'(?<!dark:)border-{_hue}-100(?!\s*dark:)', f'border-{_hue}-100 dark:border-{_hue}-500/30'),
        (rf'(?<!dark:)border-{_hue}-200(?!\s*dark:)', f'border-{_hue}-200 dark:border-{_hue}-500/30'),

        # Pastel gradient stops — most common cause of the "muted card" look.
        # The trailing `(?=[ "\n])` lookahead is critical: without it, a class
        # like `from-teal-500` matches as `from-teal-50` + a trailing `0`,
        # corrupting it into `from-teal-50 dark:from-teal-500/100`.
        (rf'(?<!dark:)from-{_hue}-50(?=[ "\n])(?!\s*dark:)', f'from-{_hue}-50 dark:from-{_hue}-500/10'),
        (rf'(?<!dark:)to-{_hue}-50(?=[ "\n])(?!\s*dark:)', f'to-{_hue}-50 dark:to-{_hue}-500/5'),
        (rf'(?<!dark:)via-{_hue}-50(?=[ "\n])(?!\s*dark:)', f'via-{_hue}-50 dark:via-{_hue}-500/10'),
    ])

def patch(text: str) -> tuple[str, int, int]:
    cleaned = 0
    for pattern, repl in CLEANUP_RULES:
        new_text, count = re.subn(pattern, repl, text)
        text = new_text
        cleaned += count
        # Re-run the cleanup until no more duplicates are found (chains can be longer than 2)
        while count > 0:
            new_text, count = re.subn(pattern, repl, text)
            text = new_text
            cleaned += count

    applied = 0
    for pattern, repl in RULES:
        new_text, count = re.subn(pattern, repl, text)
        text = new_text
        applied += count
    return text, cleaned, applied


def main() -> int:
    grand_clean = 0
    grand_apply = 0
    for name in TARGETS:
        path = os.path.normpath(os.path.join(ROOT, name))
        if not os.path.exists(path):
            print(f'  ! missing: {path}', file=sys.stderr)
            continue
        with open(path, 'r', encoding='utf-8') as fh:
            original = fh.read()
        new_text, cleaned, applied = patch(original)
        if new_text != original:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(new_text)
        grand_clean += cleaned
        grand_apply += applied
        print(f'  {name}: cleaned={cleaned} applied={applied}')
    print(f'\nTotal cleaned={grand_clean}, applied={grand_apply}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
