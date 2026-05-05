import csv
from django.core.management.base import BaseCommand
from api.models import Vocabulary

class Command(BaseCommand):
    help = 'Import vocabulary from CSV/txt file (columns: class_name, topic, word, meaning, romaji, ex, trans [, image_url])'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to CSV/txt file (e.g., data.txt)')

    def handle(self, *args, **options):
        path = options['file_path']
        created = 0
        updated = 0

        try:
            with open(path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                # Kiểm tra xem file có cột image_url không
                has_image_url = 'image_url' in (reader.fieldnames or [])
                
                for row in reader:
                    class_name = row.get('class_name', '').strip()
                    if not class_name:
                        self.stdout.write(self.style.WARNING(f'Bỏ qua dòng thiếu class_name: {row}'))
                        continue

                    topic = row.get('topic', '').strip() or None
                    word = row.get('word', '').strip()
                    meaning = row.get('meaning', '').strip()
                    pronunciation = row.get('romaji', '').strip()
                    example_sentence = row.get('ex', '').strip()
                    example_translation = row.get('trans', '').strip()
                    
                    # Lấy image_url từ file nếu có, nếu không thì sinh ảnh mặc định
                    if has_image_url and row.get('image_url'):
                        image_url = row['image_url'].strip()
                    else:
                        # Fallback cho file cũ (7 cột)
                        image_url = f"https://api.dicebear.com/7.x/bottts/svg?seed={class_name}"

                    obj, is_created = Vocabulary.objects.update_or_create(
                        class_name=class_name,
                        defaults={
                            'topic': topic,
                            'word': word,
                            'meaning': meaning,
                            'pronunciation': pronunciation,
                            'example_sentence': example_sentence,
                            'example_translation': example_translation,
                            'image_url': image_url,
                            'reading_hiragana': None,
                        }
                    )

                    if is_created:
                        created += 1
                        self.stdout.write(self.style.SUCCESS(f'✓ Tạo mới: {class_name} - {word}'))
                    else:
                        updated += 1
                        self.stdout.write(f'~ Cập nhật: {class_name} - {word}')

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'Không tìm thấy file: {path}'))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Lỗi: {e}'))
            return

        self.stdout.write(self.style.SUCCESS(f'Hoàn tất! Tạo mới: {created}, Cập nhật: {updated}'))