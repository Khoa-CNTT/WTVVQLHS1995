import psycopg2
from urllib.parse import urlparse
import traceback

def determine_document_type_from_url(url):
    """Xác định loại văn bản từ URL"""
    url_path = url.lower()
    print(f"Đang phân tích URL: {url}")
    
    # Kiểm tra trường hợp đặc biệt cho URL ví dụ
    if "nghi-quyet-103-nq-cp-2025" in url_path:
        print(f"URL chứa nghị quyết 103-NQ-CP-2025")
        return "NGHỊ QUYẾT"
    
    # Kiểm tra từ tên file URL - ưu tiên cao hơn
    if "/nghi-quyet-" in url_path or "-nq-" in url_path:
        print(f"Xác định loại văn bản từ tên file: NGHỊ QUYẾT")
        return "NGHỊ QUYẾT"
    elif "/nghi-dinh-" in url_path or "-nd-" in url_path:
        print(f"Xác định loại văn bản từ tên file: NGHỊ ĐỊNH")
        return "NGHỊ ĐỊNH"
    elif "/thong-tu-" in url_path or "-tt-" in url_path:
        print(f"Xác định loại văn bản từ tên file: THÔNG TƯ")
        return "THÔNG TƯ"
    elif "/quyet-dinh-" in url_path or "-qd-" in url_path:
        print(f"Xác định loại văn bản từ tên file: QUYẾT ĐỊNH")
        return "QUYẾT ĐỊNH"
    elif "/chi-thi-" in url_path or "-ct-" in url_path:
        print(f"Xác định loại văn bản từ tên file: CHỈ THỊ")
        return "CHỈ THỊ"
    elif "/cong-van-" in url_path or "-cv-" in url_path:
        print(f"Xác định loại văn bản từ tên file: CÔNG VĂN")
        return "CÔNG VĂN"
    elif "/thong-bao-" in url_path or "-tb-" in url_path:
        print(f"Xác định loại văn bản từ tên file: THÔNG BÁO")
        return "THÔNG BÁO"
    
    # Kiểm tra mã ký hiệu văn bản trong URL
    if "/nq-" in url_path or "nq-" in url_path:
        print(f"Xác định loại văn bản từ mã ký hiệu: NGHỊ QUYẾT")
        return "NGHỊ QUYẾT"
    elif "/nd-" in url_path or "nd-" in url_path:
        print(f"Xác định loại văn bản từ mã ký hiệu: NGHỊ ĐỊNH")
        return "NGHỊ ĐỊNH"
    elif "/tt-" in url_path or "tt-" in url_path:
        print(f"Xác định loại văn bản từ mã ký hiệu: THÔNG TƯ")
        return "THÔNG TƯ"
    elif "/qd-" in url_path or "qd-" in url_path:
        print(f"Xác định loại văn bản từ mã ký hiệu: QUYẾT ĐỊNH")
        return "QUYẾT ĐỊNH"
    elif "/ct-" in url_path or "ct-" in url_path:
        print(f"Xác định loại văn bản từ mã ký hiệu: CHỈ THỊ")
        return "CHỈ THỊ"
    elif "/cv-" in url_path or "cv-" in url_path:
        print(f"Xác định loại văn bản từ mã ký hiệu: CÔNG VĂN")
        return "CÔNG VĂN"
    elif "/tb-" in url_path or "tb-" in url_path:
        print(f"Xác định loại văn bản từ mã ký hiệu: THÔNG BÁO")
        return "THÔNG BÁO"
    
    # Kiểm tra từ phần đường dẫn URL - ưu tiên thấp hơn
    if "nghi-quyet" in url_path:
        print(f"Xác định loại văn bản từ đường dẫn: NGHỊ QUYẾT")
        return "NGHỊ QUYẾT"
    elif "nghi-dinh" in url_path:
        print(f"Xác định loại văn bản từ đường dẫn: NGHỊ ĐỊNH")
        return "NGHỊ ĐỊNH"
    elif "thong-tu" in url_path:
        print(f"Xác định loại văn bản từ đường dẫn: THÔNG TƯ")
        return "THÔNG TƯ"
    elif "quyet-dinh" in url_path:
        print(f"Xác định loại văn bản từ đường dẫn: QUYẾT ĐỊNH")
        return "QUYẾT ĐỊNH"
    elif "chi-thi" in url_path:
        print(f"Xác định loại văn bản từ đường dẫn: CHỈ THỊ")
        return "CHỈ THỊ"
    elif "cong-van" in url_path:
        print(f"Xác định loại văn bản từ đường dẫn: CÔNG VĂN")
        return "CÔNG VĂN"
    elif "thong-bao" in url_path:
        print(f"Xác định loại văn bản từ đường dẫn: THÔNG BÁO")
        return "THÔNG BÁO"
    elif "luat" in url_path and not any(x in url_path for x in ["nghi-dinh", "thong-tu", "quyet-dinh", "nghi-quyet"]):
        print(f"Xác định loại văn bản từ đường dẫn: LUẬT")
        return "LUẬT"
    
    print(f"Không thể xác định loại văn bản từ URL: {url}")
    return None

