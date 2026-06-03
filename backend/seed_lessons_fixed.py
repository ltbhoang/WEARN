#!/usr/bin/env python
import os
import sys
import django

# Thêm đường dẫn project vào sys.path
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Lesson, KanaCharacter, LessonKana

# Hiragana cơ bản
hiragana_basic = [
    ("Hiragana 1", ["あ","い","う","え","お"]),
    ("Hiragana 2", ["か","き","く","け","こ"]),
    ("Hiragana 3", ["さ","し","す","せ","そ"]),
    ("Hiragana 4", ["た","ち","つ","て","と"]),
    ("Hiragana 5", ["な","に","ぬ","ね","の"]),
    ("Hiragana 6", ["は","ひ","ふ","へ","ほ"]),
    ("Hiragana 7", ["ま","み","む","め","も"]),
    ("Hiragana 8", ["や","ゆ","よ"]),
    ("Hiragana 9", ["ら","り","る","れ","ろ"]),
    ("Hiragana 10", ["わ","を","ん"])
]

# Hiragana có dấu
hiragana_dakuon = [
    ("Hiragana 11", ["が","ぎ","ぐ","げ","ご"]),
    ("Hiragana 12", ["ざ","じ","ず","ぜ","ぞ"]),
    ("Hiragana 13", ["だ","ぢ","づ","で","ど"]),
    ("Hiragana 14", ["ば","び","ぶ","べ","ぼ"]),
    ("Hiragana 15", ["ぱ","ぴ","ぷ","ぺ","ぽ"])
]

# Katakana cơ bản
katakana_basic = [
    ("Katakana 1", ["ア","イ","ウ","エ","オ"]),
    ("Katakana 2", ["カ","キ","ク","ケ","コ"]),
    ("Katakana 3", ["サ","シ","ス","セ","ソ"]),
    ("Katakana 4", ["タ","チ","ツ","テ","ト"]),
    ("Katakana 5", ["ナ","ニ","ヌ","ネ","ノ"]),
    ("Katakana 6", ["ハ","ヒ","フ","ヘ","ホ"]),
    ("Katakana 7", ["マ","ミ","ム","メ","モ"]),
    ("Katakana 8", ["ヤ","ユ","ヨ"]),
    ("Katakana 9", ["ラ","リ","ル","レ","ロ"]),
    ("Katakana 10", ["ワ","ヲ","ン"])
]

# Katakana có dấu
katakana_dakuon = [
    ("Katakana 11", ["ガ","ギ","グ","ゲ","ゴ"]),
    ("Katakana 12", ["ザ","ジ","ズ","ゼ","ゾ"]),
    ("Katakana 13", ["ダ","ヂ","ヅ","デ","ド"]),
    ("Katakana 14", ["バ","ビ","ブ","ベ","ボ"]),
    ("Katakana 15", ["パ","ピ","プ","ペ","ポ"])
]

def seed_lessons(lessons_list, kana_type):
    for order, (name, chars) in enumerate(lessons_list, start=1):
        lesson, created = Lesson.objects.get_or_create(
            name=name,
            defaults={'order': order}
        )
        LessonKana.objects.filter(lesson=lesson).delete()
        for idx, char in enumerate(chars):
            kana = KanaCharacter.objects.filter(character=char, type=kana_type).first()
            if kana:
                LessonKana.objects.create(lesson=lesson, kana=kana, order=idx)
            else:
                print(f"⚠️ Không tìm thấy {kana_type}: '{char}' (bài {name})")
        print(f"{'Tạo mới' if created else 'Cập nhật'}: {name} (đã thêm {len(chars)} kana)")

if __name__ == '__main__':
    kana_count = KanaCharacter.objects.count()
    if kana_count == 0:
        print("❌ Chưa có dữ liệu KanaCharacter. Hãy chạy python seed_kana.py trước.")
        sys.exit(1)
    print(f"✓ Đã tìm thấy {kana_count} kana trong database.\n")
    
    print("Seeding Hiragana cơ bản...")
    seed_lessons(hiragana_basic, 'hiragana')
    print("\nSeeding Hiragana có dấu...")
    seed_lessons(hiragana_dakuon, 'hiragana')
    print("\nSeeding Katakana cơ bản...")
    seed_lessons(katakana_basic, 'katakana')
    print("\nSeeding Katakana có dấu...")
    seed_lessons(katakana_dakuon, 'katakana')
    print("\n✅ Hoàn tất seed lessons đầy đủ")