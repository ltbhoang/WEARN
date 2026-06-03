import os
import sys
import django

# Thiết lập môi trường Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import KanaCharacter
import pykakasi

def update_romanji():
    # Khởi tạo bộ chuyển đổi
    kks = pykakasi.kakasi()
    
    # Lấy tất cả bản ghi
    kanas = KanaCharacter.objects.all()
    count = 0
    
    for k in kanas:
        if k.character:
            # Chuyển ký tự sang romaji (Hepburn)
            result = kks.convert(k.character)
            # Lấy phần 'hepburn' từ kết quả
            romanji = ''.join([item['hepburn'] for item in result])
            # Chỉ cập nhật nếu khác
            if k.romanji != romanji:
                k.romanji = romanji
                k.save()
                count += 1
                print(f"{k.character} -> {romanji}")
    
    print(f"Đã cập nhật {count} bản ghi.")

if __name__ == '__main__':
    update_romanji()
    