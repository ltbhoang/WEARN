import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import KanaCharacter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KANA_DIR = os.path.join(BASE_DIR, '../data/animCJK/svgsJaKana')
KANA_DIR = os.path.normpath(KANA_DIR)

# Danh sách unicode của 71 Hiragana (cơ bản + dấu, không chữ nhỏ)
hiragana_unicodes = [
    # Hàng a (không dấu)
    0x3042, 0x3044, 0x3046, 0x3048, 0x304a,  # a i u e o
    # Hàng k (không dấu và có dấu)
    0x304b, 0x304d, 0x304f, 0x3051, 0x3053,  # ka ki ku ke ko
    0x304c, 0x304e, 0x3050, 0x3052, 0x3054,  # ga gi gu ge go
    # Hàng s (không dấu và có dấu)
    0x3055, 0x3057, 0x3059, 0x305b, 0x305d,  # sa shi su se so
    0x3056, 0x3058, 0x305a, 0x305c, 0x305e,  # za ji zu ze zo
    # Hàng t (không dấu và có dấu) – chú ý: ち=0x3061, つ=0x3064
    0x305f, 0x3061, 0x3064, 0x3066, 0x3068,  # ta chi tsu te to
    0x3060, 0x3062, 0x3065, 0x3067, 0x3069,  # da ji dzu de do
    # Hàng n (không dấu)
    0x306a, 0x306b, 0x306c, 0x306d, 0x306e,  # na ni nu ne no
    # Hàng h (không dấu, có dấu và maru)
    0x306f, 0x3072, 0x3075, 0x3078, 0x307b,  # ha hi fu he ho
    0x3070, 0x3073, 0x3076, 0x3079, 0x307c,  # ba bi bu be bo
    0x3071, 0x3074, 0x3077, 0x307a, 0x307d,  # pa pi pu pe po
    # Hàng m (không dấu)
    0x307e, 0x307f, 0x3080, 0x3081, 0x3082,  # ma mi mu me mo
    # Hàng y (không dấu) – chỉ 3 chữ, không có dấu
    0x3084, 0x3086, 0x3088,  # ya yu yo
    # Hàng r (không dấu)
    0x3089, 0x308a, 0x308b, 0x308c, 0x308d,  # ra ri ru re ro
    # Hàng w và n (không dấu) – chỉ wa, wo, n
    0x308f, 0x3092, 0x3093,  # wa wo n
]

# Danh sách unicode của 71 Katakana (cơ bản + dấu, không chữ nhỏ)
katakana_unicodes = [
    # Hàng a
    0x30a2, 0x30a4, 0x30a6, 0x30a8, 0x30aa,
    # Hàng k
    0x30ab, 0x30ad, 0x30af, 0x30b1, 0x30b3,
    0x30ac, 0x30ae, 0x30b0, 0x30b2, 0x30b4,
    # Hàng s
    0x30b5, 0x30b7, 0x30b9, 0x30bb, 0x30bd,
    0x30b6, 0x30b8, 0x30ba, 0x30bc, 0x30be,
    # Hàng t
    0x30bf, 0x30c1, 0x30c4, 0x30c6, 0x30c8,
    0x30c0, 0x30c2, 0x30c5, 0x30c7, 0x30c9,
    # Hàng n
    0x30ca, 0x30cb, 0x30cc, 0x30cd, 0x30ce,
    # Hàng h
    0x30cf, 0x30d2, 0x30d5, 0x30d8, 0x30db,
    0x30d0, 0x30d3, 0x30d6, 0x30d9, 0x30dc,
    0x30d1, 0x30d4, 0x30d7, 0x30da, 0x30dd,
    # Hàng m
    0x30de, 0x30df, 0x30e0, 0x30e1, 0x30e2,
    # Hàng y
    0x30e4, 0x30e6, 0x30e8,
    # Hàng r
    0x30e9, 0x30ea, 0x30eb, 0x30ec, 0x30ed,
    # Hàng w và n
    0x30ef, 0x30f2, 0x30f3,
]

# Hợp nhất tất cả unicode cần seed
all_unicodes = set(hiragana_unicodes + katakana_unicodes)

def main():
    if not os.path.exists(KANA_DIR):
        print(f"❌ Không tìm thấy thư mục: {KANA_DIR}")
        return

    files = {int(f.split('.')[0]): f for f in os.listdir(KANA_DIR) if f.endswith('.svg')}
    print(f"Tìm thấy {len(files)} file SVG.")

    count = 0
    for decimal in sorted(all_unicodes):
        if decimal not in files:
            print(f"⚠️ Không tìm thấy file SVG cho unicode {decimal} (U+{decimal:04X})")
            continue

        filename = files[decimal]
        if decimal in hiragana_unicodes:
            ktype = 'hiragana'
        else:
            ktype = 'katakana'

        char = chr(decimal)
        with open(os.path.join(KANA_DIR, filename), 'r', encoding='utf-8') as f:
            svg_content = f.read()

        obj, created = KanaCharacter.objects.update_or_create(
            unicode_decimal=decimal,
            defaults={
                'character': char,
                'type': ktype,
                'svg_content': svg_content,
                'romanji': '',  # sẽ cập nhật sau
            }
        )
        if created:
            count += 1
            print(f"✅ Đã thêm: {char} ({ktype})")
        else:
            print(f"🔄 Đã cập nhật: {char} ({ktype})")

    print(f"Hoàn tất. Đã thêm/cập nhật {count} kana (tổng cộng {len(all_unicodes)} ký tự).")

if __name__ == '__main__':
    main()