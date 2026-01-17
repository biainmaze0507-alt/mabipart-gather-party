from flask import Flask, request, jsonify, make_response, Response
from flask.typing import ResponseReturnValue
from flask_cors import CORS
import os
import shutil
import requests
from urllib.parse import urlparse, urlunparse, parse_qs

# .env 지원 (선택): python-dotenv이 설치되어 있다면 로드
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("[OK] .env 로드 완료")
except Exception:
    # 미설치 또는 로드 실패 시 무시
    pass
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.keys import Keys
import time
import traceback

app = Flask(__name__)
CORS(app)

# 환경 변수
DISCORD_WEBHOOK_URL = os.getenv('DISCORD_WEBHOOK_URL', '').strip()
PARTY_SITE_URL = os.getenv('PARTY_SITE_URL', '').strip()

def init_driver():
    """Chrome 드라이버 초기화 (로컬/Render 모두 지원)"""
    chrome_options = Options()
    chrome_options.add_argument('--headless=new')  # 최신 헤드리스 모드
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--lang=ko-KR')  # 한국어 페이지 로딩
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    chrome_path = os.getenv('CHROME_BIN') or shutil.which('chromium-browser') or shutil.which('chromium') or shutil.which('google-chrome')
    driver_path = os.getenv('CHROMEDRIVER_PATH') or shutil.which('chromedriver')

    if chrome_path:
        chrome_options.binary_location = chrome_path
        print(f"[INFO] chrome binary: {chrome_path}")
    else:
        print("[WARN] chrome binary not found; webdriver-manager fallback")

    try:
        if driver_path:
            print(f"[INFO] chromedriver path: {driver_path}")
            service = Service(driver_path)
        else:
            print("[INFO] using webdriver-manager to download chromedriver")
            service = Service(ChromeDriverManager().install())

        driver = webdriver.Chrome(service=service, options=chrome_options)
        print("[OK] Chrome 드라이버 초기화 성공!")
        return driver
    except Exception as e:
        print(f"[ERROR] Chrome 드라이버 초기화 실패: {e}")
        raise

