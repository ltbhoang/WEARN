# import os
# import sys
# import django
# from gtts import gTTS

# sys.path.append(os.path.dirname(os.path.abspath(__file__)))
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
# django.setup()

# from api.models import Vocabulary

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
# AUDIO_DIR = os.path.join(MEDIA_ROOT, 'kana_audio')
# os.makedirs(AUDIO_DIR, exist_ok=True)

# def generate_audio_for_vocab(vocab, force=False):
#     # Tạo tên file dựa trên id hoặc class_name để đảm bảo unique
#     filename = f"{vocab.id}_{vocab.word}.mp3"
#     filepath = os.path.join(AUDIO_DIR, filename)
    
#     if not force and os.path.exists(filepath):
#         print(f"⏭️ Bỏ qua {vocab.word} (file đã tồn tại)")
#         return filepath
    
#     if force and os.path.exists(filepath):
#         os.remove(filepath)
#         print(f"🗑️ Đã xóa file cũ: {filename}")
    
#     try:
#         # Dùng chính từ vựng để đọc. Có thể dùng pronunciation nếu muốn
#         # Lưu ý: Nếu từ có cả Kanji, nên dùng trường `reading_hiragana` để đọc chuẩn hơn
#         text_to_read = vocab.reading_hiragana if vocab.reading_hiragana else vocab.word
#         tts = gTTS(text=text_to_read, lang='ja', slow=False)
#         tts.save(filepath)
#         print(f"✅ Đã tạo audio cho {vocab.word} (giọng Nhật)")
#         return filepath
#     except Exception as e:
#         print(f"❌ Lỗi tạo audio cho {vocab.word}: {e}")
#         return None

# def main():
#     force = '--force' in sys.argv
#     vocab_list = Vocabulary.objects.all()
#     print(f"Bắt đầu tạo audio cho {len(vocab_list)} từ. Force={force}")
    
#     for vocab in vocab_list:
#         audio_path = generate_audio_for_vocab(vocab, force=force)
#         if audio_path:
#             relative_path = os.path.join('vocab_audio', os.path.basename(audio_path))
#             if vocab.audio != relative_path:
#                 vocab.audio = relative_path
#                 vocab.save(update_fields=['audio'])
#                 print(f"🔊 Đã cập nhật DB cho {vocab.word}")

# if __name__ == '__main__':
#     main()

import os
import sys
import django
from gtts import gTTS

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import KanaCharacter

BASE_DIR = '/app'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
AUDIO_DIR = os.path.join(MEDIA_ROOT, 'kana_audio')
os.makedirs(AUDIO_DIR, exist_ok=True)

def generate_audio_for_kana(kana, force=False):
    filename = f"{kana.id}_{kana.character}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)
    
    if not force and os.path.exists(filepath):
        print(f"⏭️ Bỏ qua {kana.character} (file đã tồn tại)")
        return filepath
    
    if force and os.path.exists(filepath):
        os.remove(filepath)
        print(f"🗑️ Đã xóa file cũ: {filename}")
    
    # Dùng romaji để đọc (âm thanh tiếng Nhật)
    text_to_read = kana.romanji if kana.romanji else kana.character
    try:
        tts = gTTS(text=text_to_read, lang='ja', slow=False)
        tts.save(filepath)
        print(f"✅ Đã tạo audio cho {kana.character} ({kana.type}) - {text_to_read}")
        return filepath
    except Exception as e:
        print(f"❌ Lỗi tạo audio cho {kana.character}: {e}")
        return None

def main():
    force = '--force' in sys.argv
    kana_list = KanaCharacter.objects.all()
    print(f"Bắt đầu tạo audio cho {len(kana_list)} kana. Force={force}")
    
    for kana in kana_list:
        audio_path = generate_audio_for_kana(kana, force=force)
        if audio_path:
            # Nếu model KanaCharacter có trường audio, cập nhật; nếu không thì bỏ qua
            # Ở đây giả sử bạn có trường audio, nếu không có thì comment dòng dưới
            relative_path = os.path.join('kana_audio', os.path.basename(audio_path))
            if hasattr(kana, 'audio') and kana.audio != relative_path:
                kana.audio = relative_path
                kana.save(update_fields=['audio'])
                print(f"🔊 Đã cập nhật DB cho {kana.character}")

if __name__ == '__main__':
    main()