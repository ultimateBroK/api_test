// // Hàm tạo ID duy nhất cho câu hỏi
// function genTextId() {
//     // Sử dụng timestamp hiện tại
//     const timestamp = Date.now();

//     // Tạo số ngẫu nhiên 6 chữ số
//     var randomNum = Math.floor(Math.random() * 1000000);
//     var randomStr = "000000" + randomNum.toString();
//     randomStr = randomStr.substring(randomStr.length - 6);

//     // Kết hợp timestamp và số ngẫu nhiên để tạo ID duy nhất
//     // Format: QUIZ_<timestamp>_<randomNum>
//     return `QUIZ_${timestamp}_${randomNum}`;
// }

function addQuizQuestion(data_XMLReq_array) {
    try {
        // Bước 1: Khởi tạo biến theo dõi lỗi
        let errors = [];
        let successCount = 0;

        // Bước 2: Duyệt từng câu hỏi trong mảng (đã được validate)
        for (let i = 0; i < data_XMLReq_array.length; i++) {
            const data_XMLReq_obj = data_XMLReq_array[i];

            // Bước 2.1: Tạo đối tượng câu hỏi với cấu trúc mới
            var objQuizQuestion = {
                "question_id": vijs.genTextID(), // Hàm tạo ID duy nhất
                "question": data_XMLReq_obj.question,
                "question_number": data_XMLReq_obj.question_number,
                "total_questions": data_XMLReq_obj.total_questions,
                "option_1": data_XMLReq_obj.option_1,
                "option_2": data_XMLReq_obj.option_2,
                "option_3": data_XMLReq_obj.option_3,
                "option_4": data_XMLReq_obj.option_4 || null, // option_4 có thể không tồn tại
                "correct_answer_index": data_XMLReq_obj.correct_answer_index,
                "progress": data_XMLReq_obj.progress
            };

            // Bước 2.2: Lưu vào Cassandra2
            var kq = saveCassandra("quiz_questions", objQuizQuestion, "hieutest");
            call.debug(objQuizQuestion);

            if (kq == false) {
                errors.push(`Câu hỏi thứ ${i + 1}: Lưu dữ liệu vào Cassandra thất bại`);
                continue;
            }

            successCount++;
        }

        // Bước 3: Trả về kết quả
        if (errors.length === 0) {
            return {
                alert: true,
                errCode: "000",
                content: `Đã thêm thành công ${successCount} câu hỏi`
            };
        } else {
            return {
                alert: false,
                errCode: "002",
                content: `Thêm câu hỏi thất bại: ${errors.join("; ")}`,
                details: errors
            };
        }
    } catch (error) {
        // Log chi tiết lỗi để debug
        call.debug("=== DETAILED ERROR INFO ===");
        call.debug("Error message: " + error.message);
        call.debug("Error stack: " + error.stack);
        call.debug("Error name: " + error.name);

        // Phân loại lỗi để trả về error code cụ thể
        let errorCode = "001";
        let errorMessage = "Có lỗi hệ thống xảy ra!";

        // Kiểm tra các loại lỗi phổ biến
        if (error.name === "TypeError") {
            errorCode = "003";
            errorMessage = `Lỗi kiểu dữ liệu: ${error.message}`;
        } else if (error.name === "ReferenceError") {
            errorCode = "004";
            errorMessage = `Lỗi tham chiếu: ${error.message}`;
        } else if (error.message && error.message.includes("saveCassandra")) {
            errorCode = "005";
            errorMessage = `Lỗi kết nối Cassandra: ${error.message}`;
        } else if (error.message && error.message.includes("JSON")) {
            errorCode = "006";
            errorMessage = `Lỗi xử lý JSON: ${error.message}`;
        } else if (error.message && error.message.includes("undefined")) {
            errorCode = "007";
            errorMessage = `Lỗi dữ liệu không xác định: ${error.message}`;
        } else {
            // Lỗi chung, nhưng có thêm thông tin chi tiết
            errorMessage = `Lỗi hệ thống: ${error.message || 'Không xác định'}`;
        }

        return {
            alert: false,
            errCode: errorCode,
            content: errorMessage,
            debug_info: {
                error_type: error.name,
                error_message: error.message,
                stack_trace: error.stack ? error.stack.split('\n')[0] : 'No stack trace'
            }
        };
    }
}

// Chỉ gọi hàm khi dữ liệu đã được validate
if (verify_data_req.alert) {
    result = addQuizQuestion(data_XMLReq_array);
    returnText = JSON.stringify(result);
} else {
    // Trả về lỗi validation từ chương trình 2
    returnText = JSON.stringify({
        alert: false,
        content: verify_data_req.content,
        errCode: verify_data_req.errCode
    });
}