# At a glance icons: one style — chunky dark outline, soft colour fills, centred on a solid light background.
# Run: python3 scripts/make-glance-art.py   → public/art/g-*.svg
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'art')
os.makedirs(OUT, exist_ok=True)
K = '#2D2A32'  # outline
S = f'stroke="{K}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"'

def tile(bg, body):
    # 120×160 tile; icon area centred around y≈80 (number sits top-left, label at the bottom)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"><rect width="120" height="160" fill="{bg}"/><g transform="translate(15 20) scale(0.75)">{body}</g></svg>'

ART = {
    'water': tile('#DCEEFC',
        f'<path d="M38 46h44l-5 56a6 6 0 0 1-6 5H49a6 6 0 0 1-6-5z" fill="#fff" {S}/>'
        f'<path d="M41.5 68c7 4 13-3 19 0s13 4 18 0l-3.4 33a4 4 0 0 1-4 4H49a4 4 0 0 1-4-4z" fill="#7FC4F5"/>'
        f'<path d="M38 46h44l-5 56a6 6 0 0 1-6 5H49a6 6 0 0 1-6-5z" fill="none" {S}/>'
        f'<path d="M90 50c5 7 7.5 11 7.5 15a7.5 7.5 0 0 1-15 0c0-4 2.5-8 7.5-15z" fill="#7FC4F5" {S}/>'),
    'protein': tile('#FCEBD6',
        f'<path d="M42 58h36l-4 50a5 5 0 0 1-5 4.5H51a5 5 0 0 1-5-4.5z" fill="#FFF6E2" {S}/>'
        f'<path d="M44.5 70h31l-3 37a3 3 0 0 1-3 2.6H50.5a3 3 0 0 1-3-2.6z" fill="#F6D88E"/>'
        f'<rect x="51" y="80" width="18" height="15" rx="3" fill="#F4A261" {S}/>'
        f'<path d="M42 58h36l-4 50a5 5 0 0 1-5 4.5H51a5 5 0 0 1-5-4.5z" fill="none" {S}/>'
        f'<path d="M40 50a20 12 0 0 1 40 0v8H40z" fill="#6FA3D8" {S}/>'
        f'<path d="M48 40l20-6" {S} fill="none"/><path d="M66 34a5 5 0 0 1 9 2v6" fill="#6FA3D8" {S}/>'),
    'eaten': tile('#FDE5D8',
        f'<circle cx="60" cy="76" r="27" fill="#fff" {S}/><circle cx="60" cy="76" r="18" fill="#FFF3E6" stroke="{K}" stroke-width="2.5"/>'
        f'<circle cx="54" cy="72" r="6" fill="#F2BE45" {S.replace("4", "2.5", 1)}/><circle cx="66" cy="80" r="5" fill="#7DBA4F" {S.replace("4", "2.5", 1)}/>'
        f'<path d="M24 54v14a4 4 0 0 0 4 4v26M28 54v14M32 54v14a4 4 0 0 1-4 4" fill="none" {S}/>'
        f'<path d="M92 98V54c-6 2-8 10-8 18h8" fill="#FFF3E6" {S}/>'),
    'burned': tile('#FFE3E0',
        f'<path d="M56 40c6 14 22 22 22 42a22 22 0 0 1-44 0c0-10 5-17 10-21 0 8 4 13 9 13 0-12-5-22 3-34z" fill="#FF7B7B" {S}/>'
        f'<path d="M56 74c3 6 9 9 9 17a9 9 0 0 1-18 0c0-5 3-8 6-10 0 4 1.5 6 3 6 0-5-2-8 0-13z" fill="#FFD36E" {S.replace("4", "3", 1)}/>'
        f'<rect x="58" y="92" width="40" height="22" rx="6" fill="#fff" {S}/>'
        f'<text x="78" y="108" font-family="Arial, sans-serif" font-weight="800" font-size="12" fill="{K}" text-anchor="middle">kcal</text>'),
    'deficit': tile('#FFF1CC',
        f'<circle cx="56" cy="78" r="28" fill="#fff" {S}/><circle cx="56" cy="78" r="18" fill="#FFB4A8" {S}/><circle cx="56" cy="78" r="8" fill="#fff" {S}/>'
        f'<path d="M56 78l30-30" {S} fill="none"/><path d="M80 44l10-2-2 10-6 0z" fill="#F2A33A" {S}/>'),
    'workout': tile('#E6E8F2',
        f'<rect x="34" y="72" width="52" height="10" rx="3" fill="#D8DBE8" {S}/>'
        f'<rect x="28" y="56" width="12" height="42" rx="5" fill="#7C7F93" {S}/><rect x="80" y="56" width="12" height="42" rx="5" fill="#7C7F93" {S}/>'
        f'<rect x="19" y="63" width="10" height="28" rx="4" fill="#9A9DB1" {S}/><rect x="91" y="63" width="10" height="28" rx="4" fill="#9A9DB1" {S}/>'
        f'<path d="M30 110h28M50 118h30" {S} fill="none"/>'),
    'sleep': tile('#E9E4FB',
        f'<path d="M70 42a30 30 0 1 0 22 46 24 24 0 0 1-22-46z" fill="#FFD36E" {S}/>'
        f'<path d="M86 44h10l-10 12h10" {S} fill="none"/><path d="M100 30h6l-6 7h6" stroke="{K}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
        f'<circle cx="30" cy="48" r="2.5" fill="{K}"/>'),
    'steps': tile('#EFE5D6',
        f'<path d="M30 102c-2-12 2-30 10-40l14 14c8 3 16 5 26 9 10 3 16 7 16 13v6a4 4 0 0 1-4 4H34a4 4 0 0 1-4-6z" fill="#A08B70" {S}/>'
        f'<path d="M30 100h66" stroke="#F5ECDD" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="M58 80l6-5M66 84l6-5M74 88l6-5" stroke="#F5ECDD" stroke-width="4" stroke-linecap="round"/>'
        f'<path d="M30 102c-2-12 2-30 10-40l14 14c8 3 16 5 26 9 10 3 16 7 16 13v6a4 4 0 0 1-4 4H34a4 4 0 0 1-4-6z" fill="none" {S}/>'),
    'weight': tile('#E4ECEF',
        f'<rect x="28" y="46" width="64" height="64" rx="16" fill="#fff" {S}/><path d="M42 72a18 18 0 0 1 36 0z" fill="#E4ECEF" {S}/>'
        f'<path d="M60 72l8-11" stroke="#E2483B" stroke-width="4" stroke-linecap="round"/>'),
}
for n, s in ART.items():
    open(os.path.join(OUT, f'g-{n}.svg'), 'w').write(s)
print('wrote', len(ART))
