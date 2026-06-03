// topicImages.js
import congtyImg from "../assets/topic/congty.png";
import connguoiImg from "../assets/topic/connguoi.png";
import cotheImg from "../assets/topic/cothe.png";
import daituImg from "../assets/topic/daitu.png";
import diadiemImg from "../assets/topic/diadiem.png";
import doanImg from "../assets/topic/doan.png";
import dodungImg from "../assets/topic/dodung.png";
import dongtuImg from "../assets/topic/dongtu.png";
import giadinhImg from "../assets/topic/giadinh.png";
import giaitriImg from "../assets/topic/giaitri.png";
import thitImg from "../assets/topic/thit.png";
import thegioiImg from "../assets/topic/thegioi.png";
import thoitietImg from "../assets/topic/thoitiet.jpg";
import trangthaiImg from "../assets/topic/trangthai.png";
import sodemImg from "../assets/topic/sodem.png";

// ---------- Map đầy đủ cho TẤT CẢ topic id (kể cả cái thiếu) ----------
export const localTopicImageMap = {
  // --- đã có sẵn ---
  congty: congtyImg,
  connguoi: connguoiImg,
  cothe: cotheImg,
  daitu: daituImg,
  diadiem: diadiemImg,
  doan: doanImg,
  dodung: dodungImg,
  dongtu: dongtuImg,
  giadinh: giadinhImg,
  giaitri: giaitriImg,
  thit: thitImg,
  thegioi: thegioiImg,
  thoitiet: thoitietImg,
  trangthai: trangthaiImg,
  sodem: sodemImg,

  // --- bổ sung các topic còn thiếu (dùng ảnh có sẵn phù hợp nhất) ---
  nghevan: daituImg,           // từ để hỏi -> dùng ảnh đại từ
  tunghevan: daituImg,
  tu_noi: daituImg,

  nhacua: dodungImg,           // nhà cửa -> đồ dùng
  dovan: dodungImg,
  vesinh: dodungImg,

  rau: doanImg,                // rau, gia vị -> đồ ăn
  luongthuc: doanImg,
  giavi: doanImg,

  dongvat: thegioiImg,         // động vật -> thế giới / thiên nhiên
  thiennhien: thegioiImg,
  mua: thoitietImg,            // mùa -> thời tiết

  thoigian: thoitietImg,       // thời gian (tạm mượn ảnh thời tiết)

  thanhpho: diadiemImg,        // địa điểm, thành phố, hướng -> địa điểm
  vitri: diadiemImg,
  huong: diadiemImg,
  kientruc: diadiemImg,

  giaothong: giaitriImg,       // giao thông (mượn giải trí nếu chưa có ảnh riêng)

  tinhtu: trangthaiImg,        // tính từ -> trạng thái
  tinhtu_i: trangthaiImg,
  tinhtu_na: trangthaiImg,

  hoc_tap: congtyImg,          // học tập -> công ty (phong cách)
  truonghoc: congtyImg,
  giaoduc: congtyImg,
  nghenghiep: congtyImg,
  it: congtyImg,

  mausac: dodungImg,           // màu sắc, quần áo -> đồ dùng
  quanao: dodungImg,
  phukien: dodungImg,
  dovat: dodungImg,
  vatlieu: dodungImg,
  khac: dodungImg,

  trangtu: daituImg,           // phó từ -> đại từ
  sothich: giaitriImg,         // sở thích -> giải trí
  extra: dodungImg,
};