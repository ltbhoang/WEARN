import os
import sys
import django
import xml.etree.ElementTree as ET

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import KanaCharacter

def extract_strokes(svg_content):
    """Trích xuất từng nét từ SVG AnimCJK (dành cho file có cấu trúc clip-path và path tham chiếu)"""
    try:
        root = ET.fromstring(svg_content)
    except ET.ParseError:
        return []
    
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    # Tìm tất cả các path có clip-path (các nét vẽ thực tế)
    stroke_paths = root.findall('.//svg:path[@clip-path]', ns)
    strokes = []
    
    for idx, path in enumerate(stroke_paths):
        clip_id = path.get('clip-path').strip('url(#)')
        # Tìm thẻ use bên trong clipPath
        use = root.find(f".//*[@id='{clip_id}']/svg:use", ns)
        if use is not None:
            href = use.get('href').strip('#')
            original = root.find(f".//svg:path[@id='{href}']", ns)
            if original is not None:
                d = original.get('d')
                # Tạo SVG cho nét này (đơn giản, chỉ có path)
                stroke_svg = f'<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="{d}" stroke="black" fill="none" stroke-width="20"/></svg>'
                strokes.append({
                    'order': idx + 1,
                    'svg': stroke_svg
                })
    return strokes

def main():
    kanas = KanaCharacter.objects.all()
    for kana in kanas:
        if kana.svg_content and not kana.strokes:
            strokes = extract_strokes(kana.svg_content)
            if strokes:
                kana.strokes = strokes
                kana.total_strokes = len(strokes)
                kana.save()
                print(f"✅ {kana.character} ({kana.type}): {len(strokes)} nét")
            else:
                print(f"⚠️ Không trích xuất được nét cho {kana.character}")
        else:
            print(f"⏩ Bỏ qua {kana.character} (đã có strokes hoặc không có svg)")

if __name__ == '__main__':
    main()