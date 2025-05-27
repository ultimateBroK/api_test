function validateQuizQuestions(data_XMLReq_array) {
    try {
        // Bước 0: Kiểm tra đầu vào có phải là mảng không
        if (!Array.isArray(data_XMLReq_array)) {
            return {
                alert: false,
                errCode: "001",
                content: "Dữ liệu đầu vào phải là mảng"
            };
        }

        // Bước 1: Khởi tạo biến theo dõi lỗi
        let errors = [];

        // Bước 2: Duyệt từng câu hỏi trong mảng
        for (let i = 0; i < data_XMLReq_array.length; i++) {
            const data_XMLReq_obj = data_XMLReq_array[i];

            // Bước 2.1: Kiểm tra tính hợp lệ của từng câu hỏi
            if (!data_XMLReq_obj || typeof data_XMLReq_obj !== "object") {
                errors.push(`Câu hỏi thứ ${i + 1}: Dữ liệu không hợp lệ`);
                continue;
            }

            // Bước 2.2: Kiểm tra các trường bắt buộc
            const requiredFields = ["question", "question_number", "total_questions", "option_1", "option_2", "option_3", "correct_answer_index", "progress"];
            let missingFields = [];
            for (const field of requiredFields) {
                if (!(field in data_XMLReq_obj)) {
                    missingFields.push(field);
                }
            }
            if (missingFields.length > 0) {
                errors.push(`Câu hỏi thứ ${i + 1}: Thiếu trường "${missingFields.join(', ')}"`);
                continue;
            }

            // Bước 2.3: Kiểm tra kiểu dữ liệu
            if (typeof data_XMLReq_obj.question !== "string") {
                errors.push(`Câu hỏi thứ ${i + 1}: Trường "question" phải là chuỗi`);
            }
            if (typeof data_XMLReq_obj.question_number !== "number") {
                errors.push(`Câu hỏi thứ ${i + 1}: Trường "question_number" phải là số`);
            }
            if (typeof data_XMLReq_obj.total_questions !== "number") {
                errors.push(`Câu hỏi thứ ${i + 1}: Trường "total_questions" phải là số`);
            }

            // Kiểm tra các options (3 đầu bắt buộc, option_4 tùy chọn)
            if (typeof data_XMLReq_obj.option_1 !== "string" || data_XMLReq_obj.option_1.trim() === "") {
                errors.push(`Câu hỏi thứ ${i + 1}: Trường "option_1" phải là chuỗi không rỗng`);
            }
            if (typeof data_XMLReq_obj.option_2 !== "string" || data_XMLReq_obj.option_2.trim() === "") {
                errors.push(`Câu hỏi thứ ${i + 1}: Trường "option_2" phải là chuỗi không rỗng`);
            }
            if (typeof data_XMLReq_obj.option_3 !== "string" || data_XMLReq_obj.option_3.trim() === "") {
                errors.push(`Câu hỏi thứ ${i + 1}: Trường "option_3" phải là chuỗi không rỗng`);
            }
            
            // option_4 là tùy chọn, chỉ kiểm tra nếu tồn tại
            if (data_XMLReq_obj.option_4 !== undefined && (typeof data_XMLReq_obj.option_4 !== "string" || data_XMLReq_obj.option_4.trim() === "")) {
                errors.push(`Câu hỏi thứ ${i + 1}: Trường "option_4" nếu có phải là chuỗi không rỗng`);
            }

            // Kiểm tra correct_answer_index
            if (typeof data_XMLReq_obj.correct_answer_index !== "number") {
                errors.push(`Câu hỏi thứ ${i + 1}: Trường "correct_answer_index" phải là số`);
            } else {
                // Kiểm tra giá trị hợp lệ (1-4)
                if (data_XMLReq_obj.correct_answer_index < 1 || data_XMLReq_obj.correct_answer_index > 4) {
                    errors.push(`Câu hỏi thứ ${i + 1}: Trường "correct_answer_index" phải từ 1 đến 4`);
                } else {
                    // Kiểm tra xem option được chọn có tồn tại không
                    const selectedOptionKey = `option_${data_XMLReq_obj.correct_answer_index}`;
                    if (!data_XMLReq_obj[selectedOptionKey] || data_XMLReq_obj[selectedOptionKey].trim() === "") {
                        errors.push(`Câu hỏi thứ ${i + 1}: Đáp án được chọn (${selectedOptionKey}) không tồn tại hoặc rỗng`);
                    }
                }
            }

            if (typeof data_XMLReq_obj.progress !== "string") {
                errors.push(`Câu hỏi thứ ${i + 1}: Trường "progress" phải là chuỗi`);
            }
        }

        // Bước 3: Trả về kết quả validation
        if (errors.length === 0) {
            return {
                alert: true,
                errCode: "000",
                content: "Dữ liệu hợp lệ"
            };
        } else {
            return {
                alert: false,
                errCode: "007",
                content: "Lỗi xác thực: " + errors.join("; "),
                details: errors
            };
        }
    } catch (error) {
        return {
            alert: false,
            errCode: "001",
            content: "Có lỗi hệ thống trong quá trình validate!"
        };
    }
}

// Thực hiện validation
verify_data_req = validateQuizQuestions(data_XMLReq_array);