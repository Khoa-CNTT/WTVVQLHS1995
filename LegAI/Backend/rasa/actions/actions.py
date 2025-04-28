from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, FollowupAction
import requests
import json

from utils.chat_utils import (
    fetch_api, 
    send_text_with_buttons, 
    send_document_list, 
    send_document_detail,
    extract_entities,
    create_button,
    calculate_service_fee,
    check_user_authenticated
)

# URL của API Backend
API_URL = "http://localhost:8000/api"

class ActionSearchLegalDocuments(Action):
    """Hành động tìm kiếm văn bản pháp luật"""
    
    def name(self) -> Text:
        return "action_search_legal_documents"
        
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
            
        # Trích xuất thông tin tìm kiếm từ entities và slots
        entities = extract_entities(
            tracker, 
            ["document_type", "legal_field", "keyword", "issued_year"]
        )
        
        if not entities:
            dispatcher.utter_message(text="Bạn muốn tìm kiếm văn bản pháp luật nào?")
            return []
            
        # Gọi API tìm kiếm văn bản
        response = fetch_api("legal-documents/search", method="GET", params=entities)
        
        if not response or not response.get("documents"):
            dispatcher.utter_message(
                text="Tôi không tìm thấy văn bản pháp luật nào phù hợp với yêu cầu của bạn."
            )
            return []
            
        documents = response.get("documents", [])
        send_document_list(dispatcher, documents)
        
        return []


class ActionGetLegalDocument(Action):
    """Hành động lấy thông tin chi tiết của một văn bản pháp luật"""
    
    def name(self) -> Text:
        return "action_get_legal_document"
        
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
            
        document_id = tracker.get_slot("document_id")
        if not document_id:
            dispatcher.utter_message(text="Vui lòng cung cấp mã văn bản cần xem chi tiết.")
            return []
            
        # Gọi API lấy thông tin chi tiết
        response = fetch_api(f"legal-documents/{document_id}")
        
        if not response or not response.get("document"):
            dispatcher.utter_message(text="Không tìm thấy thông tin chi tiết của văn bản.")
            return []
            
        document = response.get("document", {})
        send_document_detail(dispatcher, document)
        
        return []


class ActionCalculateServiceFee(Action):
    """Hành động tính phí dịch vụ pháp lý"""
    
    def name(self) -> Text:
        return "action_calculate_service_fee"
        
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
            
        # Trích xuất thông tin dịch vụ từ entities và slots
        entities = extract_entities(
            tracker, 
            ["service_type", "duration", "complexity"]
        )
        
        if not entities.get("service_type"):
            dispatcher.utter_message(text="Bạn muốn biết phí của dịch vụ nào?")
            return []
            
        service_type = entities.get("service_type")
        duration = entities.get("duration")
        complexity = entities.get("complexity")
        
        # Tính phí dịch vụ
        fee_data = calculate_service_fee(service_type, duration, complexity)
        
        if not fee_data or not fee_data.get("fee"):
            dispatcher.utter_message(
                text="Xin lỗi, tôi không thể tính phí cho dịch vụ này. "
                "Vui lòng liên hệ trực tiếp với chúng tôi để biết thêm chi tiết."
            )
            return []
            
        fee = fee_data.get("fee")
        fee_message = f"Phí dịch vụ {service_type} là {fee:,} VNĐ"
        
        if fee_data.get("note"):
            fee_message += f"\n\nLưu ý: {fee_data.get('note')}"
            
        buttons = [
            create_button(
                "Đặt lịch hẹn tư vấn", 
                "/request_consultation"
            ),
            create_button(
                "Thanh toán dịch vụ", 
                f"/initiate_payment{{\"service_type\": \"{service_type}\", \"fee\": {fee}}}"
            )
        ]
        
        send_text_with_buttons(dispatcher, fee_message, buttons)
        
        return [SlotSet("service_fee", fee)]


class ActionScheduleAppointment(Action):
    """Hành động đặt lịch hẹn với luật sư"""
    
    def name(self) -> Text:
        return "action_schedule_appointment"
        
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
            
        # Kiểm tra xem người dùng đã đăng nhập chưa
        user_id = tracker.sender_id
        if not check_user_authenticated(user_id):
            dispatcher.utter_message(
                text="Bạn cần đăng nhập để đặt lịch hẹn. "
                "Vui lòng đăng nhập và thử lại sau."
            )
            return []
            
        # Trích xuất thông tin lịch hẹn từ entities và slots
        entities = extract_entities(
            tracker, 
            ["appointment_date", "appointment_time", "legal_field", "lawyer_id"]
        )
        
        if not entities.get("appointment_date") or not entities.get("appointment_time"):
            dispatcher.utter_message(
                text="Vui lòng cho biết ngày và giờ bạn muốn đặt lịch hẹn."
            )
            return []
            
        # Gọi API đặt lịch hẹn
        appointment_data = {
            "user_id": user_id,
            "appointment_date": entities.get("appointment_date"),
            "appointment_time": entities.get("appointment_time"),
            "legal_field": entities.get("legal_field"),
            "lawyer_id": entities.get("lawyer_id")
        }
        
        response = fetch_api("appointments/create", method="POST", data=appointment_data)
        
        if not response or not response.get("success"):
            error_msg = response.get("error", "Không thể đặt lịch hẹn vào thời gian này")
            dispatcher.utter_message(text=f"Đã xảy ra lỗi: {error_msg}")
            return []
            
        appointment = response.get("appointment", {})
        confirm_message = (
            f"Đã đặt lịch hẹn thành công!\n\n"
            f"Ngày: {appointment.get('date')}\n"
            f"Giờ: {appointment.get('time')}\n"
        )
        
        if appointment.get("lawyer_name"):
            confirm_message += f"Luật sư: {appointment.get('lawyer_name')}\n"
            
        if appointment.get("location"):
            confirm_message += f"Địa điểm: {appointment.get('location')}\n"
            
        buttons = [
            create_button(
                "Xem lịch hẹn", 
                "/view_appointments"
            ),
            create_button(
                "Hủy lịch hẹn", 
                f"/cancel_appointment{{\"appointment_id\": \"{appointment.get('id')}\"}}"
            )
        ]
        
        send_text_with_buttons(dispatcher, confirm_message, buttons)
        
        return []


