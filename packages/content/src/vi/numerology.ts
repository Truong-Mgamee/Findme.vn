import type { ContentRecord } from "../types.js";
const V = 1;
const r = (key: string, layer: 1 | 2, text: string, tags: string[] = []): ContentRecord => ({
  id: `numerology.lifePath.${key}.${layer}`, locale: "vi", layer, text, tags: ["numerology", "lifePath", ...tags],
  source_note: "Thần số học Pythagoras, tri thức công cộng; biên soạn gốc cho Daily Fate", status: "draft", version: V,
});
export const numerologyVi: ContentRecord[] = [
  r("1", 1, "Bạn sinh ra để dẫn đầu: độc lập, quyết đoán và luôn muốn tự mở con đường của mình."),
  r("1", 2, "Mạnh: tiên phong, ý chí, tự lập.\nYếu: nóng vội, khó nhận góp ý.\nGợi ý: tập lắng nghe trước khi quyết."),
  r("2", 1, "Bạn là người kết nối: nhạy cảm, biết lắng nghe và giỏi làm dịu những xung đột quanh mình."),
  r("2", 2, "Mạnh: hợp tác, tinh tế, kiên nhẫn.\nYếu: dễ tổn thương, hay nhường quá mức.\nGợi ý: nói rõ nhu cầu của mình."),
  r("3", 1, "Bạn mang năng lượng biểu đạt: sáng tạo, lạc quan và truyền cảm hứng cho người khác bằng lời nói."),
  r("3", 2, "Mạnh: sáng tạo, giao tiếp, hài hước.\nYếu: phân tán, khó bền.\nGợi ý: chọn một dự án và đi tới cùng."),
  r("4", 1, "Bạn là nền móng: thực tế, kỷ luật và tin vào giá trị của lao động bền bỉ."),
  r("4", 2, "Mạnh: tổ chức, đáng tin, kiên trì.\nYếu: cứng nhắc, ngại thay đổi.\nGợi ý: dành chỗ cho điều bất ngờ."),
  r("5", 1, "Bạn khao khát tự do: tò mò, linh hoạt và sống trọn trong từng trải nghiệm mới."),
  r("5", 2, "Mạnh: thích nghi, can đảm, đa tài.\nYếu: bốc đồng, chán nhanh.\nGợi ý: tự do cần một vài cam kết làm neo."),
  r("6", 1, "Bạn là người chăm sóc: trách nhiệm, ấm áp và luôn đặt gia đình, cộng đồng lên trước."),
  r("6", 2, "Mạnh: yêu thương, công bằng, chu đáo.\nYếu: ôm đồm, hy sinh quá mức.\nGợi ý: chăm mình trước khi chăm người."),
  r("7", 1, "Bạn là người tìm kiếm sự thật: sâu sắc, thích suy ngẫm và tin vào trực giác hơn đám đông."),
  r("7", 2, "Mạnh: phân tích, trực giác, độc lập tư duy.\nYếu: khép kín, hoài nghi.\nGợi ý: chia sẻ điều bạn hiểu với ai đó."),
  r("8", 1, "Bạn mang năng lượng quyền lực và tài chính: tham vọng, thực tế và giỏi biến ý tưởng thành kết quả."),
  r("8", 2, "Mạnh: lãnh đạo, quản lý, bền bỉ.\nYếu: cầu toàn, đo mọi thứ bằng thành tích.\nGợi ý: thành công cũng cần có người đồng hành."),
  r("9", 1, "Bạn có trái tim nhân ái: bao dung, lý tưởng và luôn muốn để lại điều tốt đẹp cho thế giới."),
  r("9", 2, "Mạnh: vị tha, sáng tạo, tầm nhìn rộng.\nYếu: khó buông bỏ, dễ thất vọng vì người khác.\nGợi ý: cho đi nhưng giữ lại ranh giới."),
  r("11", 1, "Bạn là số bậc thầy của trực giác: nhạy bén, truyền cảm hứng và nhìn thấy điều người khác chưa thấy.", ["master"]),
  r("11", 2, "Mạnh: trực giác, lý tưởng, truyền cảm hứng.\nYếu: lo âu, áp lực tự tạo.\nGợi ý: tiếp đất bằng thói quen đơn giản mỗi ngày.", ["master"]),
  r("22", 1, "Bạn là số bậc thầy kiến tạo: có thể biến giấc mơ lớn thành công trình thật nếu đủ kiên nhẫn.", ["master"]),
  r("22", 2, "Mạnh: tầm nhìn, kỷ luật, năng lực thực thi lớn.\nYếu: sợ thất bại, tự nghi ngờ.\nGợi ý: chia mục tiêu lớn thành bước nhỏ.", ["master"]),
  r("33", 1, "Bạn là số bậc thầy của yêu thương: chữa lành, dạy dỗ và nâng đỡ người khác là lẽ sống.", ["master"]),
  r("33", 2, "Mạnh: từ bi, dẫn dắt, chữa lành.\nYếu: kiệt sức vì gánh thay người khác.\nGợi ý: đặt giới hạn cho lòng tốt.", ["master"]),
];
