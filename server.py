import http.server
import json
import os
import urllib.request
import urllib.error
import sys

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/chat':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                req_body = json.loads(post_data.decode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Invalid JSON: ' + str(e)}).encode('utf-8'))
                return

            gemini_key = os.environ.get('GEMINI_API_KEY', '')
            if not gemini_key:
                # Mock response if no API key
                mock_reply = "✅ **[TEST MODE — Không có GEMINI_API_KEY]**\n\nMình nhận được tin nhắn của bạn: \"" + \
                             (req_body.get('history', [{}])[-1].get('parts', [{}])[0].get('text', '(trống)') if req_body.get('history') else '(trống)') + \
                             "\"\n\nĐây là server test local chạy bằng Python. Để test thật với Gemini API, hãy chạy:\n```powershell\n$env:GEMINI_API_KEY=\"your_key_here\"\npython server.py\n```\n\n🔧 **Các thành phần đã test OK:**\n- ✅ Frontend load thành công\n- ✅ Chatbot UI hiển thị đúng\n- ✅ /api/chat endpoint hoạt động\n- ✅ Mock response hoạt động"
                response_data = {'reply': mock_reply}
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                return

            # If Gemini API Key is present, make real call
            try:
                history = req_body.get('history', [])
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
                
                system_prompt = 'Bạn là "Trợ lý Đầu tư" — chatbot AI chính thức của website daututaichinh.pro.'
                gemini_body = {
                    'system_instruction': {'parts': [{'text': system_prompt}]},
                    'contents': history,
                    'generationConfig': {'temperature': 0.7, 'maxOutputTokens': 2048}
                }
                
                req = urllib.request.Request(
                    gemini_url,
                    data=json.dumps(gemini_body).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                
                with urllib.request.urlopen(req) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    reply = res_data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'Xin lỗi, mình không thể trả lời lúc này.')
                    
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'reply': reply}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Gemini API call failed', 'details': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    # Force binding to IPv4 loopback (127.0.0.1) for maximum reliability
    server_address = ('127.0.0.1', PORT)
    httpd = http.server.HTTPServer(server_address, MyHTTPRequestHandler)
    print(f"[*] Python Local Server running at http://127.0.0.1:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        sys.exit(0)
