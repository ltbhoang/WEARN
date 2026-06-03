import requests
import pymysql
import time
import re

# ===== CẤU HÌNH =====
PEXELS_API_KEY = "kvXkXtTQLDXTqIh7jXO45m1EbUPIHlwd3tu2iaZnesCNBdSCycQr3ju2"
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'den123456',
    'database': 'wearn',
    'port': 3306,
    'charset': 'utf8mb4'
}
# ====================

# Danh sách 55 class_name cần cập nhật lại ảnh
CLASS_NAMES = [
    "extra_train", "n5_pos_ushiro", "n5_place_depato", "extra_suitcase", "extra_laptop",
    "extra_scissors", "extra_dining_table", "extra_notebook", "extra_cup", "extra_fork",
    "n5_body_hoho", "extra_spoon", "n5_pro_anata", "extra_wine_glass", "extra_orange",
    "extra_remote_control", "extra_truck", "n5_v_narau", "n5_ppl_chichi", "extra_sink",
    "n5_sta_iru", "extra_oven", "n5_v_nugu", "extra_pizza", "extra_ruler",
    "extra_microwave", "extra_face_mask", "n5_adj_samui", "extra_pen", "extra_school_bag",
    "n5_ppl_obaasan", "n5_ppl_ojiisan", "n5_ppl_sofu", "extra_sandwich", "extra_cell_phone",
    "n5_time_gogo", "extra_handbag", "n5_sta_aru", "n5_v_kaburu", "extra_calculator",
    "extra_cake", "n5_verb_toru", "n5_pro_sore", "n5_adj_atatakai", "extra_umbrella",
    "n5_adj_atsui", "extra_chair", "n5_v_haku", "n5_adj_tsumetai", "n5_ppl_sobo",
    "extra_knife", "extra_wallet", "extra_usb_flash_drive", "n5_ppl_otousan", "n5_ppl_okaasan"
]

# Bổ sung mapping cho 55 meaning (giống cũ, nhưng tôi sẽ dùng lại)
EXTRA_MEANING_TO_EN = {
    "Tàu hỏa": "train",
    "sau": "behind",
    "TT thương mại": "department store",
    "Vali": "suitcase",
    "Máy tính xách tay": "laptop",
    "Cái kéo": "scissors",
    "Bàn ăn": "dining table",
    "Vở ghi chép": "notebook",
    "Cái cốc": "cup",
    "Cái nĩa": "fork",
    "má": "cheek",
    "Cái thìa": "spoon",
    "bạn": "you",
    "Ly rượu": "wine glass",
    "Quả cam": "orange",
    "Điều khiển": "remote control",
    "Xe tải": "truck",
    "học (từ người khác)": "learn from others",
    "bố (mình)": "my father",
    "Bồn rửa": "sink",
    "có (người/vật)": "exist",
    "Lò nướng": "oven",
    "cởi (đồ)": "take off clothes",
    "Bánh Pizza": "pizza",
    "Cây thước": "ruler",
    "Lò vi sóng": "microwave",
    "Khẩu trang": "mask",
    "lạnh (thời tiết)": "cold weather",
    "Bút mực": "pen",
    "Cặp sách": "school bag",
    "bà (người khác)": "grandmother",
    "ông (người khác)": "grandfather",
    "ông (mình)": "my grandfather",
    "Bánh mì kẹp": "sandwich",
    "Điện thoại di động": "mobile phone",
    "chiều (sau 12h)": "afternoon",
    "Túi xách": "handbag",
    "có (vật)": "there is",
    "đội (mũ)": "wear hat",
    "Máy tính bỏ túi": "calculator",
    "Bánh ngọt": "cake",
    "chụp (ảnh)": "take photo",
    "cái đó": "that",
    "ấm áp (thời tiết)": "warm weather",
    "Cái ô": "umbrella",
    "nóng (khi chạm vào)": "hot touch",
    "Cái ghế": "chair",
    "mặc (quần/giày)": "wear pants shoes",
    "lạnh (cảm giác)": "cold feeling",
    "bà (mình)": "my grandmother",
    "Con dao": "knife",
    "Cái ví": "wallet",
    "Cái USB": "USB flash drive",
    "bố (người khác)": "father",
    "mẹ (người khác)": "mother",
}

