import os
import json
import requests
from typing import Dict, List, Any, Text, Optional
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

# URL cơ sở của API Backend
BASE_API_URL = os.getenv("API_URL", "http://localhost:8000/api")

def create_button(title: Text, payload: Text, type: Text = "postback") -> Dict[Text, Any]:
    """
    Tạo một nút tương tác cho người dùng
    
    Args:
        title: Tiêu đề của nút
        payload: Dữ liệu gửi khi nhấn nút
        type: Loại nút (mặc định: postback)
        
    Returns:
        Dict: Đối tượng nút có thể được thêm vào danh sách nút
    """
    return {
        "title": title,
        "payload": payload,
        "type": type
    }

def send_text_with_buttons(
    dispatcher: CollectingDispatcher,
    text: Text,
    buttons: List[Dict[Text, Any]]
) -> None:
    """
    Gửi tin nhắn văn bản kèm các nút tương tác
    
    Args:
        dispatcher: Đối tượng dispatcher từ Rasa
        text: Nội dung tin nhắn
        buttons: Danh sách các nút
    """
    dispatcher.utter_message(text=text, buttons=buttons)

def send_document_list(
    dispatcher: CollectingDispatcher,
    documents: List[Dict[Text, Any]]
) -> None:
    """
    Gửi danh sách văn bản pháp luật với các nút xem chi tiết
    
    Args:
        dispatcher: Đối tượng dispatcher từ Rasa
        documents: Danh sách các văn bản pháp luật
    """
    if not documents or len(documents) == 0:
        dispatcher.utter_message(text="Không tìm thấy văn bản pháp luật nào phù hợp.")
        return
        
    intro_text = f"Tôi đã tìm thấy {len(documents)} văn bản pháp luật:"
    dispatcher.utter_message(text=intro_text)
    
    for i, doc in enumerate(documents, 1):
        doc_text = f"{i}. {doc.get('title')} - {doc.get('number')}"
        if doc.get('issued_date'):
            doc_text += f" - Ngày ban hành: {doc.get('issued_date')}"
            
        buttons = [
            create_button(
                "Xem chi tiết", 
                f"/get_legal_document{{\"document_id\": \"{doc.get('id')}\"}}"
            )
        ]
        send_text_with_buttons(dispatcher, doc_text, buttons)

def send_document_detail(
    dispatcher: CollectingDispatcher,
    document: Dict[Text, Any]
) -> None:
    """
    Gửi chi tiết một văn bản pháp luật
    
    Args:
        dispatcher: Đối tượng dispatcher từ Rasa
        document: Thông tin chi tiết văn bản pháp luật
    """
    if not document:
        dispatcher.utter_message(text="Không tìm thấy thông tin chi tiết của văn bản.")
        return
        
    detail_text = f"Thông tin chi tiết về văn bản:\n"
    detail_text += f"- Tiêu đề: {document.get('title')}\n"
    detail_text += f"- Số hiệu: {document.get('number')}\n"
    detail_text += f"- Ngày ban hành: {document.get('issued_date')}\n"
    detail_text += f"- Cơ quan ban hành: {document.get('issuing_body')}\n"
    detail_text += f"- Lĩnh vực: {document.get('legal_field')}\n"
    
    if document.get('summary'):
        detail_text += f"- Tóm tắt: {document.get('summary')}\n"
    
    buttons = [
        create_button(
            "Xem toàn văn", 
            f"/view_full_document{{\"document_id\": \"{document.get('id')}\"}}"
        )
    ]
    
    send_text_with_buttons(dispatcher, detail_text, buttons)

def fetch_api(
    endpoint: Text,
    method: Text = "GET",
    params: Dict[Text, Any] = None,
    data: Dict[Text, Any] = None,
    headers: Dict[Text, Any] = None
) -> Optional[Dict[Text, Any]]:
    """
    Gọi API đến backend
    
    Args:
        endpoint: Đường dẫn API (không bao gồm BASE_API_URL)
        method: Phương thức HTTP (GET, POST, PUT, DELETE)
        params: Tham số truy vấn
        data: Dữ liệu gửi lên
        headers: Header của request
        
    Returns:
        Dict hoặc None: Kết quả từ API hoặc None nếu có lỗi
    """
    url = f"{BASE_API_URL}/{endpoint.lstrip('/')}"
    
    default_headers = {
        "Content-Type": "application/json"
    }
    
    if headers:
        default_headers.update(headers)
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=params, headers=default_headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=default_headers)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=default_headers)
        elif method.upper() == "DELETE":
            response = requests.delete(url, json=data, headers=default_headers)
        else:
            return None
            
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API error: {e}")
        return None

def check_user_authenticated(user_id: Text) -> bool:
    """
    Kiểm tra xem người dùng đã đăng nhập hay chưa
    
    Args:
        user_id: ID của người dùng
        
    Returns:
        bool: True nếu đã đăng nhập, False nếu chưa
    """
    response = fetch_api(f"users/check-auth/{user_id}")
    if response and response.get("authenticated"):
        return True
    return False

def extract_entities(tracker, entity_names: List[Text]) -> Dict[Text, Any]:
    """
    Trích xuất các entity từ tracker
    
    Args:
        tracker: Rasa tracker object
        entity_names: Danh sách tên các entity cần trích xuất
        
    Returns:
        Dict: Dictionary chứa các entity đã trích xuất
    """
    entities = {}
    
    for entity_name in entity_names:
        entity_value = next(
            (e["value"] for e in tracker.latest_message.get("entities", []) 
             if e["entity"] == entity_name),
            None
        )
        
        if entity_value:
            entities[entity_name] = entity_value
        else:
            slot_value = tracker.get_slot(entity_name)
            if slot_value:
                entities[entity_name] = slot_value
    
    return entities

def calculate_service_fee(
    service_type: Text,
    duration: Text = None,
    complexity: Text = None
) -> Dict[Text, Any]:
    """
    Tính phí dịch vụ dựa trên loại, thời gian và độ phức tạp
    
    Args:
        service_type: Loại dịch vụ
        duration: Thời gian sử dụng dịch vụ
        complexity: Độ phức tạp của dịch vụ
        
    Returns:
        Dict: Thông tin về phí dịch vụ
    """
    data = {
        "service_type": service_type,
    }
    
    if duration:
        data["duration"] = duration
        
    if complexity:
        data["complexity"] = complexity
    
    response = fetch_api("chatbot/calculate-fee", method="POST", data=data)
    return response if response else {} 