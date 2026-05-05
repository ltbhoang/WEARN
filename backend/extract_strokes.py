import os
import sys
import django
import xml.etree.ElementTree as ET
from collections import defaultdict

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import KanaCharacter

def extract_strokes(svg_content):
    """Trích xuất từng nét từ SVG AnimCJK, gộp các path cùng thời gian animation thành một nét"""
    try:
        root = ET.fromstring(svg_content)
    except ET.ParseError:
        return []
    
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    # Tìm tất cả các path có clip-path (các nét vẽ thực tế)
    stroke_paths = root.findall('.//svg:path[@clip-path]', ns)
    
    # Nhóm theo thời gian animation (--d:Xs)
    groups = defaultdict(list)
    for path in stroke_paths:
        style = path.get('style', '')
        time_str = ''
        if '--d:' in style:
            # Lấy giá trị thời gian, ví dụ '--d:1s;' -> '1'
            time_str = style.split('--d:')[1].split('s')[0].strip()
        else:
            # Nếu không có, coi như nét đầu tiên
            time_str = '0'
        clip_id = path.get('clip-path').strip('url(#)')
        groups[time_str].append(clip_id)
    
    strokes = []
    # Sắp xếp theo thời gian tăng dần
    sorted_times = sorted(groups.keys(), key=lambda x: float(x) if x.replace('.','',1).isdigit() else 0)
    
    for order, time_key in enumerate(sorted_times, start=1):
        clip_ids = groups[time_key]
        # Lấy tất cả các path gốc từ các clip-id
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
            # Gộp nhiều path thành một nét (nối các d)
            combined_d = ' '.join(paths_data)
            stroke_svg = f'<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="{combined_d}" stroke="black" fill="none" stroke-width="20"/></svg>'
            strokes.append({'order': order, 'svg': stroke_svg})
    
    return strokes

def main():
    kanas = KanaCharacter.objects.all()
    for kana in kanas:
        if kana.svg_content and (not kana.strokes or len(kana.strokes) == 0):
            strokes = extract_strokes(kana.svg_content)
            if strokes:
                kana.strokes = strokes
                kana.total_strokes = len(strokes)
                kana.save()
                print(f"✅ {kana.character} ({kana.type}): {len(strokes)} nét")
            else:
                print(f"⚠️ Không trích xuất được nét cho {kana.character}")
        else:
            print(f"⏩ Bỏ qua {kana.character} (đã có strokes)")

if __name__ == '__main__':
    main()