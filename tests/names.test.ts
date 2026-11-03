import { describe, expect, it } from 'vitest';
import { EN_NAME_COUNT, type NameSource, nameToHangul } from '../src/lib/hangul/names';

const one = (name: string, src: NameSource) => nameToHangul(name, src).map((p) => p.hangul).join(' ');
const HANGUL_ONLY = /^[가-힣]*$/;

const check = (src: NameSource, cases: Record<string, string>) => {
  for (const [input, hangul] of Object.entries(cases)) {
    it(`${input} → ${hangul}`, () => {
      const parts = nameToHangul(input, src);
      expect(parts.map((p) => p.hangul).join(' ')).toBe(hangul);
      for (const p of parts) expect(p.hangul).toMatch(HANGUL_ONLY);
    });
  }
};

describe('nameToHangul – tiếng Việt', () => {
  check('vi', {
    Nguyễn: '응우옌', Trần: '쩐', Lê: '레', Phạm: '팜', Hoàng: '호앙', Huỳnh: '후인', Phan: '판', Vũ: '부', Võ: '보',
    Đặng: '당', Bùi: '부이', Đỗ: '도', Hồ: '호', Ngô: '응오', Dương: '즈엉', Lý: '리', Đào: '다오', Anh: '아인',
    Minh: '민', Thảo: '타오', Linh: '린', Hương: '흐엉', Trang: '짱', Hà: '하', Lan: '란', Thu: '투', Hùng: '훙',
    Dũng: '중', Tuấn: '뚜언', Nam: '남', Quang: '꽝', Huy: '후이', Long: '롱', Hồng: '홍', Việt: '비엣',
    Thuận: '투언', Hạnh: '하인', Thanh: '타인', Ngọc: '응옥', Phương: '프엉', Mai: '마이', Hiếu: '히에우', Khánh: '카인',
    // thêm vài quy tắc của 베트남어 표기법
    Bạch: '바익', Yến: '옌', Xuân: '쑤언', 'Nha Trang': '냐 짱',
  });

  it('không dấu: đoán hợp lý', () => {
    expect(one('Nguyen Van An', 'vi')).toBe('응우옌 반 안');
    expect(one('Duong Huong Tuan Thuan Phuong Ngoc Viet Hieu Minh Anh', 'vi')).toBe(
      '즈엉 흐엉 뚜언 투언 프엉 응옥 비엣 히에우 민 아인',
    );
  });

  it('giữ thứ tự và dạng gốc của từng từ', () => {
    expect(nameToHangul('Nguyễn Văn An', 'vi')).toEqual([
      { input: 'Nguyễn', hangul: '응우옌' },
      { input: 'Văn', hangul: '반' },
      { input: 'An', hangul: '안' },
    ]);
  });

  it('hoa thường, khoảng trắng thừa, gạch nối', () => {
    expect(one('  TRẦN   thị   HÀ ', 'vi')).toBe('쩐 티 하');
    expect(one('nGuYễN', 'vi')).toBe('응우옌');
    expect(nameToHangul('Lê-Phạm', 'vi').map((p) => p.input)).toEqual(['Lê', 'Phạm']);
  });
});

describe('nameToHangul – tiếng Nhật', () => {
  check('ja', {
    田中: '다나카', たなか: '다나카', tanaka: '다나카', タナカ: '다나카', さとう: '사토', Satō: '사토', Sato: '사토',
    Satoh: '사토', すずき: '스즈키', たかはし: '다카하시', いとう: '이토', ゆうき: '유키', Yuuki: '유키', はると: '하루토',
    さくら: '사쿠라', けんた: '겐타', Kenta: '겐타', しょうた: '쇼타', Shouta: '쇼타', ちひろ: '지히로', Chihiro: '지히로',
    まつもと: '마쓰모토', Matsumoto: '마쓰모토', ほっかいどう: '홋카이도', Hokkaido: '홋카이도', いのうえ: '이노우에',
    ケンイチ: '겐이치', Shimbashi: '신바시', りょうこ: '료코',
  });

  it('kanji không có trong từ điển → hangul rỗng, giữ nguyên input', () => {
    expect(nameToHangul('山田太郎', 'ja')).toEqual([{ input: '山田太郎', hangul: '' }]);
    expect(nameToHangul('田中 はると', 'ja')).toEqual([
      { input: '田中', hangul: '다나카' },
      { input: 'はると', hangul: '하루토' },
    ]);
  });

  it('chữ hoa thường romaji', () => {
    expect(one('TANAKA Yuki', 'ja')).toBe('다나카 유키');
  });
});

describe('nameToHangul – tiếng Anh', () => {
  check('en', {
    John: '존', Michael: '마이클', David: '데이비드', James: '제임스', Robert: '로버트', William: '윌리엄',
    Mary: '메리', Sarah: '세라', Emily: '에밀리', Emma: '에마', Olivia: '올리비아', Smith: '스미스',
    Johnson: '존슨', Brown: '브라운', Taylor: '테일러', Wilson: '윌슨',
  });

  it('từ điển có ít nhất 200 tên', () => {
    expect(EN_NAME_COUNT).toBeGreaterThanOrEqual(200);
  });

  it('quy tắc dự phòng cho tên không có trong từ điển', () => {
    expect(one('Brent', 'en')).toBe('브렌트');
    expect(one('Clint', 'en')).toBe('클린트');
    expect(one('Phil', 'en')).toBe('필'); // ph → ㅍ
    expect(one('Seth', 'en')).toBe('세스'); // th → ㅅ
    expect(one('Blake', 'en')).toBe('블레이크'); // e câm cuối từ
    expect(one('Dwight', 'en')).toBe('드와이트');
    expect(one('Lance', 'en')).toBe('랜스');
    for (const n of ['Quentin', 'Xavier', 'Wendy', 'Fiona', 'Zara', 'Hector', 'Ingrid']) {
      expect(one(n, 'en')).toMatch(/^[가-힣]+$/);
    }
  });

  it('hoa thường và dấu nháy', () => {
    expect(one('  JOHN   smith ', 'en')).toBe('존 스미스');
    expect(one("O'Brien", 'en')).toBe('오브라이언');
  });
});

describe('nameToHangul – tiếng Indonesia', () => {
  check('id', {
    Budi: '부디', Siti: '시티', Agus: '아구스', Dewi: '데위', Putri: '푸트리', Rahmat: '라맛', Wahyu: '와휴',
    Joko: '조코', Ayu: '아유', Indah: '인다', Santoso: '산토소', Sari: '사리', Hidayat: '히다얏', Nur: '누르',
    Fitri: '피트리', Eko: '에코', Wulan: '울란', Nyoman: '뇨만', Soekarno: '수카르노',
  });

  it('họ tên nhiều từ', () => {
    expect(one('Siti Nur Hidayat', 'id')).toBe('시티 누르 히다얏');
  });
});

describe('nameToHangul – đầu vào rỗng', () => {
  for (const src of ['vi', 'ja', 'en', 'id'] as NameSource[]) {
    it(`rỗng / chỉ khoảng trắng (${src})`, () => {
      expect(nameToHangul('', src)).toEqual([]);
      expect(nameToHangul('   ', src)).toEqual([]);
      expect(nameToHangul(' - ', src)).toEqual([]);
    });
  }
  it('ký tự không phiên âm được → hangul rỗng', () => {
    expect(nameToHangul('123', 'vi')).toEqual([{ input: '123', hangul: '' }]);
  });
});