class ActionInitiatePayment(Action):
    """Hành động bắt đầu thanh toán dịch vụ"""
    
    def name(self) -> Text:
        return "action_initiate_payment"
        
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
            
        # Kiểm tra xem người dùng đã đăng nhập chưa
        user_id = tracker.sender_id
        if not check_user_authenticated(user_id):
            dispatcher.utter_message(
                text="Bạn cần đăng nhập để thanh toán. "
                "Vui lòng đăng nhập và thử lại sau."
            )
            return []
            
        service_type = tracker.get_slot("service_type")
        service_fee = tracker.get_slot("service_fee")
        
        if not service_type or not service_fee:
            dispatcher.utter_message(
                text="Vui lòng chọn dịch vụ trước khi thanh toán."
            )
            return []
            
        payment_message = (
            f"Để thanh toán dịch vụ {service_type} với phí {service_fee:,} VNĐ, "
            "bạn có thể chọn một trong các phương thức sau:"
        )
        
        buttons = [
            create_button(
                "Thanh toán trực tuyến", 
                f"/online_payment{{\"service_type\": \"{service_type}\", \"fee\": {service_fee}}}"
            ),
            create_button(
                "Chuyển khoản ngân hàng", 
                f"/bank_transfer{{\"service_type\": \"{service_type}\", \"fee\": {service_fee}}}"
            ),
            create_button(
                "Thanh toán tại văn phòng", 
                "/office_payment"
            )
        ]
        
        send_text_with_buttons(dispatcher, payment_message, buttons)
        
        return []


class ActionCompareDocuments(Action):
    """Hành động so sánh hai văn bản pháp luật"""
    
    def name(self) -> Text:
        return "action_compare_documents"
        
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
            
        # Trích xuất thông tin hai văn bản cần so sánh
        doc1_id = tracker.get_slot("document_id_1")
        doc2_id = tracker.get_slot("document_id_2")
        
        if not doc1_id or not doc2_id:
            dispatcher.utter_message(
                text="Vui lòng cung cấp hai văn bản cần so sánh."
            )
            return []
            
        # Gọi API so sánh văn bản
        compare_data = {
            "document_id_1": doc1_id,
            "document_id_2": doc2_id
        }
        
        response = fetch_api("legal-documents/compare", method="POST", data=compare_data)
        
        if not response or not response.get("comparison"):
            dispatcher.utter_message(
                text="Không thể so sánh hai văn bản này. "
                "Vui lòng thử lại với các văn bản khác."
            )
            return []
            
        comparison = response.get("comparison", {})
        doc1_info = comparison.get("document1", {})
        doc2_info = comparison.get("document2", {})
        differences = comparison.get("differences", [])
        
        comparison_message = (
            f"So sánh giữa:\n"
            f"1. {doc1_info.get('title')} - {doc1_info.get('number')}\n"
            f"2. {doc2_info.get('title')} - {doc2_info.get('number')}\n\n"
            f"Những điểm khác biệt chính:\n"
        )
        
        for i, diff in enumerate(differences[:5], 1):
            comparison_message += f"{i}. {diff}\n"
            
        if len(differences) > 5:
            comparison_message += f"\nCòn {len(differences) - 5} điểm khác biệt khác."
            
        buttons = [
            create_button(
                "Xem chi tiết văn bản 1", 
                f"/get_legal_document{{\"document_id\": \"{doc1_id}\"}}"
            ),
            create_button(
                "Xem chi tiết văn bản 2", 
                f"/get_legal_document{{\"document_id\": \"{doc2_id}\"}}"
            ),
            create_button(
                "Xem báo cáo đầy đủ", 
                f"/full_comparison_report{{\"document_id_1\": \"{doc1_id}\", \"document_id_2\": \"{doc2_id}\"}}"
            )
        ]
        
        send_text_with_buttons(dispatcher, comparison_message, buttons)
        
        return [] 