// Script để kiểm tra phản hồi của AI
const ollamaService = require('./src/services/ollamaService');
const aiService = require('./src/services/aiService');

// Hàm test response
async function testAIResponse() {
  try {
    console.log('Kiểm tra kết nối Ollama...');
    const isConnected = await ollamaService.checkConnection();
    console.log(`Kết nối Ollama: ${isConnected ? 'Thành công' : 'Thất bại'}`);
    
    if (isConnected) {
      // Test câu trả lời với câu hỏi về danh tính (AI là ai) - ĐÃ CẢI THIỆN
      console.log('\n--- Test câu hỏi về danh tính "Bạn là ai?" ---');
      const identityResponse = await aiService.answerLegalQuestion('Bạn là ai?');
      console.log('Phản hồi:', identityResponse.answer);
      
      // Test câu trả lời với câu chào đơn giản - ĐÃ CẢI THIỆN
      console.log('\n--- Test câu chào đơn giản "Xin chào" ---');
      const greetingResponse = await aiService.answerLegalQuestion('Xin chào');
      console.log('Phản hồi:', greetingResponse.answer);
      
      // Test câu trả lời với từ khóa tư vấn pháp luật - ĐÃ CẢI THIỆN
      console.log('\n--- Test với từ khóa "Tư vấn pháp luật" ---');
      const legalAdviceResponse = await aiService.answerLegalQuestion('Tôi cần tư vấn pháp luật');
      console.log('Phản hồi:', legalAdviceResponse.answer);
      
      // Test câu trả lời với từ khóa "luật sư"
      console.log('\n--- Test với từ khóa "luật sư" ---');
      const lawyerResponse = await aiService.answerLegalQuestion('Bạn có biết luật sư nào không?');
      console.log('Phản hồi:', lawyerResponse.answer);
      
      // Test câu trả lời với từ khóa pháp luật
      console.log('\n--- Test với từ khóa chuyên ngành "luật hôn nhân gia đình" ---');
      const legalTopicResponse = await aiService.answerLegalQuestion('Tư vấn về luật hôn nhân gia đình');
      console.log('Phản hồi:', legalTopicResponse.answer);
    } else {
      console.log('Không thể kết nối đến Ollama, vui lòng kiểm tra lại.');
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra phản hồi:', error);
  }
}

// Thực thi test
testAIResponse()
  .then(() => console.log('Hoàn thành kiểm tra'))
  .catch(err => console.error('Lỗi:', err)); 