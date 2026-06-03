import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')  # Thay 'backend' bằng tên project của bạn
django.setup()

from api.models import Vocabulary, LearningProgress
from django.contrib.auth.models import User

user = User.objects.get(username='demo')

extra_data = {
    'apple': {'word': 'りんご (林檎)', 'meaning': 'Quả táo', 'pronunciation': 'ringo', 'example_sentence': 'りんごを一つ食べます。', 'example_translation': 'Tôi ăn một quả táo.'},
    'backpack': {'word': 'リュックサック', 'meaning': 'Ba lô', 'pronunciation': 'ryukkusakku', 'example_sentence': '新しいリュックサックを買いました。', 'example_translation': 'Tôi đã mua một cái ba lô mới.'},
    'banana': {'word': 'バナナ', 'meaning': 'Quả chuối', 'pronunciation': 'banana', 'example_sentence': 'バナナは甘くておいしいです。', 'example_translation': 'Chuối ngọt và ngon.'},
    'bed': {'word': 'ベッド', 'meaning': 'Cái giường', 'pronunciation': 'beddo', 'example_sentence': 'ベッドで寝ます。', 'example_translation': 'Ngủ trên giường.'},
    'bicycle': {'word': '自転車', 'meaning': 'Xe đạp', 'pronunciation': 'jitensha', 'example_sentence': '学校へ自転車で行きます。', 'example_translation': 'Tôi đi học bằng xe đạp.'},
    'bird': {'word': '鳥', 'meaning': 'Con chim', 'pronunciation': 'tori', 'example_sentence': '空に鳥が飛んでいます。', 'example_translation': 'Chim đang bay trên trời.'},
    'book': {'word': '本', 'meaning': 'Quyển sách', 'pronunciation': 'hon', 'example_sentence': '毎日、本を読みます。', 'example_translation': 'Mỗi ngày tôi đều đọc sách.'},
    'bottle': {'word': '瓶 / ボトル', 'meaning': 'Cái chai', 'pronunciation': 'bin / botoru', 'example_sentence': '水のボトル。', 'example_translation': 'Chai nước.'},
    'bowl': {'word': '茶碗 / 丼', 'meaning': 'Cái bát', 'pronunciation': 'chawan / donburi', 'example_sentence': 'ご飯を茶碗に入れます。', 'example_translation': 'Cho cơm vào bát.'},
    'bus': {'word': 'バス', 'meaning': 'Xe buýt', 'pronunciation': 'basu', 'example_sentence': 'バスで会社に行きます。', 'example_translation': 'Tôi đi làm bằng xe buýt.'},
    'cake': {'word': 'ケーキ', 'meaning': 'Bánh ngọt', 'pronunciation': 'kēki', 'example_sentence': '誕生日にケーキを食べます。', 'example_translation': 'Ăn bánh ngọt vào ngày sinh nhật.'},
    'calculator': {'word': '電卓', 'meaning': 'Máy tính bỏ túi', 'pronunciation': 'dentaku', 'example_sentence': '電卓で計算します。', 'example_translation': 'Tính toán bằng máy tính.'},
    'car': {'word': '車', 'meaning': 'Ô tô', 'pronunciation': 'kuruma', 'example_sentence': '青い車が好きです。', 'example_translation': 'Tôi thích ô tô màu xanh.'},
    'cat': {'word': '猫', 'meaning': 'Con mèo', 'pronunciation': 'neko', 'example_sentence': '猫が庭にいます。', 'example_translation': 'Có con mèo ở trong sân.'},
    'cell_phone': {'word': '携帯電話 / スマホ', 'meaning': 'Điện thoại di động', 'pronunciation': 'keitai denwa', 'example_sentence': '携帯電話を忘れました。', 'example_translation': 'Tôi quên điện thoại rồi.'},
    'chair': {'word': '椅子', 'meaning': 'Cái ghế', 'pronunciation': 'isu', 'example_sentence': '椅子に座ってください。', 'example_translation': 'Mời ngồi xuống ghế.'},
    'clock': {'word': '時計', 'meaning': 'Đồng hồ', 'pronunciation': 'tokei', 'example_sentence': '壁に時計があります。', 'example_translation': 'Có cái đồng hồ trên tường.'},
    'cup': {'word': 'コップ', 'meaning': 'Cái cốc', 'pronunciation': 'koppu', 'example_sentence': 'コップに水を入れます。', 'example_translation': 'Cho nước vào cốc.'},
    'dining_table': {'word': '食卓', 'meaning': 'Bàn ăn', 'pronunciation': 'shokutaku', 'example_sentence': '食卓を囲んで食事します。', 'example_translation': 'Ăn cơm quanh bàn ăn.'},
    'dog': {'word': '犬', 'meaning': 'Con chó', 'pronunciation': 'inu', 'example_sentence': '犬と散歩します。', 'example_translation': 'Đi dạo với chó.'},
    'eraser': {'word': '消しゴム', 'meaning': 'Cục tẩy', 'pronunciation': 'keshigomu', 'example_sentence': '消しゴムを貸してください。', 'example_translation': 'Cho tôi mượn cục tẩy.'},
    'fork': {'word': 'フォーク', 'meaning': 'Cái nĩa', 'pronunciation': 'fōku', 'example_sentence': 'フォークでパスタを食べます。', 'example_translation': 'Ăn mì Ý bằng nĩa.'},
    'handbag': {'word': 'ハンドバッグ', 'meaning': 'Túi xách', 'pronunciation': 'handobaggu', 'example_sentence': '彼女はハンドバッグを持っています。', 'example_translation': 'Cô ấy đang cầm túi xách.'},
    'keyboard': {'word': 'キーボード', 'meaning': 'Bàn phím', 'pronunciation': 'kībōdo', 'example_sentence': 'パソコンのキーボード。', 'example_translation': 'Bàn phím máy tính.'},
    'knife': {'word': 'ナイフ', 'meaning': 'Con dao', 'pronunciation': 'naifu', 'example_sentence': 'ナイフで肉を切ります。', 'example_translation': 'Cắt thịt bằng dao.'},
    'laptop': {'word': 'ノートパソコン', 'meaning': 'Máy tính xách tay', 'pronunciation': 'nōto pasokon', 'example_sentence': 'ノートパソコンで仕事をします。', 'example_translation': 'Làm việc bằng laptop.'},
    'microwave': {'word': '電子レンジ', 'meaning': 'Lò vi sóng', 'pronunciation': 'denshi renji', 'example_sentence': '電子レンジで温めます。', 'example_translation': 'Hâm nóng bằng lò vi sóng.'},
    'mouse': {'word': 'マウス', 'meaning': 'Con chuột (máy tính)', 'pronunciation': 'mausu', 'example_sentence': 'マウスの調子が悪いです。', 'example_translation': 'Con chuột đang có vấn đề.'},
    'notebook': {'word': 'ノート', 'meaning': 'Vở ghi chép', 'pronunciation': 'nōto', 'example_sentence': 'ノートにメモを書きます。', 'example_translation': 'Viết ghi chú vào vở.'},
    'orange': {'word': 'オレンジ / みかん', 'meaning': 'Quả cam', 'pronunciation': 'orenji / mikan', 'example_sentence': 'みかんを食べます。', 'example_translation': 'Ăn quýt/cam.'},
    'oven': {'word': 'オーブン', 'meaning': 'Lò nướng', 'pronunciation': 'ōbun', 'example_sentence': 'オーブンでクッキーを焼きます。', 'example_translation': 'Nướng bánh quy bằng lò nướng.'},
    'pen': {'word': 'ペン', 'meaning': 'Bút mực', 'pronunciation': 'pen', 'example_sentence': '黒いペンで書きます。', 'example_translation': 'Viết bằng bút đen.'},
    'pencil': {'word': '鉛筆', 'meaning': 'Bút chì', 'pronunciation': 'enpitsu', 'example_sentence': '鉛筆を削ります。', 'example_translation': 'Gọt bút chì.'},
    'pizza': {'word': 'ピザ', 'meaning': 'Bánh Pizza', 'pronunciation': 'piza', 'example_sentence': 'ピザを注文しましょう。', 'example_translation': 'Hãy đặt pizza đi.'},
    'refrigerator': {'word': '冷蔵庫', 'meaning': 'Tủ lạnh', 'pronunciation': 'reizōko', 'example_sentence': 'ビールは冷蔵庫にあります。', 'example_translation': 'Bia có trong tủ lạnh.'},
    'ruler': {'word': '定規', 'meaning': 'Cây thước', 'pronunciation': 'jōgi', 'example_sentence': '定規で線を引きます。', 'example_translation': 'Kẻ đường thẳng bằng thước.'},
    'sandwich': {'word': 'サンドイッチ', 'meaning': 'Bánh mì kẹp', 'pronunciation': 'sandoitchi', 'example_sentence': '朝食にサンドイッチを食べます。', 'example_translation': 'Ăn sandwich cho bữa sáng.'},
    'school_bag': {'word': '通学カバン / ランドセル', 'meaning': 'Cặp sách', 'pronunciation': 'tsūgaku kaban', 'example_sentence': '通学カバンを背負います。', 'example_translation': 'Đeo cặp đi học.'},
    'scissors': {'word': 'はさみ', 'meaning': 'Cái kéo', 'pronunciation': 'hasami', 'example_sentence': 'はさみで紙を切ります。', 'example_translation': 'Cắt giấy bằng kéo.'},
    'sink': {'word': '流し台 / シンク', 'meaning': 'Bồn rửa', 'pronunciation': 'nagashidai', 'example_sentence': '台所の流し台。', 'example_translation': 'Bồn rửa trong bếp.'},
    'spoon': {'word': 'スプーン', 'meaning': 'Cái thìa', 'pronunciation': 'supūn', 'example_sentence': 'スプーンでカレーを食べます。', 'example_translation': 'Ăn cà ri bằng thìa.'},
    'suitcase': {'word': 'スーツケース', 'meaning': 'Vali', 'pronunciation': 'sūtsukēsu', 'example_sentence': '旅行の準備でスーツケースを詰めます。', 'example_translation': 'Xếp đồ vào vali để đi du lịch.'},
    'train': {'word': '電車', 'meaning': 'Tàu hỏa', 'pronunciation': 'densha', 'example_sentence': '電車が駅に到着します。', 'example_translation': 'Tàu hỏa đến ga.'},
    'truck': {'word': 'トラック', 'meaning': 'Xe tải', 'pronunciation': 'torakku', 'example_sentence': '大きなトラックが通ります。', 'example_translation': 'Xe tải lớn đi qua.'},
    'tv': {'word': 'テレビ', 'meaning': 'Tivi', 'pronunciation': 'terebi', 'example_sentence': '夜にテレビを見ます。', 'example_translation': 'Xem tivi vào buổi tối.'},
    'umbrella': {'word': '傘', 'meaning': 'Cái ô', 'pronunciation': 'kasa', 'example_sentence': '雨が降ったので傘をさします。', 'example_translation': 'Trời mưa nên tôi che ô.'},
    'wine_glass': {'word': 'ワイングラス', 'meaning': 'Ly rượu', 'pronunciation': 'waingurasu', 'example_sentence': 'ワイングラスを洗います。', 'example_translation': 'Rửa ly rượu.'},
    'face_mask': {'word': 'マスク', 'meaning': 'Khẩu trang', 'pronunciation': 'masuku', 'example_sentence': '外出時はマスクをします。', 'example_translation': 'Đeo khẩu trang khi đi ra ngoài.'},
    'key': {'word': '鍵', 'meaning': 'Chìa khóa', 'pronunciation': 'kagi', 'example_sentence': '家の鍵を失くしました。', 'example_translation': 'Tôi làm mất chìa khóa nhà rồi.'},
    'remote_control': {'word': 'リモコン', 'meaning': 'Điều khiển', 'pronunciation': 'rimokon', 'example_sentence': 'テレビのリモコン。', 'example_translation': 'Điều khiển tivi.'},
    'usb_flash_drive': {'word': 'USBメモリ', 'meaning': 'Cái USB', 'pronunciation': 'USB memori', 'example_sentence': 'データをUSBメモリに保存します。', 'example_translation': 'Lưu dữ liệu vào USB.'},
    'wallet': {'word': '財布', 'meaning': 'Cái ví', 'pronunciation': 'saifu', 'example_sentence': '財布にお金を入れます。', 'example_translation': 'Cho tiền vào ví.'},
}

