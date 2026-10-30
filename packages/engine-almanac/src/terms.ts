import type { Locale } from '@findme/engine-core';
type L = { vi: string; en: string };
/** 宜/忌 vocabulary (lunar-typescript Han codes) → labels. Unknown codes fall back to Han. */
export const YIJI_TERMS: Record<string, L> = {
  嫁娶: { vi: 'Cưới hỏi', en: 'Wedding' }, 祭祀: { vi: 'Cúng tế', en: 'Ancestral rites' }, 祈福: { vi: 'Cầu phúc', en: 'Prayer for blessings' },
  求嗣: { vi: 'Cầu con', en: 'Praying for children' }, 开光: { vi: 'Khai quang', en: 'Consecration' }, 塑绘: { vi: 'Tô vẽ tượng', en: 'Painting statues' },
  齐醮: { vi: 'Lập đàn trai giới', en: 'Taoist ceremony' }, 斋醮: { vi: 'Trai giới', en: 'Fasting ritual' }, 沐浴: { vi: 'Tắm gội', en: 'Bathing' },
  酬神: { vi: 'Tạ thần', en: 'Thanksgiving to deities' }, 造庙: { vi: 'Xây miếu', en: 'Building temples' }, 祀灶: { vi: 'Cúng Táo', en: 'Kitchen god rites' },
  焚香: { vi: 'Dâng hương', en: 'Incense offering' }, 谢土: { vi: 'Tạ thổ', en: 'Thanking the earth' }, 出火: { vi: 'Dời bát hương', en: 'Moving the altar' },
  雕刻: { vi: 'Điêu khắc', en: 'Carving' }, 嫁娶纳采: { vi: 'Cưới hỏi', en: 'Wedding' }, 纳采: { vi: 'Dạm ngõ, ăn hỏi', en: 'Betrothal' }, 订盟: { vi: 'Đính hôn', en: 'Engagement' },
  纳婿: { vi: 'Nhận rể', en: 'Taking a son-in-law' }, 归宁: { vi: 'Về thăm nhà mẹ đẻ', en: 'Visiting parents' }, 安床: { vi: 'Kê giường', en: 'Setting the bed' },
  合帐: { vi: 'May màn', en: 'Making bed curtains' }, 冠笄: { vi: 'Lễ trưởng thành', en: 'Coming of age' }, 订婚: { vi: 'Đính hôn', en: 'Engagement' },
  安机械: { vi: 'Lắp máy móc', en: 'Installing machinery' }, 会亲友: { vi: 'Gặp gỡ bạn bè', en: 'Meeting friends' }, 进人口: { vi: 'Nhận người, tuyển dụng', en: 'Taking in people / hiring' },
  出行: { vi: 'Xuất hành', en: 'Travel' }, 移徙: { vi: 'Chuyển nhà', en: 'Moving house' }, 入宅: { vi: 'Nhập trạch', en: 'Moving in' }, 安香: { vi: 'An vị bát hương', en: 'Installing the altar' },
  开市: { vi: 'Khai trương', en: 'Opening a business' }, 开业: { vi: 'Khai nghiệp', en: 'Starting a business' }, 交易: { vi: 'Giao dịch', en: 'Trading' }, 立券: { vi: 'Ký kết', en: 'Signing contracts' },
  纳财: { vi: 'Thu tiền, nhận của', en: 'Receiving wealth' }, 开仓: { vi: 'Mở kho', en: 'Opening storehouse' }, 出货财: { vi: 'Xuất hàng', en: 'Shipping goods' }, 赴任: { vi: 'Nhậm chức', en: 'Taking office' },
  上官: { vi: 'Nhậm chức', en: 'Assuming office' }, 入学: { vi: 'Nhập học', en: 'Starting school' }, 习艺: { vi: 'Học nghề', en: 'Learning a craft' }, 求医: { vi: 'Chữa bệnh', en: 'Seeking treatment' },
  治病: { vi: 'Trị bệnh', en: 'Medical treatment' }, 针灸: { vi: 'Châm cứu', en: 'Acupuncture' }, 理发: { vi: 'Cắt tóc', en: 'Haircut' }, 整手足甲: { vi: 'Cắt móng', en: 'Nail trimming' },
  动土: { vi: 'Động thổ', en: 'Groundbreaking' }, 破土: { vi: 'Phá thổ (mộ phần)', en: 'Breaking ground (tomb)' }, 修造: { vi: 'Sửa chữa, xây dựng', en: 'Construction' }, 起基: { vi: 'Đặt móng', en: 'Laying foundation' },
  竖柱: { vi: 'Dựng cột', en: 'Erecting pillars' }, 上梁: { vi: 'Cất nóc', en: 'Raising the beam' }, 盖屋: { vi: 'Lợp mái', en: 'Roofing' }, 作灶: { vi: 'Đặt bếp', en: 'Installing stove' },
  安门: { vi: 'Lắp cửa', en: 'Installing doors' }, 开渠: { vi: 'Đào mương', en: 'Digging channels' }, 掘井: { vi: 'Đào giếng', en: 'Digging wells' }, 栽种: { vi: 'Trồng trọt', en: 'Planting' },
  伐木: { vi: 'Đốn cây', en: 'Felling trees' }, 纳畜: { vi: 'Mua gia súc', en: 'Buying livestock' }, 牧养: { vi: 'Chăn nuôi', en: 'Raising livestock' }, 捕捉: { vi: 'Săn bắt', en: 'Hunting' },
  畋猎: { vi: 'Săn bắn', en: 'Hunting' }, 结网: { vi: 'Đan lưới', en: 'Making nets' }, 取渔: { vi: 'Đánh cá', en: 'Fishing' }, 造船: { vi: 'Đóng thuyền', en: 'Boat building' },
  安葬: { vi: 'An táng', en: 'Burial' }, 启攒: { vi: 'Cải táng', en: 'Reburial' }, 修坟: { vi: 'Sửa mộ', en: 'Tomb repair' }, 立碑: { vi: 'Dựng bia', en: 'Erecting tombstone' },
  入殓: { vi: 'Nhập quan', en: 'Encoffining' }, 移柩: { vi: 'Di quan', en: 'Moving the coffin' }, 成服: { vi: 'Mặc tang phục', en: 'Mourning dress' }, 除服: { vi: 'Mãn tang', en: 'End of mourning' },
  馀事勿取: { vi: 'Việc khác không nên', en: 'Nothing else advisable' }, 诸事不宜: { vi: 'Mọi việc không nên', en: 'Nothing advisable' }, 平治道涂: { vi: 'Sửa đường', en: 'Road repair' },
  解除: { vi: 'Giải trừ', en: 'Removing obstacles' }, 扫舍: { vi: 'Dọn nhà', en: 'House cleaning' }, 拆卸: { vi: 'Tháo dỡ', en: 'Demolition' }, 补垣: { vi: 'Vá tường', en: 'Wall repair' },
  塞穴: { vi: 'Lấp hang hố', en: 'Filling holes' }, 裁衣: { vi: 'Cắt may', en: 'Tailoring' }, 经络: { vi: 'Dệt vải', en: 'Weaving' }, 酝酿: { vi: 'Ủ rượu', en: 'Brewing' },
  造车器: { vi: 'Đóng xe', en: 'Making vehicles' }, 教牛马: { vi: 'Thuần gia súc', en: 'Training animals' }, 置产: { vi: 'Mua tài sản', en: 'Acquiring property' }, 开池: { vi: 'Đào ao', en: 'Digging ponds' },
  作厕: { vi: 'Xây nhà vệ sinh', en: 'Building latrine' }, 造仓: { vi: 'Xây kho', en: 'Building storehouse' }, 探病: { vi: 'Thăm bệnh', en: 'Visiting the sick' }, 词讼: { vi: 'Kiện tụng', en: 'Litigation' },
  行丧: { vi: 'Đưa tang', en: 'Funeral procession' }, 开仓库: { vi: 'Mở kho', en: 'Opening storehouse' }, 作梁: { vi: 'Làm xà', en: 'Making beams' }, 安碓硙: { vi: 'Đặt cối', en: 'Installing mill' },
  修饰垣墙: { vi: 'Sửa tường', en: 'Wall decoration' }, 筑堤: { vi: 'Đắp đê', en: 'Building dikes' }, 放水: { vi: 'Tháo nước', en: 'Releasing water' }, 修造动土: { vi: 'Xây sửa động thổ', en: 'Construction' },
  开柱眼: { vi: 'Đục lỗ cột', en: 'Drilling pillars' }, 定磉: { vi: 'Đặt đá tảng', en: 'Setting footing stones' }, 作陂: { vi: 'Đắp bờ', en: 'Building embankment' }, 开厕: { vi: 'Mở nhà vệ sinh', en: 'Opening latrine' },
  安葬启攒: { vi: 'An táng, cải táng', en: 'Burial' }, 作染: { vi: 'Nhuộm', en: 'Dyeing' }, 鼓铸: { vi: 'Đúc', en: 'Casting' }, 嫁娶安床: { vi: 'Cưới hỏi, kê giường', en: 'Wedding' },
  进人口安床: { vi: 'Nhận người', en: 'Taking in people' }, 出行移徙: { vi: 'Xuất hành, chuyển nhà', en: 'Travel/moving' }, 开生坟: { vi: 'Xây sinh phần', en: 'Preparing a tomb' }, 合寿木: { vi: 'Đóng quan tài', en: 'Making coffin' },
  作梁盖屋: { vi: 'Lợp mái', en: 'Roofing' }, 架马: { vi: 'Dựng giàn', en: 'Scaffolding' }, 普渡: { vi: 'Phổ độ', en: 'Universal salvation rite' }, 立券交易: { vi: 'Ký kết giao dịch', en: 'Contracts & trade' },
};

