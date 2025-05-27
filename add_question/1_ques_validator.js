// Đặt tên context phù hợp với chức năng mới (xử lý nhiều câu hỏi trắc nghiệm)
call.buildDebugContext("addQuizQuestion");

// Phân tích dữ liệu đầu vào từ API
var data_XMLReq_array = JSON.parse(dataAll.data);
call.debug(data_XMLReq_array);

// Khởi tạo phản hồi mặc định
var res = {
    alert: true,
    content: "Success",
    errCode: "000"
};

// Mẫu cấu trúc dữ liệu hợp lệ (trắc nghiệm đơn lẻ)
var key_pattern = {
    // Thông tin câu hỏi
    "question": {
        "type": "string",
        "required": true,
        "description": "Nội dung câu hỏi (ví dụ: 'Hành động nào sau đây là ĐÚNG?')"
    },
    "question_number": {
        "type": "number",
        "required": true,
        "description": "Số thứ tự câu hỏi (ví dụ: 2/10)"
    },
    "total_questions": {
        "type": "number",
        "required": true,
        "description": "Tổng số câu hỏi trong bài (ví dụ: 10)"
    },

    // Thông tin đáp án - tách thành 4 options riêng biệt
    "option_1": {
        "type": "string",
        "required": true,
        "description": "Đáp án thứ 1 (bắt buộc)"
    },
    "option_2": {
        "type": "string",
        "required": true,
        "description": "Đáp án thứ 2 (bắt buộc)"
    },
    "option_3": {
        "type": "string",
        "required": true,
        "description": "Đáp án thứ 3 (bắt buộc)"
    },
    "option_4": {
        "type": "string",
        "required": false,
        "description": "Đáp án thứ 4 (tùy chọn)"
    },
    "correct_answer_index": {
        "type": "number",
        "required": true,
        "description": "Vị trí đáp án đúng (1-4, tương ứng với option_1 đến option_4)"
    },

    // Thông tin trạng thái
    "progress": {
        "type": "string",
        "required": true,
        "description": "Tỷ lệ hoàn thành (ví dụ: '20%')"
    }
};

// Hàm kiểm tra tính hợp lệ của một câu hỏi (đơn lẻ)
function verify_key_obj(pattern, data) {
    for (var key in pattern) {
        var field = pattern[key];
        if (field.required && !(key in data)) {
            return {
                alert: false,
                content: `Thiếu trường bắt buộc: ${key}`,
                errCode: "003"
            };
        }

        // Kiểm tra nếu trường tồn tại trước khi kiểm tra kiểu
        if (key in data) {
            if (field.type === "array") {
                if (!Array.isArray(data[key])) {
                    return {
                        alert: false,
                        content: `Trường ${key} phải là mảng`,
                        errCode: "004"
                    };
                }
                // Thêm kiểm tra cho từng phần tử trong mảng
                if (field.items && field.items.type) {
                    for (let idx = 0; idx < data[key].length; idx++) {
                        const item = data[key][idx];
                        if (typeof item !== field.items.type) {
                            return {
                                alert: false,
                                content: `Phần tử thứ ${idx + 1} trong trường '${key}' phải là kiểu '${field.items.type}'. Tìm thấy kiểu '${typeof item}'.`,
                                errCode: "008" // Mã lỗi mới cho kiểu phần tử mảng không khớp
                            };
                        }
                    }
                }
            } else if (field.type === "number" && typeof data[key] !== "number") {
                return {
                    alert: false,
                    content: `Trường ${key} phải là số`,
                    errCode: "005"
                };
            } else if (field.type === "string" && typeof data[key] !== "string") {
                return {
                    alert: false,
                    content: `Trường ${key} phải là chuỗi`,
                    errCode: "006"
                };
            }
            
            // Kiểm tra đặc biệt cho correct_answer_index
            if (key === "correct_answer_index") {
                if (data[key] < 1 || data[key] > 4) {
                    return {
                        alert: false,
                        content: `Trường correct_answer_index phải từ 1 đến 4`,
                        errCode: "009"
                    };
                }
                
                // Kiểm tra xem đáp án được chọn có tồn tại không
                const selectedOption = `option_${data[key]}`;
                if (!data[selectedOption] || data[selectedOption].trim() === "") {
                    return {
                        alert: false,
                        content: `Đáp án được chọn (${selectedOption}) không được để trống`,
                        errCode: "010"
                    };
                }
            }
        }
    }

    return {
        alert: true,
        content: "Dữ liệu hợp lệ",
        errCode: "000"
    };
}

// Hàm kiểm tra tính hợp lệ của toàn bộ mảng câu hỏi
function verify_question_array(data, pattern) {
    // Kiểm tra đầu vào có phải là mảng không
    if (!Array.isArray(data)) {
        return {
            alert: false,
            content: "Dữ liệu đầu vào phải là một mảng",
            errCode: "001"
        };
    }

    // Duyệt từng câu hỏi trong mảng
    for (let i = 0; i < data.length; i++) {
        const question = data[i];
        const result = verify_key_obj(pattern, question);

        if (!result.alert) {
            return {
                alert: false,
                content: `Lỗi ở câu hỏi thứ ${i + 1}: ${result.content}`,
                errCode: result.errCode
            };
        }
    }

    return {
        alert: true,
        content: `Tất cả ${data.length} câu hỏi đều hợp lệ`,
        errCode: "000"
    };
}

// Kiểm tra tính hợp lệ của dữ liệu đầu vào
try {
    var verify_data_req = verify_question_array(data_XMLReq_array, key_pattern);
    call.debug(verify_data_req);

    if (!verify_data_req.alert) {
        res = verify_data_req; // Trả lỗi nếu có câu hỏi không hợp lệ
    } else {
        // Xử lý lưu trữ hoặc xử lý logic với mảng câu hỏi
        res.content = `Đã nhận ${data_XMLReq_array.length} câu hỏi`;
    }
} catch (e) {
    res = {
        alert: false,
        content: "Lỗi phân tích dữ liệu JSON: " + e.message,
        errCode: "002"
    };
}
