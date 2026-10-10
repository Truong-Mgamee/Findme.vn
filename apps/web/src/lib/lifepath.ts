import type { AppLocale } from '@/i18n/routing';

export const LIFE_PATH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;
export type LifePathNumber = (typeof LIFE_PATH_NUMBERS)[number];

export function isLifePathNumber(n: number): n is LifePathNumber {
  return (LIFE_PATH_NUMBERS as readonly number[]).includes(n);
}

export interface LifePathCopy {
  title: string;
  summary: string;
  strengths: string[];
  challenges: string[];
  careers: string[];
}

/** Engine-free explainer copy; editorial depth comes from published atoms `numerology.lifepath.<n>`. */
export const LIFE_PATH_COPY: Record<AppLocale, Record<LifePathNumber, LifePathCopy>> = {
  en: {
    1: { title: 'The Leader', summary: 'Independent, original and driven to initiate. Life Path 1 learns to lead without dominating.', strengths: ['initiative', 'courage', 'originality'], challenges: ['stubbornness', 'impatience', 'isolation'], careers: ['founder', 'director', 'athlete', 'freelancer'] },
    2: { title: 'The Peacemaker', summary: 'Sensitive, cooperative and diplomatic. Life Path 2 thrives in partnership and quiet influence.', strengths: ['empathy', 'tact', 'patience'], challenges: ['over-sensitivity', 'indecision', 'self-doubt'], careers: ['counsellor', 'mediator', 'nurse', 'designer'] },
    3: { title: 'The Communicator', summary: 'Expressive, creative and social. Life Path 3 is here to share joy through words and art.', strengths: ['creativity', 'charm', 'optimism'], challenges: ['scattered focus', 'superficiality', 'moodiness'], careers: ['writer', 'performer', 'marketer', 'teacher'] },
    4: { title: 'The Builder', summary: 'Practical, loyal and disciplined. Life Path 4 creates lasting structures through steady work.', strengths: ['reliability', 'organisation', 'endurance'], challenges: ['rigidity', 'workaholism', 'fear of change'], careers: ['engineer', 'accountant', 'project manager', 'craftsperson'] },
    5: { title: 'The Adventurer', summary: 'Curious, adaptable and freedom-loving. Life Path 5 grows through change and experience.', strengths: ['versatility', 'wit', 'resilience'], challenges: ['restlessness', 'impulsiveness', 'commitment'], careers: ['travel', 'sales', 'journalism', 'entrepreneurship'] },
    6: { title: 'The Nurturer', summary: 'Responsible, caring and harmonious. Life Path 6 is drawn to family, service and beauty.', strengths: ['compassion', 'loyalty', 'aesthetics'], challenges: ['perfectionism', 'over-giving', 'control'], careers: ['medicine', 'education', 'hospitality', 'interior design'] },
    7: { title: 'The Seeker', summary: 'Analytical, introspective and spiritual. Life Path 7 looks beneath the surface for truth.', strengths: ['insight', 'focus', 'wisdom'], challenges: ['aloofness', 'cynicism', 'secrecy'], careers: ['research', 'science', 'philosophy', 'technology'] },
    8: { title: 'The Powerhouse', summary: 'Ambitious, capable and materially gifted. Life Path 8 learns to wield power with integrity.', strengths: ['leadership', 'strategy', 'authority'], challenges: ['materialism', 'domination', 'stress'], careers: ['finance', 'law', 'management', 'real estate'] },
    9: { title: 'The Humanitarian', summary: 'Generous, idealistic and worldly-wise. Life Path 9 completes cycles and gives back.', strengths: ['compassion', 'vision', 'tolerance'], challenges: ['martyrdom', 'drama', 'letting go'], careers: ['non-profit', 'arts', 'healing', 'international work'] },
    11: { title: 'The Illuminator', summary: 'Master number 11 carries the sensitivity of 2 with heightened intuition and inspiration.', strengths: ['intuition', 'inspiration', 'idealism'], challenges: ['anxiety', 'self-criticism', 'nervous energy'], careers: ['teaching', 'spirituality', 'the arts', 'counselling'] },
    22: { title: 'The Master Builder', summary: 'Master number 22 turns big visions into practical, lasting achievements for many people.', strengths: ['vision', 'discipline', 'practicality'], challenges: ['pressure', 'self-doubt', 'overwork'], careers: ['architecture', 'large organisations', 'politics', 'engineering'] },
    33: { title: 'The Master Teacher', summary: 'Master number 33 blends the nurturing of 6 with selfless service and uplifting guidance.', strengths: ['devotion', 'healing', 'generosity'], challenges: ['self-sacrifice', 'idealism', 'burnout'], careers: ['education', 'healing arts', 'ministry', 'social work'] },
  },
  vi: {
    1: { title: 'Người dẫn đầu', summary: 'Độc lập, sáng tạo và luôn muốn khởi xướng. Số chủ đạo 1 học cách dẫn dắt mà không áp đặt.', strengths: ['chủ động', 'dũng cảm', 'độc đáo'], challenges: ['bướng bỉnh', 'thiếu kiên nhẫn', 'cô lập'], careers: ['sáng lập', 'giám đốc', 'vận động viên', 'tự do'] },
    2: { title: 'Người hòa giải', summary: 'Nhạy cảm, hợp tác và khéo léo. Số 2 tỏa sáng trong quan hệ đối tác và ảnh hưởng âm thầm.', strengths: ['thấu cảm', 'tế nhị', 'kiên nhẫn'], challenges: ['quá nhạy cảm', 'do dự', 'tự ti'], careers: ['tư vấn', 'hòa giải', 'điều dưỡng', 'thiết kế'] },
    3: { title: 'Người truyền cảm hứng', summary: 'Biểu cảm, sáng tạo và hòa đồng. Số 3 chia sẻ niềm vui qua lời nói và nghệ thuật.', strengths: ['sáng tạo', 'duyên dáng', 'lạc quan'], challenges: ['phân tán', 'hời hợt', 'thất thường'], careers: ['viết lách', 'biểu diễn', 'marketing', 'giảng dạy'] },
    4: { title: 'Người xây dựng', summary: 'Thực tế, trung thành và kỷ luật. Số 4 tạo nên nền móng bền vững bằng lao động đều đặn.', strengths: ['đáng tin', 'có tổ chức', 'bền bỉ'], challenges: ['cứng nhắc', 'nghiện việc', 'ngại thay đổi'], careers: ['kỹ sư', 'kế toán', 'quản lý dự án', 'thợ lành nghề'] },
    5: { title: 'Người phiêu lưu', summary: 'Tò mò, linh hoạt và yêu tự do. Số 5 trưởng thành qua thay đổi và trải nghiệm.', strengths: ['đa năng', 'hóm hỉnh', 'kiên cường'], challenges: ['bồn chồn', 'bốc đồng', 'cam kết'], careers: ['du lịch', 'bán hàng', 'báo chí', 'khởi nghiệp'] },
    6: { title: 'Người chăm sóc', summary: 'Trách nhiệm, chu đáo và yêu hòa hợp. Số 6 hướng về gia đình, phụng sự và cái đẹp.', strengths: ['bao dung', 'trung thành', 'thẩm mỹ'], challenges: ['cầu toàn', 'cho đi quá mức', 'kiểm soát'], careers: ['y tế', 'giáo dục', 'dịch vụ', 'nội thất'] },
    7: { title: 'Người tìm kiếm', summary: 'Phân tích, hướng nội và tâm linh. Số 7 đi tìm sự thật phía sau bề mặt.', strengths: ['sâu sắc', 'tập trung', 'minh triết'], challenges: ['xa cách', 'hoài nghi', 'khép kín'], careers: ['nghiên cứu', 'khoa học', 'triết học', 'công nghệ'] },
    8: { title: 'Người quyền lực', summary: 'Tham vọng, giỏi giang và có duyên với vật chất. Số 8 học cách dùng quyền lực một cách chính trực.', strengths: ['lãnh đạo', 'chiến lược', 'uy quyền'], challenges: ['vật chất', 'áp đặt', 'căng thẳng'], careers: ['tài chính', 'luật', 'quản lý', 'bất động sản'] },
    9: { title: 'Người nhân ái', summary: 'Hào phóng, lý tưởng và từng trải. Số 9 khép lại các chu kỳ và cho đi.', strengths: ['trắc ẩn', 'tầm nhìn', 'bao dung'], challenges: ['hy sinh quá mức', 'kịch tính', 'buông bỏ'], careers: ['phi lợi nhuận', 'nghệ thuật', 'chữa lành', 'quốc tế'] },
    11: { title: 'Người soi sáng', summary: 'Số bậc thầy 11 mang sự nhạy cảm của số 2 cùng trực giác và cảm hứng mạnh mẽ.', strengths: ['trực giác', 'cảm hứng', 'lý tưởng'], challenges: ['lo âu', 'tự phê bình', 'bất an'], careers: ['giảng dạy', 'tâm linh', 'nghệ thuật', 'tư vấn'] },
    22: { title: 'Kiến trúc sư bậc thầy', summary: 'Số bậc thầy 22 biến tầm nhìn lớn thành thành tựu thực tế, bền vững cho nhiều người.', strengths: ['tầm nhìn', 'kỷ luật', 'thực tế'], challenges: ['áp lực', 'tự nghi ngờ', 'quá tải'], careers: ['kiến trúc', 'tổ chức lớn', 'chính trị', 'kỹ thuật'] },
    33: { title: 'Người thầy bậc thầy', summary: 'Số bậc thầy 33 hòa quyện sự chăm sóc của số 6 với phụng sự vị tha và dẫn dắt nâng đỡ.', strengths: ['tận tụy', 'chữa lành', 'hào phóng'], challenges: ['hy sinh bản thân', 'lý tưởng hóa', 'kiệt sức'], careers: ['giáo dục', 'chữa lành', 'tôn giáo', 'công tác xã hội'] },
  },
};
