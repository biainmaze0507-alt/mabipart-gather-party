// ==================== Google Apps Script for 파티 모집 시스템 ====================
// 이 코드를 Google Apps Script 에디터에 붙여넣고 웹 앱으로 배포하세요.
// 배포 시 "누구나" 액세스 가능하도록 설정해야 합니다.

// 스프레드시트 ID (URL에서 확인 가능)
// https://docs.google.com/spreadsheets/d/[여기가_스프레드시트_ID]/edit
const SPREADSHEET_ID = '168WN6D3EC91WijJW7XiecoUqmHSuVThO6RVgmR4Y2zg'; // 여기에 실제 스프레드시트 ID를 입력하세요
const SHEET_NAME = '파티모집'; // 시트 이름

// ==================== 메인 함수 ====================
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getParties') {
      return getParties();
    } else if (action === 'test') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Google Apps Script is working!'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const action = e.parameter.action;
    const data = JSON.parse(e.postData.contents);
    
    if (action === 'addParty') {
      return addParty(data);
    } else if (action === 'deleteParty') {
      return deleteParty(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== 파티 목록 조회 ====================
function getParties() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // 시트가 없으면 생성
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // 헤더 추가 (대분류와 콘텐츠를 분리)
      sheet.appendRow(['ID', '대분류', '콘텐츠', '난이도', '캐릭터', '클래스', '전투력', '등록일시']);
      sheet.getRange('A1:G1').setFontWeight('bold').setBackground('#f0f0f0');
      sheet.setFrozenRows(1);
    }
    
    const data = sheet.getDataRange().getValues();
    
    // 헤더 제외하고 데이터만 가져오기
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const parties = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // 열 구성: [ID, 대분류, 콘텐츠, 난이도, 캐릭터, 클래스, 전투력, 등록일시]
      parties.push({
        id: row[0],
        sector: row[1],
        content: row[2],
        difficulty: row[3],
        character: row[4],
        class: row[5],
        power: row[6],
        timestamp: row[7]
      });
    }
    
    // 최신순 정렬 (ID 기준 내림차순)
    parties.sort((a, b) => b.id - a.id);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: parties
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== 파티 추가 ====================
function addParty(partyData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // 시트가 없으면 생성
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['ID', '대분류', '콘텐츠', '난이도', '캐릭터', '클래스', '전투력', '등록일시']);
      sheet.getRange('A1:H1').setFontWeight('bold').setBackground('#f0f0f0');
      sheet.setFrozenRows(1);
    }
    
    // 새 파티 추가 (2번째 행에 삽입하여 최신 항목이 위에 오도록)
    sheet.insertRowAfter(1);
    sheet.getRange(2, 1, 1, 8).setValues([[
      partyData.id,
      partyData.sector,
      partyData.content,
      partyData.difficulty,
      partyData.character,
      partyData.class,
      partyData.power,
      partyData.timestamp
    ]]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '파티가 등록되었습니다.'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== 파티 삭제 ====================
function deleteParty(data) {
  try {
    const partyId = data.id;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: '시트를 찾을 수 없습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // ID가 일치하는 행 찾기
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] == partyId) {
        sheet.deleteRow(i + 1);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: '파티가 삭제되었습니다.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: '해당 파티를 찾을 수 없습니다.'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== 유틸리티 함수 ====================
// 시트 초기화 (개발/테스트용)
function initializeSheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // 기존 시트가 있으면 삭제
    if (sheet) {
      ss.deleteSheet(sheet);
    }
    
    // 새 시트 생성
    sheet = ss.insertSheet(SHEET_NAME);
    
    // 헤더 설정
    sheet.appendRow(['ID', '대분류', '콘텐츠', '난이도', '캐릭터', '클래스', '전투력', '등록일시']);
    
    // 헤더 스타일링
    const headerRange = sheet.getRange('A1:H1');
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    headerRange.setHorizontalAlignment('center');
    
    // 열 너비 조정
    sheet.setColumnWidth(1, 120); // ID
    sheet.setColumnWidth(2, 140); // 대분류
    sheet.setColumnWidth(3, 180); // 콘텐츠
    sheet.setColumnWidth(4, 120); // 난이도
    sheet.setColumnWidth(5, 140); // 캐릭터
    sheet.setColumnWidth(6, 120); // 클래스
    sheet.setColumnWidth(7, 120); // 전투력
    sheet.setColumnWidth(8, 180); // 등록일시
    
    // 첫 행 고정
    sheet.setFrozenRows(1);
    
    Logger.log('시트 초기화 완료!');
    return '시트 초기화 완료!';
    
  } catch (error) {
    Logger.log('에러: ' + error.toString());
    return '에러: ' + error.toString();
  }
}

// 테스트 데이터 추가 (개발/테스트용)
function addTestData() {
  const testParties = [
    {
      id: Date.now(),
      sector: '레이드',
      content: '글라스기브넨',
      difficulty: '매우 어려움',
      character: '테스트캐릭터1',
      class: '워리어',
      power: '50000',
      timestamp: new Date().toISOString()
    },
    {
      id: Date.now() + 1,
      sector: '레이드',
      content: '서큐버스',
      difficulty: '어려움',
      character: '테스트캐릭터2',
      class: '메이지',
      power: '45000',
      timestamp: new Date().toISOString()
    }
  ];
  
  testParties.forEach(party => {
    addParty(party);
  });
  
  Logger.log('테스트 데이터 추가 완료!');
}