/** 建除十二神 (ZhiXing) quality: good = 除 危 定 执 成 开 */
export const ZHIXING_TERMS: Record<string, L & { good: boolean }> = {
  建: { vi: 'Kiến', en: 'Establish', good: false }, 除: { vi: 'Trừ', en: 'Remove', good: true }, 满: { vi: 'Mãn', en: 'Full', good: false }, 平: { vi: 'Bình', en: 'Balance', good: false },
  定: { vi: 'Định', en: 'Settle', good: true }, 执: { vi: 'Chấp', en: 'Hold', good: true }, 破: { vi: 'Phá', en: 'Break', good: false }, 危: { vi: 'Nguy', en: 'Danger', good: true },
  成: { vi: 'Thành', en: 'Success', good: true }, 收: { vi: 'Thu', en: 'Receive', good: false }, 开: { vi: 'Khai', en: 'Open', good: true }, 闭: { vi: 'Bế', en: 'Close', good: false },
};

export const XIU_TERMS: Record<string, L> = {
  角: { vi: 'Giác', en: 'Horn' }, 亢: { vi: 'Cang', en: 'Neck' }, 氐: { vi: 'Đê', en: 'Root' }, 房: { vi: 'Phòng', en: 'Room' }, 心: { vi: 'Tâm', en: 'Heart' }, 尾: { vi: 'Vĩ', en: 'Tail' }, 箕: { vi: 'Cơ', en: 'Winnowing basket' },
  斗: { vi: 'Đẩu', en: 'Dipper' }, 牛: { vi: 'Ngưu', en: 'Ox' }, 女: { vi: 'Nữ', en: 'Girl' }, 虚: { vi: 'Hư', en: 'Emptiness' }, 危: { vi: 'Nguy', en: 'Rooftop' }, 室: { vi: 'Thất', en: 'Encampment' }, 壁: { vi: 'Bích', en: 'Wall' },
  奎: { vi: 'Khuê', en: 'Legs' }, 娄: { vi: 'Lâu', en: 'Bond' }, 胃: { vi: 'Vị', en: 'Stomach' }, 昴: { vi: 'Mão', en: 'Hairy head' }, 毕: { vi: 'Tất', en: 'Net' }, 觜: { vi: 'Chủy', en: 'Turtle beak' }, 参: { vi: 'Sâm', en: 'Three stars' },
  井: { vi: 'Tỉnh', en: 'Well' }, 鬼: { vi: 'Quỷ', en: 'Ghost' }, 柳: { vi: 'Liễu', en: 'Willow' }, 星: { vi: 'Tinh', en: 'Star' }, 张: { vi: 'Trương', en: 'Extended net' }, 翼: { vi: 'Dực', en: 'Wings' }, 轸: { vi: 'Chẩn', en: 'Chariot' },
};