try:
    print("Đang kết nối đến cơ sở dữ liệu...")
    conn = psycopg2.connect(
        dbname="legai",
        user="postgres",
        password="123456",
        host="localhost",
        port="5432"
    )
    print("Kết nối thành công!")
    
    cur = conn.cursor()
    
    # Lấy số lượng văn bản cần cập nhật (không có loại hoặc loại là VĂN BẢN KHÁC)
    cur.execute("SELECT COUNT(*) FROM legaldocuments WHERE document_type IS NULL OR document_type = 'VĂN BẢN KHÁC'")
    count_to_update = cur.fetchone()[0]
    print(f"\nSố lượng văn bản cần cập nhật: {count_to_update}")
    
    # Thống kê loại văn bản trước khi cập nhật
    cur.execute("SELECT document_type, COUNT(*) FROM legaldocuments GROUP BY document_type ORDER BY COUNT(*) DESC")
    before_results = cur.fetchall()
    
    print("\n--- THỐNG KÊ LOẠI VĂN BẢN TRƯỚC KHI CẬP NHẬT ---\n")
    for doc_type, doc_count in before_results:
        print(f"{doc_type or 'Không có loại'}: {doc_count}")
    
    # Lấy tất cả văn bản cần cập nhật
    cur.execute("SELECT id, source_url FROM legaldocuments WHERE document_type IS NULL OR document_type = 'VĂN BẢN KHÁC'")
    documents = cur.fetchall()
    
    updated_count = 0
    document_types_count = {}
    
    # Cập nhật loại văn bản dựa vào URL
    for doc_id, source_url in documents:
        if source_url:
            doc_type = determine_document_type_from_url(source_url)
            if doc_type:
                cur.execute("UPDATE legaldocuments SET document_type = %s WHERE id = %s", (doc_type, doc_id))
                document_types_count[doc_type] = document_types_count.get(doc_type, 0) + 1
                updated_count += 1
                
                # Log thông tin cập nhật
                if updated_count % 100 == 0:
                    print(f"Đã cập nhật {updated_count}/{len(documents)} văn bản")
    
    # Commit thay đổi
    conn.commit()
    
    print(f"\nĐã cập nhật thành công {updated_count} văn bản")
    
    # Hiển thị thông tin các loại văn bản đã cập nhật
    print("\n--- CÁC LOẠI VĂN BẢN ĐÃ CẬP NHẬT ---\n")
    for doc_type, count in document_types_count.items():
        print(f"{doc_type}: {count}")
    
    # Thống kê loại văn bản sau khi cập nhật
    cur.execute("SELECT document_type, COUNT(*) FROM legaldocuments GROUP BY document_type ORDER BY COUNT(*) DESC")
    after_results = cur.fetchall()
    
    print("\n--- THỐNG KÊ LOẠI VĂN BẢN SAU KHI CẬP NHẬT ---\n")
    for doc_type, doc_count in after_results:
        print(f"{doc_type or 'Không có loại'}: {doc_count}")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Lỗi: {e}")
    traceback.print_exc()
    if 'conn' in locals() and conn:
        conn.rollback()
        conn.close()

print("\nScript đã chạy xong.") 