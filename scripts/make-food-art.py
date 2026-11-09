# Generates simple top-down food illustrations into public/food/*.svg
# Run: python3 scripts/make-food-art.py
import math, os, random

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'food')
os.makedirs(OUT, exist_ok=True)


def svg(bg, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">'
            f'<rect width="120" height="120" rx="18" fill="{bg}"/>{body}</svg>')


def plate(cx=60, cy=62, r=46):
    return (f'<ellipse cx="{cx}" cy="{cy+4}" rx="{r}" ry="{r-2}" fill="#000" opacity=".08"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/><circle cx="{cx}" cy="{cy}" r="{r-7}" fill="#F6F4EF"/>')


def bowl(cx, cy, r, fill, rim='#fff'):
    return (f'<circle cx="{cx}" cy="{cy+2}" r="{r+1}" fill="#000" opacity=".08"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{rim}"/><circle cx="{cx}" cy="{cy}" r="{r-4}" fill="{fill}"/>')


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


ART = {}

ART['poha'] = svg('#FCEFC7', plate() + dots(150, 60, 62, 33, 2.6, 4.2, ['#F2C230', '#E9B21C', '#F6D35A'], 1, 'ellipse')
                  + dots(12, 60, 62, 30, 2.2, 2.8, ['#6DB33F'], 2) + leaf(44, 50, 9, 20) + leaf(70, 76, 8, 200)
                  + '<path d="M80 40 a12 12 0 0 1 12 12 h-12z" fill="#C8E05A" stroke="#9CB531" stroke-width="1.5"/>'
                  + dots(10, 60, 62, 28, 1.2, 1.6, ['#B5502C'], 3))
ART['coffee'] = svg('#EADBCB', '<circle cx="60" cy="64" r="44" fill="#000" opacity=".07"/><circle cx="60" cy="60" r="42" fill="#fff"/>'
                    '<rect x="94" y="52" width="16" height="14" rx="7" fill="#fff" stroke="#E6E1DA" stroke-width="2"/>'
                    '<circle cx="60" cy="60" r="33" fill="#6B3E22"/><circle cx="60" cy="60" r="27" fill="#A0663A"/>'
                    '<path d="M48 58c6-8 18-8 24 0-6 8-18 8-24 0z" fill="#E8C9A3"/><circle cx="60" cy="58" r="3" fill="#A0663A"/>')
ART['chai'] = svg('#F4E1C6', '<circle cx="60" cy="64" r="44" fill="#000" opacity=".07"/><circle cx="60" cy="60" r="42" fill="#fff"/>'
                  '<rect x="94" y="52" width="16" height="14" rx="7" fill="#fff" stroke="#E6E1DA" stroke-width="2"/>'
                  '<circle cx="60" cy="60" r="33" fill="#C98A4B"/><circle cx="60" cy="60" r="28" fill="#D9A36B"/>'
                  + leaf(50, 52, 8, 10, '#3E7D2F') + dots(4, 64, 64, 10, 1.6, 2.2, ['#8C5A2B'], 9))
ART['shake'] = svg('#E3D8F3', '<rect x="34" y="18" width="52" height="88" rx="12" fill="#000" opacity=".08"/>'
                   '<rect x="32" y="14" width="52" height="88" rx="12" fill="#fff"/>'
                   '<rect x="37" y="34" width="42" height="63" rx="9" fill="#7A4A2E"/>'
                   '<path d="M37 40c7 5 14-4 21 0s14 5 21 0v-6H37z" fill="#B88464"/>'
                   '<rect x="38" y="8" width="40" height="14" rx="5" fill="#5B45E0"/>'
                   '<rect x="44" y="60" width="28" height="18" rx="4" fill="#fff" opacity=".85"/>'
                   '<text x="58" y="73" font-family="Arial" font-size="9" font-weight="700" text-anchor="middle" fill="#5B45E0">WHEY</text>')