def search_character(character_name):
    """캐릭터 정보 검색 - 알리사 서버 고정"""
    driver = None
    try:
        print(f"\n{'='*50}")
        print(f"[INFO] 검색 시작: {character_name}")
        print(f"{'='*50}")
        
        driver = init_driver()
        
        # 알리사 서버로 직접 접속
        url = 'https://mabinogimobile.nexon.com/Ranking/List?t=1&server=알리사'
        print(f"[LOG] 페이지 로딩: {url}")
        driver.get(url)
        
        # 페이지 로딩 대기
        wait = WebDriverWait(driver, 20)
        time.sleep(3)
        
        # 알리사 서버 선택
        print("[LOG] 알리사 서버 선택 중...")
        try:
            # 서버 선택 박스 클릭
            server_box = wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, '.select_server .select_box'))
            )
            driver.execute_script("arguments[0].click();", server_box)
            time.sleep(1)
            
            # 알리사 선택 (data-serverid="4")
            alisa_option = wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, 'li[data-serverid="4"]'))
            )
            driver.execute_script("arguments[0].click();", alisa_option)
            time.sleep(2)
            print("[OK] 알리사 서버 선택 완료")
        except Exception as e:
            print(f"[WARN] 서버 선택 실패: {e}")
        
        # 검색창 찾기 및 입력
        print("[LOG] 검색창 찾는 중...")
        search_input = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="text"]'))
        )
        print(f"[OK] 검색창 발견, 입력 중: {character_name}")
        search_input.clear()
        search_input.send_keys(character_name)
        search_input.send_keys(Keys.RETURN)
        
        print("[LOG] 검색 결과 대기 중...")
        time.sleep(6)  # 검색 결과 로딩 대기 (느린 환경 대비)
        print(f"[LOG] 페이지 타이틀: {driver.title}")
        
        # 현재 URL 확인
        print(f"[LOG] 현재 URL: {driver.current_url}")
        
        # data-charactername 속성으로 캐릭터 찾기
        print(f"[LOG] 캐릭터 찾는 중: {character_name}")
        
        try:
            character_dd = wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, f'dd[data-charactername="{character_name}"]'))
            )
            print("[OK] 캐릭터 발견!")
        except Exception as e:
            print("[ERROR] 캐릭터를 찾을 수 없습니다. 스크린샷 저장 중...")
            driver.save_screenshot('not_found.png')
            print("[LOG] 스크린샷 저장됨: not_found.png")
            print(f"[LOG] 페이지 타이틀: {driver.title}")
            print(f"[LOG] 현재 URL: {driver.current_url}")
            print(f"[LOG] 예외: {e}")
            
            # 페이지 HTML 일부 출력
            page_source = driver.page_source
            if character_name in page_source:
                print("[WARN] 페이지에는 캐릭터명이 있지만 요소를 찾지 못했습니다.")
            else:
                print("[WARN] 페이지에 캐릭터명이 없습니다. 검색 실패했을 가능성이 큽니다.")
            
            raise Exception(f"캐릭터 '{character_name}'을(를) 찾을 수 없습니다.")
        
        # 부모 li 요소 찾기
        parent_li = character_dd.find_element(By.XPATH, './ancestor::li[contains(@class, "item")]')
        print("[LOG] 부모 li 요소 찾음")
        
        # 모든 div 요소 찾기
        divs = parent_li.find_elements(By.TAG_NAME, 'div')
        print(f"[LOG] div 요소 개수: {len(divs)}")
        
        # 각 정보 추출 - 순서대로 가져오기
        rank = ""
        server = ""
        name = ""
        char_class = ""
        power = ""
        
        try:
            # div[0]: 순위
            rank_dt = divs[0].find_element(By.TAG_NAME, 'dt').text.strip()
            rank = rank_dt
            print(f"[LOG] 순위: {rank}")
            
            # div[1]: 서버명
            server_dd = divs[1].find_element(By.TAG_NAME, 'dd').text.strip()
            server = server_dd
            print(f"[LOG] 서버: {server}")
            
            # div[2]: 캐릭터명
            name_dd = divs[2].find_element(By.TAG_NAME, 'dd').text.strip()
            name = name_dd
            print(f"[LOG] 캐릭터명: {name}")
            
            # div[3]: 클래스
            class_dd = divs[3].find_element(By.TAG_NAME, 'dd').text.strip()
            char_class = class_dd
            print(f"[LOG] 클래스: {char_class}")
            
            # div[4]: 전투력
            power_dd = divs[4].find_element(By.TAG_NAME, 'dd').text.strip()
            power = power_dd
            print(f"[LOG] 전투력: {power}")
            
        except Exception as e:
            print(f"[WARN] 정보 추출 중 에러: {e}")
        
        print("[OK] 검색 완료!")
        print(f"   순위: {rank}")
        print(f"   서버: {server}")
        print(f"   캐릭터명: {name}")
        print(f"   클래스: {char_class}")
        print(f"   전투력: {power}")
        
        # 순위 범위 정보도 추출 (선택적)
        try:
            rank_range = driver.find_element(By.CSS_SELECTOR, '.pager .current_range span').text.strip()
        except:
            rank_range = ""
        
        return {
            'success': True,
            'data': {
                'rank': rank,
                'server': server,
                'name': name,
                'class': char_class,
                'power': power,
                'rank_range': rank_range
            }
        }
        
    except Exception as e:
        print(f"\n[ERROR] 에러 발생: {str(e)}")
        traceback.print_exc()
        
        # 스크린샷 저장 (디버깅용)
        if driver:
            try:
                driver.save_screenshot('error_screenshot.png')
                print("[LOG] 에러 스크린샷 저장: error_screenshot.png")
            except:
                pass
        
        return {
            'success': False,
            'error': f'캐릭터 "{character_name}"을(를) 찾을 수 없습니다. 정확한 캐릭터명을 입력했는지 확인해주세요.'
        }
    
    finally:
        if driver:
            print("[LOG] 브라우저 종료\n")
            driver.quit()


def format_power(value: str) -> str:
    """전투력 숫자에 1,000 단위 구분자 적용"""
    try:
        digits = ''.join(ch for ch in str(value) if ch.isdigit())
        if not digits:
            return str(value)
        return f"{int(digits):,}"
    except Exception:
        return str(value)


