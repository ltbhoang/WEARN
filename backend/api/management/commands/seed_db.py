import uuid
import random
from datetime import date, timedelta
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.management.base import BaseCommand
from api.models import Collection, Vocabulary, SavedVocabulary, LearningProgress

class Command(BaseCommand):
    help = 'Seed database with sample data for the new architecture'

    def handle(self, *args, **kwargs):
        # 1. Tạo user demo
        user, created = User.objects.get_or_create(
            username='demo',
            defaults={
                'email': 'demo@example.com',
                'first_name': 'Demo',
                'last_name': 'User',
            }
        )
        if created:
            user.set_password('demo123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created demo user'))

        # Xóa dữ liệu cũ của user demo
        Collection.objects.filter(user=user).delete()
        LearningProgress.objects.filter(user=user).delete()

        # 2. Dữ liệu từ vựng tiếng Nhật chi tiết
        japanese_vocab_data = {
            'apple': {'word': 'りんご (林檎)', 'meaning': 'Quả táo', 'romaji': 'ringo', 'ex': 'りんごを一つ食べます。', 'trans': 'Tôi ăn một quả táo.'},
            'backpack': {'word': 'リュックサック', 'meaning': 'Ba lô', 'romaji': 'ryukkusakku', 'ex': '新しいリュックサックを買いました。', 'trans': 'Tôi đã mua một cái ba lô mới.'},
            'banana': {'word': 'バナナ', 'meaning': 'Quả chuối', 'romaji': 'banana', 'ex': 'バナナは甘くておいしいです。', 'trans': 'Chuối ngọt và ngon.'},
            'bed': {'word': 'ベッド', 'meaning': 'Cái giường', 'romaji': 'beddo', 'ex': 'ベッドで寝ます。', 'trans': 'Ngủ trên giường.'},
            'bicycle': {'word': '自転車', 'meaning': 'Xe đạp', 'romaji': 'jitensha', 'ex': '学校へ自転車で行きます。', 'trans': 'Tôi đi học bằng xe đạp.'},
            'bird': {'word': '鳥', 'meaning': 'Con chim', 'romaji': 'tori', 'ex': '空に鳥が飛んでいます。', 'trans': 'Chim đang bay trên trời.'},
            'book': {'word': '本', 'meaning': 'Quyển sách', 'romaji': 'hon', 'ex': '毎日、本を読みます。', 'trans': 'Mỗi ngày tôi đều đọc sách.'},
            'bottle': {'word': '瓶 / ボトル', 'meaning': 'Cái chai', 'romaji': 'bin / botoru', 'ex': '水のボトル。', 'trans': 'Chai nước.'},
            'bowl': {'word': '茶碗 / 丼', 'meaning': 'Cái bát', 'romaji': 'chawan / donburi', 'ex': 'ご飯を茶碗に入れます。', 'trans': 'Cho cơm vào bát.'},
            'bus': {'word': 'バス', 'meaning': 'Xe buýt', 'romaji': 'basu', 'ex': 'バスで会社に行きます。', 'trans': 'Tôi đi làm bằng xe buýt.'},
            'cake': {'word': 'ケーキ', 'meaning': 'Bánh ngọt', 'romaji': 'kēki', 'ex': '誕生日にケーキを食べます。', 'trans': 'Ăn bánh ngọt vào ngày sinh nhật.'},
            'calculator': {'word': '電卓', 'meaning': 'Máy tính bỏ túi', 'romaji': 'dentaku', 'ex': '電卓で計算します。', 'trans': 'Tính toán bằng máy tính.'},
            'car': {'word': '車', 'meaning': 'Ô tô', 'romaji': 'kuruma', 'ex': '青い車が好きです。', 'trans': 'Tôi thích ô tô màu xanh.'},
            'cat': {'word': '猫', 'meaning': 'Con mèo', 'romaji': 'neko', 'ex': '猫が庭にいます。', 'trans': 'Có con mèo ở trong sân.'},
            'cell_phone': {'word': '携帯電話 / スマホ', 'meaning': 'Điện thoại di động', 'romaji': 'keitai denwa', 'ex': '携帯電話を忘れました。', 'trans': 'Tôi quên điện thoại rồi.'},
            'chair': {'word': '椅子', 'meaning': 'Cái ghế', 'romaji': 'isu', 'ex': '椅子に座ってください。', 'trans': 'Mời ngồi xuống ghế.'},
            'clock': {'word': '時計', 'meaning': 'Đồng hồ', 'romaji': 'tokei', 'ex': '壁に時計があります。', 'trans': 'Có cái đồng hồ trên tường.'},
            'cup': {'word': 'コップ', 'meaning': 'Cái cốc', 'romaji': 'koppu', 'ex': 'コップに水を入れます。', 'trans': 'Cho nước vào cốc.'},
            'dining_table': {'word': '食卓', 'meaning': 'Bàn ăn', 'romaji': 'shokutaku', 'ex': '食卓を囲んで食事します。', 'trans': 'Ăn cơm quanh bàn ăn.'},
            'dog': {'word': '犬', 'meaning': 'Con chó', 'romaji': 'inu', 'ex': '犬と散歩します。', 'trans': 'Đi dạo với chó.'},
            'eraser': {'word': '消しゴム', 'meaning': 'Cục tẩy', 'romaji': 'keshigomu', 'ex': '消しゴムを貸してください。', 'trans': 'Cho tôi mượn cục tẩy.'},
            'fork': {'word': 'フォーク', 'meaning': 'Cái nĩa', 'romaji': 'fōku', 'ex': 'フォークでパスタを食べます。', 'trans': 'Ăn mì Ý bằng nĩa.'},
            'handbag': {'word': 'ハンドバッグ', 'meaning': 'Túi xách', 'romaji': 'handobaggu', 'ex': '彼女はハンドバッグを持っています。', 'trans': 'Cô ấy đang cầm túi xách.'},
            'keyboard': {'word': 'キーボード', 'meaning': 'Bàn phím', 'romaji': 'kībōdo', 'ex': 'パソコンのキーボード。', 'trans': 'Bàn phím máy tính.'},
            'knife': {'word': 'ナイフ', 'meaning': 'Con dao', 'romaji': 'naifu', 'ex': 'ナイフで肉を切ります。', 'trans': 'Cắt thịt bằng dao.'},
            'laptop': {'word': 'ノートパソコン', 'meaning': 'Máy tính xách tay', 'romaji': 'nōto pasokon', 'ex': 'ノートパソコンで仕事をします。', 'trans': 'Làm việc bằng laptop.'},
            'microwave': {'word': '電子レンジ', 'meaning': 'Lò vi sóng', 'romaji': 'denshi renji', 'ex': '電子レンジで温めます。', 'trans': 'Hâm nóng bằng lò vi sóng.'},
            'mouse': {'word': 'マウス', 'meaning': 'Con chuột (máy tính)', 'romaji': 'mausu', 'ex': 'マウスの調子が悪いです。', 'trans': 'Con chuột đang có vấn đề.'},
            'notebook': {'word': 'ノート', 'meaning': 'Vở ghi chép', 'romaji': 'nōto', 'ex': 'ノートにメモを書きます。', 'trans': 'Viết ghi chú vào vở.'},
            'orange': {'word': 'オレンジ / みかん', 'meaning': 'Quả cam', 'romaji': 'orenji / mikan', 'ex': 'みかんを食べます。', 'trans': 'Ăn quýt/cam.'},
            'oven': {'word': 'オーブン', 'meaning': 'Lò nướng', 'romaji': 'ōbun', 'ex': 'オーブンでクッキーを焼きます。', 'trans': 'Nướng bánh quy bằng lò nướng.'},
            'pen': {'word': 'ペン', 'meaning': 'Bút mực', 'romaji': 'pen', 'ex': '黒いペンで書きます。', 'trans': 'Viết bằng bút đen.'},
            'pencil': {'word': '鉛筆', 'meaning': 'Bút chì', 'romaji': 'enpitsu', 'ex': '鉛筆を削ります。', 'trans': 'Gọt bút chì.'},
            'pizza': {'word': 'ピザ', 'meaning': 'Bánh Pizza', 'romaji': 'piza', 'ex': 'ピザを注文しましょう。', 'trans': 'Hãy đặt pizza đi.'},
            'refrigerator': {'word': '冷蔵庫', 'meaning': 'Tủ lạnh', 'romaji': 'reizōko', 'ex': 'ビールは冷蔵庫にあります。', 'trans': 'Bia có trong tủ lạnh.'},
            'ruler': {'word': '定規', 'meaning': 'Cây thước', 'romaji': 'jōgi', 'ex': '定規で線を引きます。', 'trans': 'Kẻ đường thẳng bằng thước.'},
            'sandwich': {'word': 'サンドイッチ', 'meaning': 'Bánh mì kẹp', 'romaji': 'sandoitchi', 'ex': '朝食にサンドイッチを食べます。', 'trans': 'Ăn sandwich cho bữa sáng.'},
            'school_bag': {'word': '通学カバン / ランドセル', 'meaning': 'Cặp sách', 'romaji': 'tsūgaku kaban', 'ex': '通学カバンを背負います。', 'trans': 'Đeo cặp đi học.'},
            'scissors': {'word': 'はさみ', 'meaning': 'Cái kéo', 'romaji': 'hasami', 'ex': 'はさみで紙を切ります。', 'trans': 'Cắt giấy bằng kéo.'},
            'sink': {'word': '流し台 / シンク', 'meaning': 'Bồn rửa', 'romaji': 'nagashidai', 'ex': '台所の流し台。', 'trans': 'Bồn rửa trong bếp.'},
            'spoon': {'word': 'スプーン', 'meaning': 'Cái thìa', 'romaji': 'supūn', 'ex': 'スプーンでカレーを食べます。', 'trans': 'Ăn cà ri bằng thìa.'},
            'suitcase': {'word': 'スーツケース', 'meaning': 'Vali', 'romaji': 'sūtsukēsu', 'ex': '旅行の準備でスーツケースを詰めます。', 'trans': 'Xếp đồ vào vali để đi du lịch.'},
            'train': {'word': '電車', 'meaning': 'Tàu hỏa', 'romaji': 'densha', 'ex': '電車が駅に到着します。', 'trans': 'Tàu hỏa đến ga.'},
            'truck': {'word': 'トラック', 'meaning': 'Xe tải', 'romaji': 'torakku', 'ex': '大きなトラックが通ります。', 'trans': 'Xe tải lớn đi qua.'},
            'tv': {'word': 'テレビ', 'meaning': 'Tivi', 'romaji': 'terebi', 'ex': '夜にテレビを見ます。', 'trans': 'Xem tivi vào buổi tối.'},
            'umbrella': {'word': '傘', 'meaning': 'Cái ô', 'romaji': 'kasa', 'ex': '雨が降ったので傘をさします。', 'trans': 'Trời mưa nên tôi che ô.'},
            'wine_glass': {'word': 'ワイングラス', 'meaning': 'Ly rượu', 'romaji': 'waingurasu', 'ex': 'ワイングラスを洗います。', 'trans': 'Rửa ly rượu.'},
            'face_mask': {'word': 'マスク', 'meaning': 'Khẩu trang', 'romaji': 'masuku', 'ex': '外出時はマスクをします。', 'trans': 'Đeo khẩu trang khi đi ra ngoài.'},
            'key': {'word': '鍵', 'meaning': 'Chìa khóa', 'romaji': 'kagi', 'ex': '家の鍵を失くしました。', 'trans': 'Tôi làm mất chìa khóa nhà rồi.'},
            'remote_control': {'word': 'リモコン', 'meaning': 'Điều khiển', 'romaji': 'rimokon', 'ex': 'テレビのリモコン。', 'trans': 'Điều khiển tivi.'},
            'usb_flash_drive': {'word': 'USBメモリ', 'meaning': 'Cái USB', 'romaji': 'USB memori', 'ex': 'データをUSBメモリに保存します。', 'trans': 'Lưu dữ liệu vào USB.'},
            'wallet': {'word': '財布', 'meaning': 'Cái ví', 'romaji': 'saifu', 'ex': '財布にお金を入れます。', 'trans': 'Cho tiền vào ví.'},
        }

        created_vocabs = []
        for c_name, data in japanese_vocab_data.items():
            obj, _ = Vocabulary.objects.update_or_create(
                class_name=c_name,
                defaults={
                    'word': data['word'],
                    'meaning': data['meaning'],
                    'pronunciation': data['romaji'],
                    'example_sentence': data['ex'],
                    'example_translation': data['trans'],  # Trường mới
                    'image_url': f"https://api.dicebear.com/7.x/bottts/svg?seed={c_name}"
                }
            )
            created_vocabs.append(obj)

        self.stdout.write(self.style.SUCCESS(f'System Vocabulary is ready ({len(created_vocabs)} words)'))

        # 3. Tạo Collection và SavedVocabulary cho 7 ngày qua
        today = date.today()
        status_choices = ['learning', 'review', 'mastered']
        collections_created = 0

        for i in range(7):
            d = today - timedelta(days=i)
            title = "Hôm nay" if i == 0 else "Hôm qua" if i == 1 else d.strftime("%d Tháng %m")

            collection = Collection.objects.create(
                user=user,
                date_key=d,
                title=title
            )
            collections_created += 1

            # Chọn ngẫu nhiên 2-4 từ từ danh sách
            selected_vocabs = random.sample(created_vocabs, random.randint(2, min(4, len(created_vocabs))))

            for vocab in selected_vocabs:
                SavedVocabulary.objects.create(
                    collection=collection,
                    vocabulary=vocab,
                    user_image=f"https://picsum.photos/300/200?random={random.randint(1,1000)}"
                )

                LearningProgress.objects.update_or_create(
                    user=user,
                    vocabulary=vocab,
                    defaults={
                        "status": random.choice(status_choices),
                        "review_count": random.randint(0, 10),
                        "last_reviewed": timezone.now() - timedelta(hours=random.randint(1, 48))
                    }
                )

        self.stdout.write(self.style.SUCCESS(
            f'Successfully seeded {collections_created} collections for user {user.username}'
        ))