# Thêm từ mới
extra_created = 0
for key, data in extra_data.items():
    class_name = f'extra_{key}'
    obj, created = Vocabulary.objects.get_or_create(
        class_name=class_name,
        defaults={
            'topic': 'extra',
            'word': data['word'],
            'meaning': data['meaning'],
            'pronunciation': data['pronunciation'],
            'example_sentence': data['example_sentence'],
            'example_translation': data['example_translation'],
            'image_url': f"https://api.dicebear.com/7.x/bottts/svg?seed={class_name}",
            'reading_hiragana': None,
        }
    )
    if created:
        extra_created += 1
        print(f'✓ Tạo mới: {class_name}')

print(f'Đã thêm {extra_created} từ extra vào Vocabulary.')

# Tạo LearningProgress cho những từ chưa có (chỉ cho user demo)
all_vocabs = Vocabulary.objects.all()
progress_created = 0
for vocab in all_vocabs:
    _, created = LearningProgress.objects.get_or_create(
        user=user,
        vocabulary=vocab,
        defaults={'status': 'learning', 'review_count': 0}
    )
    if created:
        progress_created += 1

print(f'Tổng số từ vựng hiện tại: {all_vocabs.count()}')
print(f'Đã tạo {progress_created} LearningProgress mới cho user {user.username}.')