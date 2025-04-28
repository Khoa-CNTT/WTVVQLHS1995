import psycopg2
import traceback

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
    
    # Kiểm tra các bảng trong cơ sở dữ liệu
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = cur.fetchall()
    
    print("\n--- CÁC BẢNG TRONG CƠ SỞ DỮ LIỆU ---\n")
    for table in tables:
        print(table[0])
    
    # Kiểm tra bảng LegalDocuments
    try:
        cur.execute("SELECT COUNT(*) FROM legaldocuments")
        count = cur.fetchone()[0]
        print(f"\nSố lượng văn bản pháp luật: {count}")
        
        if count > 0:
            # Kiểm tra các loại văn bản
            cur.execute("SELECT document_type, COUNT(*) FROM legaldocuments GROUP BY document_type ORDER BY COUNT(*) DESC")
            results = cur.fetchall()
            
            print("\n--- CÁC LOẠI VĂN BẢN TRONG CƠ SỞ DỮ LIỆU ---\n")
            for doc_type, doc_count in results:
                print(f"{doc_type or 'Không có loại'}: {doc_count}")
            
            # Lấy mẫu một số văn bản
            cur.execute("SELECT id, title, document_type FROM legaldocuments LIMIT 5")
            samples = cur.fetchall()
            
            print("\n--- MẪU VĂN BẢN ---\n")
            for doc_id, title, doc_type in samples:
                print(f"ID: {doc_id}, Loại: {doc_type or 'Không có'}, Tiêu đề: {title}")
    except Exception as e:
        print(f"\nLỗi khi truy vấn bảng legaldocuments: {e}")
        traceback.print_exc()
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Lỗi kết nối đến cơ sở dữ liệu: {e}")
    traceback.print_exc()

print("\nScript đã chạy xong.") 