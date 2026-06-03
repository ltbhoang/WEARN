import os
import sys
import django
import xml.etree.ElementTree as ET
from collections import defaultdict

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import KanaCharacter

def extract_strokes(svg_content):
    try:
        root = ET.fromstring(svg_content)
    except ET.ParseError:
        return []
    
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    stroke_paths = root.findall('.//svg:path[@clip-path]', ns)
    
    groups = defaultdict(list)
    for path in stroke_paths:
        style = path.get('style', '')
        time_str = ''
        if '--d:' in style:
            time_str = style.split('--d:')[1].split('s')[0].strip()
        else:
            time_str = '0'
        clip_id = path.get('clip-path').strip('url(#)')
        groups[time_str].append(clip_id)
    
    strokes = []
    sorted_times = sorted(groups.keys(), key=lambda x: float(x) if x.replace('.','',1).isdigit() else 0)
    
    for order, time_key in enumerate(sorted_times, start=1):
        clip_ids = groups[time_key]
        paths_data = []
        for clip_id in clip_ids:
            use = root.find(f".//*[@id='{clip_id}']/svg:use", ns)
            if use is not None:
                href = use.get('href').strip('#')
                original = root.find(f".//svg:path[@id='{href}']", ns)
                if original is not None:
                    d = original.get('d')
                    paths_data.append(d)
        if paths_data:
            combined_d = ' '.join(paths_data)
            stroke_svg = f'<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="{combined_d}" stroke="black" fill="none" stroke-width="20"/></svg>'
            strokes.append({'order': order, 'svg': stroke_svg})
    
    return strokes

def main():
    kanas = KanaCharacter.objects.all()
    total = kanas.count()
    print(f"Tìm thấy {total} kana. Bắt đầu trích xuất nét chữ...")
    for idx, kana in enumerate(kanas, 1):
        if kana.svg_content and (not kana.strokes or len(kana.strokes) == 0):
            strokes = extract_strokes(kana.svg_content)
            if strokes:
                kana.strokes = strokes
                kana.total_strokes = len(strokes)
                kana.save()
                print(f"[{idx}/{total}] ✅ {kana.character} ({kana.type}): {len(strokes)} nét")
            else:
                print(f"[{idx}/{total}] ⚠️ Không trích xuất được nét cho {kana.character}")
        else:
            print(f"[{idx}/{total}] ⏩ Bỏ qua {kana.character} (đã có strokes)")

if __name__ == '__main__':
    main()
