# More illustrations in the same style as the food art:
#  public/food/*.svg  — new foods
#  public/art/*.svg   — At a glance metrics and habits (and placeholders for new tasks)
# Run: python3 scripts/make-art-2.py
import math, os, random

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public')
os.makedirs(os.path.join(ROOT, 'art'), exist_ok=True)

def svg(bg, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"><rect width="120" height="160" fill="{bg}"/>{body}</svg>'

def food(bg, body):  # square food art (matches the existing set)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="18" fill="{bg}"/>{body}</svg>'

def plate(cx=60, cy=62, r=46):
    return (f'<ellipse cx="{cx}" cy="{cy+4}" rx="{r}" ry="{r-2}" fill="#000" opacity=".08"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/><circle cx="{cx}" cy="{cy}" r="{r-7}" fill="#F6F4EF"/>')

def bowl(cx, cy, r, fill):
    return (f'<circle cx="{cx}" cy="{cy+2}" r="{r+1}" fill="#000" opacity=".08"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/><circle cx="{cx}" cy="{cy}" r="{r-4}" fill="{fill}"/>')

def dots(n, cx, cy, rad, rmin, rmax, colors, seed, shape='circle'):
    rnd = random.Random(seed); out = []
    for _ in range(n):
        a = rnd.random() * 2 * math.pi; d = rad * math.sqrt(rnd.random())
        x, y = cx + d * math.cos(a), cy + d * math.sin(a); r = rnd.uniform(rmin, rmax); c = rnd.choice(colors)
        if shape == 'ellipse':
            out.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{r:.1f}" ry="{r*0.55:.1f}" fill="{c}" transform="rotate({rnd.randint(0,180)} {x:.1f} {y:.1f})"/>')
        elif shape == 'rect':
            out.append(f'<rect x="{x-r:.1f}" y="{y-r:.1f}" width="{2*r:.1f}" height="{2*r:.1f}" rx="2" fill="{c}" transform="rotate({rnd.randint(0,90)} {x:.1f} {y:.1f})"/>')
        else:
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{c}"/>')
    return ''.join(out)

def leaf(x, y, s, rot, c='#4E9A3A'):
    return f'<path d="M0 0 C{s*.4} {-s*.5} {s} {-s*.4} {s*1.2} 0 C{s} {s*.4} {s*.4} {s*.5} 0 0Z" fill="{c}" transform="translate({x} {y}) rotate({rot})"/>'

def glass(fill, top, extra=''):  # side-view glass for drinks
    return (f'<ellipse cx="60" cy="104" rx="30" ry="6" fill="#000" opacity=".08"/>'
            f'<path d="M34 22h52l-6 80a6 6 0 0 1-6 5H46a6 6 0 0 1-6-5z" fill="#fff" opacity=".9"/>'
            f'<path d="M37 {top}h46l-4.5 {100-top}a5 5 0 0 1-5 4H46.5a5 5 0 0 1-5-4z" fill="{fill}"/>{extra}'
            f'<path d="M34 22h52l-6 80a6 6 0 0 1-6 5H46a6 6 0 0 1-6-5z" fill="none" stroke="#fff" stroke-width="2"/>')

FOOD = {
    'paneertoast': food('#F7E6CF', plate() + '<rect x="24" y="34" width="44" height="44" rx="10" fill="#C98B4A"/><rect x="28" y="38" width="36" height="36" rx="7" fill="#E7B36F"/>'
                        '<rect x="52" y="46" width="44" height="44" rx="10" fill="#C98B4A"/><rect x="56" y="50" width="36" height="36" rx="7" fill="#E7B36F"/>'
                        + dots(9, 46, 56, 12, 4.5, 5.5, ['#FFFCF4'], 31, 'rect') + dots(9, 74, 68, 12, 4.5, 5.5, ['#FFFCF4'], 32, 'rect')
                        + dots(10, 60, 62, 30, 1.2, 1.8, ['#6DB33F', '#E2483B'], 33)),
    'eggs': food('#FBEFD0', plate() + ''.join(f'<ellipse cx="{x}" cy="{y}" rx="13" ry="16" fill="#FFFDF8" stroke="#EDE4D3" stroke-width="1.5"/><circle cx="{x}" cy="{y+1}" r="7" fill="#F4B526"/>'
                        for x, y in [(44, 48), (76, 48), (44, 78), (76, 78)]) + dots(8, 60, 62, 34, 0.8, 1.3, ['#5A4A3A'], 34)),
    'tikkichaat': food('#F9E1D0', plate() + '<circle cx="50" cy="58" r="15" fill="#C9822E"/><circle cx="72" cy="66" r="15" fill="#C9822E"/>'
                        '<path d="M34 54c10 6 30 10 52 6-4 14-22 22-34 18s-20-12-18-24z" fill="#F7F2E6" opacity=".9"/>'
                        '<path d="M40 64c8 4 24 6 40 2" stroke="#8C3B1E" stroke-width="3" fill="none" stroke-linecap="round"/>'
                        '<path d="M44 72c8 3 20 3 32 0" stroke="#3E8A3A" stroke-width="3" fill="none" stroke-linecap="round"/>'
                        + dots(26, 60, 62, 24, 1.2, 1.8, ['#F2C230', '#E2483B', '#8E3B6B'], 35)),
    'panipuri': food('#E5F1DE', plate() + ''.join(f'<circle cx="{x}" cy="{y}" r="11" fill="#E0A04A"/><circle cx="{x-2}" cy="{y-2}" r="4" fill="#9A5A1E"/>'
                        for x, y in [(40, 50), (60, 42), (80, 50), (44, 72), (64, 66), (82, 76)])
                        + '<ellipse cx="60" cy="90" rx="13" ry="6" fill="#6DB33F" opacity=".85"/>'),
    'namkeen': food('#FBE9C4', bowl(60, 60, 44, '#F2C14E') + dots(70, 60, 60, 32, 1.2, 2.6, ['#E3A23B', '#D9822B', '#C9601E', '#F6D06B'], 36, 'ellipse')
                        + dots(14, 60, 60, 30, 2, 3, ['#8C5A2B'], 37) + dots(10, 60, 60, 28, 1.6, 2.2, ['#6DB33F'], 38)),
    'bhelpuri': food('#F6E7D5', plate() + dots(80, 60, 62, 32, 2, 3.4, ['#F3E3B8', '#EAD39A', '#FFF4D6'], 39, 'ellipse')
                        + dots(14, 60, 62, 28, 2.6, 3.4, ['#E2483B'], 40, 'rect') + dots(14, 60, 62, 28, 1.8, 2.4, ['#6DB33F'], 41)
                        + dots(10, 60, 62, 28, 1.6, 2.4, ['#F2C230'], 42) + leaf(40, 46, 8, 20) + '<path d="M70 40l8 -10 4 3-7 10z" fill="#E7B36F"/>'),
    'lemonade': food('#FBF6C8', glass('#F7E46A', 40, '<circle cx="50" cy="60" r="4" fill="#fff" opacity=".7"/><circle cx="66" cy="76" r="3" fill="#fff" opacity=".7"/>'
                        '<circle cx="84" cy="26" r="13" fill="#C8E05A"/><circle cx="84" cy="26" r="9" fill="#E9F49A"/>' + leaf(40, 34, 9, -30))),
    'fruitsalad': food('#FCE3E3', bowl(60, 60, 46, '#FFF3E0') + dots(8, 60, 60, 26, 6, 7.5, ['#E2483B'], 43) + dots(8, 60, 60, 28, 5.5, 7, ['#F7D046'], 44, 'rect')
                        + dots(7, 60, 60, 26, 5, 6.5, ['#7DBA4F'], 45, 'rect') + dots(6, 60, 60, 26, 4.5, 6, ['#F28C28'], 46) + dots(10, 60, 60, 28, 2.4, 3, ['#5B3E8C'], 47)),
    'bananashake': food('#FBF0C9', glass('#F6E3A1', 32, '<path d="M37 32c6-6 12 2 18-2s12 4 18 0 8-2 10 0" fill="#FFF8E0"/>'
                        '<path d="M70 8c8 2 14 10 12 18" stroke="#F2C230" stroke-width="7" fill="none" stroke-linecap="round"/>'
                        '<rect x="62" y="10" width="4" height="40" rx="2" fill="#E2483B" transform="rotate(12 64 30)"/>')),
    'buttermilk': food('#E3F0EE', glass('#F5F7F2', 36, dots(8, 60, 60, 16, 1.2, 1.8, ['#6DB33F'], 48) + leaf(46, 34, 8, -20) + leaf(66, 36, 7, 200))),
}

# ---------- metric & habit art (portrait 120×160, flat scenes) ----------
def scene(bg, body):
    return svg(bg, f'<circle cx="96" cy="26" r="40" fill="#fff" opacity=".18"/>{body}')

ART = {
    'water': scene('#5AA9F0', '<path d="M38 34h44l-6 82a6 6 0 0 1-6 5H50a6 6 0 0 1-6-5z" fill="#fff" opacity=".35"/>'
                   '<path d="M41 62c8 5 16-4 24 0s12 4 18 0l-3 52a5 5 0 0 1-5 4H51a5 5 0 0 1-5-4z" fill="#fff" opacity=".8"/>'
                   '<path d="M90 70c6 9 9 14 9 19a9 9 0 0 1-18 0c0-5 3-10 9-19z" fill="#fff" opacity=".85"/>'),
    'protein': scene('#2FA58C', '<rect x="38" y="44" width="44" height="80" rx="10" fill="#fff" opacity=".9"/><rect x="42" y="30" width="36" height="16" rx="5" fill="#1C6E5D"/>'
                     '<rect x="42" y="70" width="36" height="24" rx="5" fill="#2FA58C"/><text x="60" y="87" font-family="Arial" font-weight="700" font-size="11" fill="#fff" text-anchor="middle">PRO</text>'
                     '<ellipse cx="94" cy="110" rx="12" ry="15" fill="#FFFDF8"/><circle cx="94" cy="111" r="6" fill="#F4B526"/>'),
    'eaten': scene('#F08A4B', '<circle cx="60" cy="86" r="40" fill="#fff"/><circle cx="60" cy="86" r="32" fill="#FBEFE3"/>'
                   '<circle cx="48" cy="80" r="12" fill="#E7C08A"/><circle cx="72" cy="78" r="9" fill="#7DA33B"/><circle cx="66" cy="100" r="10" fill="#F2BE45"/>'
                   '<rect x="16" y="56" width="5" height="62" rx="2.5" fill="#fff"/><rect x="99" y="56" width="5" height="62" rx="2.5" fill="#fff"/>'),
    'burned': scene('#E8536B', '<path d="M60 30c8 20 32 32 32 62a32 32 0 0 1-64 0c0-14 7-24 14-30 0 12 6 20 13 20 0-18-7-32 5-52z" fill="#FFD166"/>'
                    '<path d="M60 70c5 10 15 16 15 30a15 15 0 0 1-30 0c0-8 5-13 9-16 0 6 3 9 6 9 0-9-3-15 0-23z" fill="#fff" opacity=".85"/>'),
    'deficit': scene('#F2A33A', '<circle cx="60" cy="86" r="40" fill="#fff"/><circle cx="60" cy="86" r="28" fill="#F2A33A"/><circle cx="60" cy="86" r="16" fill="#fff"/><circle cx="60" cy="86" r="6" fill="#E2483B"/>'
                     '<path d="M60 86l34-34" stroke="#3C3C3C" stroke-width="4" stroke-linecap="round"/><path d="M94 52l8-2-2 8z" fill="#3C3C3C"/>'),
    'workout': scene('#3DB37A', '<rect x="18" y="74" width="84" height="10" rx="5" fill="#fff"/>'
                     '<rect x="20" y="56" width="14" height="46" rx="5" fill="#1F5F55"/><rect x="86" y="56" width="14" height="46" rx="5" fill="#1F5F55"/>'
                     '<rect x="10" y="64" width="10" height="30" rx="4" fill="#1F5F55"/><rect x="100" y="64" width="10" height="30" rx="4" fill="#1F5F55"/>'),
    'sleep': scene('#5B5BD6', '<path d="M78 40a34 34 0 1 0 22 54 28 28 0 0 1-22-54z" fill="#FFE29A"/>'
                   '<circle cx="34" cy="44" r="2.5" fill="#fff"/><circle cx="96" cy="120" r="2" fill="#fff"/><circle cx="24" cy="120" r="1.8" fill="#fff"/>'
                   '<text x="86" y="52" font-family="Arial" font-weight="800" font-size="14" fill="#fff">z</text><text x="96" y="40" font-family="Arial" font-weight="800" font-size="10" fill="#fff">z</text>'),
    'steps': scene('#F5B53F', '<path d="M22 110c0-10 3-26 10-34l12 10c8 4 16 5 26 10 12 3 26 7 26 15v5H22z" fill="#fff"/>'
                   '<path d="M22 120h74" stroke="#3C3C3C" stroke-width="5" stroke-linecap="round"/><path d="M48 92l6-5M58 96l6-5" stroke="#F5B53F" stroke-width="3" stroke-linecap="round"/>'),
    'weight': scene('#8C96A8', '<rect x="22" y="48" width="76" height="76" rx="18" fill="#fff"/><path d="M40 78a20 20 0 0 1 40 0z" fill="#E8ECF2"/>'
                    '<path d="M60 78l9-12" stroke="#E2483B" stroke-width="3" stroke-linecap="round"/>'),
    # habits
    'routine': scene('#F4A259', '<circle cx="60" cy="110" r="34" fill="#FFE29A"/><rect x="0" y="110" width="120" height="50" fill="#E07A3A"/>'
                     + ''.join(f'<path d="M60 70 l{30*math.cos(a):.1f} {30*math.sin(a):.1f}" stroke="#FFE29A" stroke-width="4" stroke-linecap="round" transform="translate(0 0)"/>' for a in [-2.6, -2.1, -1.57, -1.05, -0.5])),
    'read': scene('#7A5BD6', '<path d="M18 104l42-12 42 12v-50l-42-12-42 12z" fill="#fff"/><path d="M60 42v62" stroke="#7A5BD6" stroke-width="3"/>'
                  '<path d="M26 64l26-7M26 74l26-7M68 57l26 7M68 67l26 7" stroke="#C9BDF0" stroke-width="3" stroke-linecap="round"/>'),
    'write': scene('#3FA7A0', '<rect x="26" y="40" width="60" height="84" rx="6" fill="#fff"/><path d="M36 60h40M36 72h40M36 84h28" stroke="#BFE3E0" stroke-width="4" stroke-linecap="round"/>'
                   '<rect x="78" y="44" width="10" height="58" rx="3" fill="#F4B526" transform="rotate(28 83 73)"/><path d="M70 100l4 10 6-7z" fill="#3C3C3C" transform="rotate(28 83 73)"/>'),
    'closeday': scene('#2E3A6E', '<path d="M30 130V40" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M32 42h56l-12 18 12 18H32z" fill="#FFD166"/>'
                      '<circle cx="92" cy="110" r="12" fill="#FFE29A"/><circle cx="88" cy="106" r="12" fill="#2E3A6E"/>'),
    'todo': scene('#4C8DF6', '<rect x="28" y="36" width="64" height="92" rx="8" fill="#fff"/><rect x="44" y="30" width="32" height="12" rx="4" fill="#2E5FB8"/>'
                  + ''.join(f'<rect x="38" y="{y}" width="10" height="10" rx="2" fill="none" stroke="#4C8DF6" stroke-width="2.5"/><path d="M56 {y+5}h26" stroke="#D3E2FB" stroke-width="4" stroke-linecap="round"/>' for y in (56, 76, 96))
                  + '<path d="M40 61l3 3 6-7" stroke="#2FA58C" stroke-width="3" fill="none" stroke-linecap="round"/>'),
    'laundry': scene('#6AB7E8', '<rect x="22" y="36" width="76" height="92" rx="10" fill="#fff"/><circle cx="60" cy="88" r="26" fill="#DCEFFA"/><circle cx="60" cy="88" r="18" fill="#6AB7E8" opacity=".6"/>'
                     '<circle cx="34" cy="48" r="4" fill="#6AB7E8"/><circle cx="46" cy="48" r="4" fill="#6AB7E8"/>'),
    'meditate': scene('#9B7FD9', '<circle cx="60" cy="54" r="12" fill="#fff"/><path d="M60 68c-14 0-22 10-24 26h48c-2-16-10-26-24-26z" fill="#fff"/>'
                      '<path d="M24 104c12-6 26-6 36-2 10-4 24-4 36 2-12 8-26 10-36 6-10 4-24 2-36-6z" fill="#fff" opacity=".85"/>'),
    'plant': scene('#7CC36B', '<path d="M42 100h36l-4 28H46z" fill="#C46A3C"/><path d="M60 100V60" stroke="#2F6B2A" stroke-width="4"/>'
                   + leaf(60, 72, 20, -150, '#2F6B2A') + leaf(60, 64, 20, -30, '#3E8A3A') + leaf(60, 86, 16, -160, '#3E8A3A')),
    'supplements': scene('#E57AA8', '<rect x="36" y="44" width="48" height="76" rx="10" fill="#fff"/><rect x="40" y="32" width="40" height="14" rx="4" fill="#B84A7A"/>'
                         '<rect x="44" y="70" width="32" height="20" rx="4" fill="#FBE0EC"/><ellipse cx="96" cy="112" rx="10" ry="5" fill="#FFD166" transform="rotate(-30 96 112)"/>'),
}

for n, s in FOOD.items():
    open(os.path.join(ROOT, 'food', f'{n}.svg'), 'w').write(s)
for n, s in ART.items():
    open(os.path.join(ROOT, 'art', f'{n}.svg'), 'w').write(s)
print('food', len(FOOD), 'art', len(ART))