ART['proteinbar'] = svg('#DDEFE9', '<rect x="14" y="44" width="94" height="38" rx="9" fill="#000" opacity=".08"/>'
                        '<rect x="12" y="40" width="94" height="38" rx="9" fill="#2A8C7B"/>'
                        '<path d="M12 49l6-4-6-5M106 49l-6-4 6-5M12 69l6 4-6 5M106 69l-6 4 6 5" stroke="#E3F4EF" stroke-width="2" fill="none"/>'
                        '<rect x="34" y="40" width="50" height="38" fill="#6B3F22"/>'
                        + ''.join(f'<rect x="{38+i*12}" y="46" width="9" height="26" rx="3" fill="#80502E"/>' for i in range(4))
                        + '<rect x="26" y="52" width="16" height="14" rx="3" fill="#fff" opacity=".9"/>'
                        '<text x="34" y="62" font-family="Arial" font-size="7" font-weight="700" text-anchor="middle" fill="#2A8C7B">20g</text>')
ART['chickensalad'] = svg('#DCEFD5', bowl(60, 60, 46, '#7DBA4F') + dots(26, 60, 60, 32, 6, 9, ['#8CC75A', '#5FA238', '#A9D66F'], 4, 'ellipse')
                          + ''.join(f'<rect x="{x}" y="{y}" width="22" height="9" rx="4.5" fill="#E2A65C" stroke="#C2813A" stroke-width="1.2" transform="rotate({r} {x+11} {y+4})"/>'
                                    for x, y, r in [(40, 46, 20), (58, 40, -15), (54, 62, 30), (38, 66, -20), (66, 70, 10)])
                          + dots(5, 60, 60, 28, 4.5, 5.5, ['#E2483B'], 5) + dots(8, 60, 60, 30, 1.6, 2.2, ['#F7F2E8'], 6))
ART['sandwich'] = svg('#FBE3C8', '<ellipse cx="60" cy="86" rx="50" ry="6" fill="#000" opacity=".08"/>'
                      '<path d="M10 70c0-6 4-10 10-10h80c6 0 10 4 10 10v6c0 4-3 7-7 7H17c-4 0-7-3-7-7z" fill="#D99A4E"/>'
                      '<path d="M10 62c8 5 12-3 20 1s12 4 20 0 12-4 20 0 12 4 20 0 12-4 10-1v-6H10z" fill="#73B843"/>'
                      '<rect x="12" y="52" width="96" height="8" rx="3" fill="#F5F0E6"/>'
                      + ''.join(f'<rect x="{18+i*18}" y="50" width="12" height="11" rx="2" fill="#FFFDF7" stroke="#E9DFC9"/>' for i in range(5))
                      + '<path d="M12 50c0-14 22-22 48-22s48 8 48 22z" fill="#E3A65A"/>'
                      + dots(14, 60, 38, 18, 1, 1.4, ['#FFF6E0'], 7, 'ellipse'))
ART['chickensandwich'] = svg('#FBE3C8', '<ellipse cx="60" cy="86" rx="50" ry="6" fill="#000" opacity=".08"/>'
                             '<path d="M10 70c0-6 4-10 10-10h80c6 0 10 4 10 10v6c0 4-3 7-7 7H17c-4 0-7-3-7-7z" fill="#D99A4E"/>'
                             '<path d="M10 62c8 5 12-3 20 1s12 4 20 0 12-4 20 0 12 4 20 0 12-4 10-1v-6H10z" fill="#73B843"/>'
                             '<rect x="12" y="51" width="96" height="9" rx="4" fill="#D98C45"/>'
                             + ''.join(f'<circle cx="{20+i*16}" cy="55" r="4" fill="#E2483B"/>' for i in range(6))
                             + '<path d="M12 50c0-14 22-22 48-22s48 8 48 22z" fill="#E3A65A"/>'
                             + dots(14, 60, 38, 18, 1, 1.4, ['#FFF6E0'], 8, 'ellipse'))
ART['thali'] = svg('#F3E7D6', plate(60, 60, 48)
                   + '<circle cx="46" cy="66" r="22" fill="#E7C08A"/><circle cx="46" cy="66" r="22" fill="none" stroke="#D2A464" stroke-width="2"/>'
                   + dots(14, 46, 66, 18, 1.4, 2.6, ['#B9813F', '#A86F30'], 10)
                   + '<circle cx="54" cy="70" r="20" fill="#EBC995" opacity=".9"/>' + dots(10, 54, 70, 16, 1.4, 2.4, ['#B9813F'], 11)
                   + bowl(78, 44, 15, '#7DA33B') + dots(10, 78, 44, 9, 2, 3, ['#9BC255', '#E0A53A'], 12)
                   + bowl(82, 74, 13, '#FBF8F1') + '<path d="M75 74q7 -5 14 0" stroke="#E9E2D2" stroke-width="2" fill="none"/>')