def send_discord_notification(party: dict, count: int):
    """디스코드 웹훅으로 파티 등록 알림 전송"""
    try:
        if not DISCORD_WEBHOOK_URL:
            print("[INFO] DISCORD_WEBHOOK_URL 미설정: 알림 건너뜀")
            return

        sector = party.get('sector', '')
        content = party.get('content', '')
        difficulty = party.get('difficulty', '')
        nickname = party.get('character', '')
        char_class = party.get('class', '')
        power = format_power(party.get('power', ''))

        lines = [
            "새로운 파티 모집 정보가 등록되었습니다.",
            f"> 대분류: {sector}",
        ]

        # 어비스는 콘텐츠 라인 생략
        if sector != '어비스' and content:
            lines.append(f"> 콘텐츠: {content}")

        lines.extend([
            f"> 난이도: {difficulty}",
            f"> 닉네임: {nickname}",
            f"> 클래스: {char_class}",
            f"> 전투력: {power}",
        ])

        # 현재 등록 인원 문구
        if sector == '어비스':
            count_line = f"현재 어비스, {difficulty} 등록 인원: {count}명"
        else:
            count_line = f"현재 레이드 {content}, {difficulty} 등록 인원: {count}명"
        lines.append(count_line)

        # 사이트 링크 (옵션)
        if PARTY_SITE_URL:
            lines.append(f"[파티 모집 사이트 바로가기] {PARTY_SITE_URL}")

        content_text = "\n".join(lines)
        payload = {"content": content_text}

        resp = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10)
        if 200 <= resp.status_code < 300:
            print("[OK] 디스코드 알림 전송 성공")
        else:
            print(f"[WARN] 디스코드 알림 실패: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"[WARN] 디스코드 알림 예외: {e}")


def get_party_count(sheets_url_with_action: str, party: dict) -> int:
    """시트에서 동일한 카테고리/난이도의 현재 등록 인원 수 집계"""
    try:
        # getParties URL 구성
        parsed = urlparse(sheets_url_with_action)
        get_parties_url = urlunparse(parsed._replace(query='action=getParties'))

        resp = requests.get(get_parties_url, timeout=15)
        try:
            data = resp.json() if resp.ok else {}
        except Exception:
            data = {}
        rows = data.get('data', []) if data.get('success') else []

        sector = party.get('sector')
        content = party.get('content')
        difficulty = party.get('difficulty')

        def matches(row):
            try:
                if sector == '어비스':
                    return row.get('sector') == '어비스' and row.get('content') == '어비스' and row.get('difficulty') == difficulty
                else:
                    return row.get('sector') == '레이드' and row.get('content') == content and row.get('difficulty') == difficulty
            except Exception:
                return False

        count = sum(1 for r in rows if matches(r))
        return count
    except Exception as e:
        print(f"[WARN] 등록 인원 조회 실패: {e}")
        return 0

# 응답 파싱 유틸리티: JSON 파싱 실패 시 텍스트로 래핑
def _response_to_json(response):
    try:
        data = response.json()
        return data
    except Exception:
        return {
            'success': 200 <= response.status_code < 300,
            'status': response.status_code,
            'text': response.text
        }

@app.route('/api/search', methods=['GET'])
def search() -> ResponseReturnValue:
    """캐릭터 검색 API"""
    character_name = request.args.get('name', '')
    
    if not character_name:
        return make_response(jsonify({'success': False, 'error': '캐릭터명을 입력해주세요'}), 400)
    
    result = search_character(character_name)
    
    if result['success']:
        return jsonify(result)
    else:
        return make_response(jsonify(result), 404)

@app.route('/health', methods=['GET'])
def health() -> ResponseReturnValue:
    """헬스체크"""
    return jsonify({'status': 'ok'})

@app.route('/api/proxy/sheets', methods=['GET', 'POST', 'DELETE'])
def proxy_sheets() -> ResponseReturnValue:
    """구글 스프레드시트 프록시 - CORS 문제 해결"""
    try:
        sheets_url = request.args.get('url')
        if not sheets_url:
            return make_response(jsonify({'success': False, 'error': 'URL이 필요합니다'}), 400)
        
        # 액션 추출
        parsed = urlparse(sheets_url)
        qs = parse_qs(parsed.query)
        action = (qs.get('action', [''])[0]).lower()

        if request.method == 'GET':
            response = requests.get(sheets_url, timeout=20)
            return jsonify(_response_to_json(response))
        elif request.method == 'POST':
            payload = request.get_json() or {}
            response = requests.post(sheets_url, json=payload, timeout=20)
            resp_json = _response_to_json(response)

            # addParty 성공 시 디스코드 알림 전송 (JSON 응답 없더라도 상태코드가 2xx면 성공으로 간주)
            success_flag = bool(resp_json.get('success')) if isinstance(resp_json, dict) else False
            if action == 'addparty' and (success_flag or (200 <= response.status_code < 300)):
                try:
                    count = get_party_count(sheets_url, payload)
                    send_discord_notification(payload, count)
                except Exception as e:
                    print(f"[WARN] 알림 처리 중 예외: {e}")

            return jsonify(resp_json)
        elif request.method == 'DELETE':
            response = requests.delete(sheets_url, json=request.get_json(), timeout=20)
            return jsonify(_response_to_json(response))
        else:
            # 명시적 처리: 허용되지 않은 메서드
            return make_response(jsonify({'success': False, 'error': 'Method Not Allowed'}), 405)
    except Exception as e:
        print(f"[ERROR] 프록시 에러: {e}")
        return make_response(jsonify({'success': False, 'error': str(e)}), 500)

if __name__ == '__main__':
    print("=" * 50)
    print("[START] 마비노기 모바일 전투력 조회 서버 시작")
    print("=" * 50)
    print("API 엔드포인트: http://localhost:5000/api/search?name=캐릭터명")
    print("헬스체크: http://localhost:5000/health")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