export const DIRECTION_TERMS: Record<string, L> = {
  正北: { vi: 'Chính Bắc', en: 'North' }, 东北: { vi: 'Đông Bắc', en: 'Northeast' }, 正东: { vi: 'Chính Đông', en: 'East' }, 东南: { vi: 'Đông Nam', en: 'Southeast' },
  正南: { vi: 'Chính Nam', en: 'South' }, 西南: { vi: 'Tây Nam', en: 'Southwest' }, 正西: { vi: 'Chính Tây', en: 'West' }, 西北: { vi: 'Tây Bắc', en: 'Northwest' },
  北: { vi: 'Bắc', en: 'North' }, 东: { vi: 'Đông', en: 'East' }, 南: { vi: 'Nam', en: 'South' }, 西: { vi: 'Tây', en: 'West' },
};

export const ELEMENT_COLORS: Record<number, { vi: string; en: string; hex: string }> = {
  0: { vi: 'Xanh lá', en: 'Green', hex: '#2E8B57' },
  1: { vi: 'Đỏ, hồng', en: 'Red', hex: '#D64545' },
  2: { vi: 'Vàng, nâu', en: 'Yellow / earth tones', hex: '#C9A227' },
  3: { vi: 'Trắng, bạc', en: 'White / metallic', hex: '#D9D9D9' },
  4: { vi: 'Đen, xanh dương', en: 'Black / blue', hex: '#1F3A93' },
};

export function tl(map: Record<string, L>, han: string, locale: Locale): string {
  const t = map[han];
  if (!t) return han;
  return locale === 'vi' ? t.vi : t.en;
}