ART['dalchawal'] = svg('#FCEBC2', plate(60, 60, 48)
                       + '<path d="M18 62c0-16 14-26 30-26s28 10 28 24c-6 8-18 14-30 14s-24-4-28-12z" fill="#FFFDF6"/>'
                       + dots(60, 44, 54, 20, 1.6, 2.6, ['#F1ECE0', '#FFFFFF'], 13, 'ellipse')
                       + bowl(78, 68, 20, '#E8A92A') + '<circle cx="78" cy="68" r="12" fill="#F2BE45"/>' + leaf(74, 62, 7, 30)
                       + dots(6, 78, 68, 10, 1, 1.5, ['#B5502C'], 14))
ART['tikki'] = svg('#FBE6C9', plate()
                   + '<circle cx="46" cy="56" r="17" fill="#C9822E"/><circle cx="46" cy="56" r="13" fill="#DE9A3E"/>'
                   + '<circle cx="70" cy="70" r="17" fill="#C9822E"/><circle cx="70" cy="70" r="13" fill="#DE9A3E"/>'
                   + dots(10, 46, 56, 10, 1, 1.6, ['#F0B964'], 15) + dots(10, 70, 70, 10, 1, 1.6, ['#F0B964'], 16)
                   + '<circle cx="78" cy="42" r="8" fill="#E2483B"/><circle cx="78" cy="42" r="5" fill="#F07263"/>'
                   + '<circle cx="40" cy="80" r="8" fill="#7CC152"/><circle cx="40" cy="80" r="5" fill="#B8E08C"/>'
                   + '<path d="M86 60c6 0 8 6 4 10" stroke="#4E9A3A" stroke-width="5" fill="none" stroke-linecap="round"/>')
ART['paneersalad'] = svg('#E2F1E8', bowl(60, 60, 46, '#9CCB6B') + dots(22, 60, 60, 32, 6, 9, ['#8CC75A', '#B3DB7E'], 17, 'ellipse')
                         + dots(10, 60, 60, 26, 5.5, 7, ['#FFFBF2'], 18, 'rect') + dots(5, 60, 60, 28, 4, 5, ['#E2483B'], 19)
                         + dots(6, 60, 60, 28, 3, 4, ['#F2C230'], 20, 'rect'))
ART['daliya'] = svg('#F2E6D2', bowl(60, 60, 46, '#D9B98A') + dots(70, 60, 60, 34, 1.6, 2.6, ['#C9A36E', '#E2C89D'], 21, 'ellipse')
                    + dots(10, 60, 60, 28, 2.4, 3.2, ['#6DB33F'], 22) + dots(8, 60, 60, 28, 2.4, 3.4, ['#E07A2F'], 23, 'rect') + leaf(52, 52, 9, -30))
ART['soya'] = svg('#F1DDCB', bowl(60, 60, 46, '#A4522A') + '<circle cx="60" cy="60" r="34" fill="#B8622F"/>'
                  + dots(14, 60, 60, 26, 6, 8.5, ['#D9A066', '#C98E55'], 24) + dots(10, 60, 60, 28, 1.2, 1.8, ['#F3C59A'], 25)
                  + leaf(48, 50, 8, 10, '#3E7D2F') + leaf(70, 72, 7, 190, '#3E7D2F'))
ART['sweet'] = svg('#FBE2EA', plate() + '<circle cx="60" cy="62" r="30" fill="#E9B04E" opacity=".35"/>'
                   + ''.join(f'<circle cx="{x}" cy="{y}" r="13" fill="#7A3518"/><circle cx="{x-4}" cy="{y-4}" r="4" fill="#A4532C"/>' for x, y in [(48, 56), (72, 56), (60, 76)])
                   + dots(6, 60, 62, 22, 1, 1.4, ['#6DB33F'], 26))

for name, s in ART.items():
    with open(os.path.join(OUT, f'{name}.svg'), 'w') as f:
        f.write(s)
print('wrote', len(ART), 'images to', os.path.abspath(OUT))