ISOLATED_TOPICS = {
    'dodung', 'doan', 'thit', 'rau', 'dongvat', 'dovan', 'phukien',
    'quanao', 'giaothong', 'thietbi', 'do dung', 'dung cu', 'thuc pham',
    'traicay', 'hoa qua', 'nuoc uong', 'do uong', 'banh keo', 'do choi'
}

def clean_meaning(meaning):
    if not meaning:
        return None
    return re.sub(r'\s*\([^)]*\)', '', meaning).strip()

def get_keyword_from_meaning(meaning):
    if not meaning:
        return None
    cleaned = clean_meaning(meaning)
    return EXTRA_MEANING_TO_EN.get(cleaned, None)

def normalize_keyword(kw):
    if not kw:
        return None
    return kw.strip().replace(' ', '+')[:100]

def get_pexels_image(keyword):
    url = "https://api.pexels.com/v1/search"
    headers = {"Authorization": PEXELS_API_KEY}
    params = {"query": keyword, "per_page": 1, "orientation": "square", "size": "medium"}
    try:
        r = requests.get(url, headers=headers, params=params, timeout=15)
        if r.status_code == 429:
            print("    ⏳ Rate limit, chờ 3600 giây...")
            time.sleep(3600)
            r = requests.get(url, headers=headers, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        if data.get("photos"):
            return data["photos"][0]["src"]["medium"]
    except Exception as e:
        print(f"    Lỗi API: {e}")
    return None

def main():
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Lấy thông tin cho các class_name trong danh sách
    placeholders = ','.join(['%s'] * len(CLASS_NAMES))
    query = f"""
        SELECT class_name, word, meaning, topic, pronunciation
        FROM api_vocabulary
        WHERE class_name IN ({placeholders})
        ORDER BY class_name
    """
    cursor.execute(query, CLASS_NAMES)
    rows = cursor.fetchall()
    total = len(rows)
    print(f"Cần cập nhật {total} từ (trong danh sách 55)\n")
    
    updated = 0
    for idx, (cn, word, meaning, topic, pronunciation) in enumerate(rows, 1):
        # Dùng meaning map
        keyword_en = get_keyword_from_meaning(meaning)
        source = "meaning"
        if not keyword_en:
            # Fallback dùng pronunciation
            if pronunciation:
                keyword_en = pronunciation.strip()
                source = "pronunciation"
            else:
                print(f"[{idx}/{total}] {cn} - {word}: không tìm được keyword -> bỏ qua")
                continue
        
        topic_lower = topic.lower() if topic else ''
        if topic_lower in ISOLATED_TOPICS:
            search_keyword = f"{keyword_en} isolated"
        else:
            search_keyword = keyword_en
        
        normalized = normalize_keyword(search_keyword)
        print(f"[{idx}/{total}] {cn} - {word} : '{meaning}' -> ({source}) '{normalized}'")
        img = get_pexels_image(normalized)
        if img:
            cursor.execute("UPDATE api_vocabulary SET image_url = %s WHERE class_name = %s", (img, cn))
            conn.commit()
            updated += 1
            print(f"    ✅ {img[:80]}...")
        else:
            # Thử fallback không isolated
            if "isolated" in search_keyword:
                fallback = normalize_keyword(keyword_en)
                print(f"    ⚠️ Thử fallback: '{fallback}'")
                img2 = get_pexels_image(fallback)
                if img2:
                    cursor.execute("UPDATE api_vocabulary SET image_url = %s WHERE class_name = %s", (img2, cn))
                    conn.commit()
                    updated += 1
                    print(f"    ✅ {img2[:80]}... (fallback)")
                else:
                    print(f"    ❌ Không tìm thấy ảnh")
            else:
                print(f"    ❌ Không tìm thấy ảnh")
        time.sleep(1.5)
    
    cursor.close()
    conn.close()
    print(f"\nHoàn tất! Đã cập nhật {updated}/{total} từ.")

if __name__ == "__main__":
    main()