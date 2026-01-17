// ==================== 상수 정의 ====================
const MAX_CHARACTERS = 6;
const API_BASE_URL = 'https://cloistral-jannie-unamusably.ngrok-free.dev';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxtYFfOn9peeviVjz_DrzYwnimBDMbxMlwl91vDHt3ZOKA4aAIddv7MZzmtea43m4B76w/exec'; // Google Apps Script 웹 앱 URL

// ==================== 데이터 구조 ====================
let charactersData = [];
let partiesData = [];
let currentSearchResult = null;
let activeCharacterTabs = {}; // 각 캐릭터의 현재 활성 탭 저장 {characterId: 'daily' | 'weekly'}

// 기본 숙제 템플릿 제거 - 사용자가 직접 추가

// ==================== 초기화 ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadData();
    setupEventListeners();
    renderCharacters();
    renderParties();
}

// ==================== 데이터 로드/저장 ====================
function loadData() {
    // 로컬스토리지에서 캐릭터 데이터 로드
    const savedCharacters = localStorage.getItem('charactersData');
    
    if (savedCharacters) {
        charactersData = JSON.parse(savedCharacters);
    }
    
    // 파티 데이터는 구글 스프레드시트에서 로드
    loadPartiesFromGoogleSheets();
}

function saveCharactersData() {
    localStorage.setItem('charactersData', JSON.stringify(charactersData));
}

// 구글 스프레드시트에서 파티 데이터 로드
async function loadPartiesFromGoogleSheets() {
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        console.warn('Google Apps Script URL이 설정되지 않았습니다.');
        return;
    }

    try {
        const url = `${GOOGLE_SCRIPT_URL}?action=getParties`;
        console.log('파티 목록 로드 요청:', url);
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            partiesData = data.data || [];
            console.log('파티 데이터 로드 성공, 개수:', partiesData.length);
            renderParties();
        } else {
            console.error('파티 데이터 로드 실패:', data.error);
        }
    } catch (error) {
        console.error('파티 데이터 로드 에러:', error);
    }
}

// 구글 스프레드시트에 파티 데이터 저장
async function savePartyToGoogleSheets(partyData) {
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        alert('Google Apps Script URL을 설정해주세요. (script.js 파일 상단)');
        return false;
    }

    try {
        console.log('파티 데이터 전송 중:', partyData);

        const url = `${GOOGLE_SCRIPT_URL}?action=addParty`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(partyData)
        });

        const data = await response.json();
        if (data.success) {
            console.log('파티 등록 성공(프록시 응답):', data);
            return true;
        } else {
            console.error('파티 등록 실패:', data.error);
            alert('파티 등록 실패: ' + (data.error || '알 수 없는 오류'));
            return false;
        }

    } catch (error) {
        console.error('파티 저장 에러:', error);
        alert('파티 등록 중 오류가 발생했습니다: ' + error.message);
        return false;
    }
}

// 구글 스프레드시트에서 파티 데이터 삭제
async function deletePartyFromGoogleSheets(partyId) {
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        alert('Google Apps Script URL을 설정해주세요.');
        return false;
    }

    try {
        console.log('파티 삭제 요청:', partyId);

        const url = `${GOOGLE_SCRIPT_URL}?action=deleteParty`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: partyId })
        });

        const data = await response.json();
        if (data.success) {
            console.log('파티 삭제 성공(프록시 응답):', data);
            return true;
        } else {
            console.error('파티 삭제 실패:', data.error);
            alert('파티 삭제 실패: ' + (data.error || '알 수 없는 오류'));
            return false;
        }

    } catch (error) {
        console.error('파티 삭제 에러:', error);
        alert('파티 삭제 중 오류가 발생했습니다: ' + error.message);
        return false;
    }
}

// ==================== 이벤트 리스너 설정 ====================
function setupEventListeners() {
    // 탭 전환
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });
    
    // 캐릭터 추가 버튼
    document.getElementById('addCharacterBtn').addEventListener('click', openAddCharacterModal);
    
    // 파티 추가 버튼
    document.getElementById('addPartyBtn').addEventListener('click', openAddPartyModal);
    
    // 캐릭터 추가 모달
    document.getElementById('confirmAddCharacter').addEventListener('click', addCharacter);
    document.getElementById('cancelAddCharacter').addEventListener('click', closeAddCharacterModal);
    
    // 파티 추가 모달
    document.getElementById('confirmAddParty').addEventListener('click', addParty);
    document.getElementById('cancelAddParty').addEventListener('click', closeAddPartyModal);
    document.getElementById('searchCharacterBtn').addEventListener('click', openSearchCharacterModal);
    
    // 난이도 선택 시 기타 입력 필드 표시/숨김
    document.getElementById('partyDifficulty').addEventListener('change', (e) => {
        const customInput = document.getElementById('partyDifficultyCustom');
        if (e.target.value === '기타') {
            customInput.style.display = 'block';
        } else {
            customInput.style.display = 'none';
        }
    });
    
    // 콘텐츠 대분류 선택 시 콘텐츠 목록/값 설정
    document.getElementById('partySector').addEventListener('change', (e) => {
        const sector = e.target.value;
        const contentGroup = document.getElementById('contentGroup');
        const contentSelect = document.getElementById('partyContent');

        if (sector === '어비스') {
            // 어비스는 콘텐츠 고정
            contentGroup.style.display = 'none';
            contentSelect.innerHTML = `<option value="어비스">어비스</option>`;
            contentSelect.value = '어비스';
        } else if (sector === '레이드') {
            // 레이드는 4종 중 택1
            contentGroup.style.display = 'block';
            contentSelect.innerHTML = `
                <option value="">선택하세요</option>
                <option value="글라스기브넨">글라스기브넨</option>
                <option value="서큐버스">서큐버스</option>
                <option value="타바르타스">타바르타스</option>
                <option value="에이렐">에이렐</option>
            `;
            contentSelect.value = '';
        } else {
            contentGroup.style.display = 'none';
            contentSelect.innerHTML = `<option value="">선택하세요</option>`;
            contentSelect.value = '';
        }
    });
    
    // 캐릭터 검색 모달
    document.getElementById('executeSearchBtn').addEventListener('click', searchCharacter);
    document.getElementById('cancelSearch').addEventListener('click', closeSearchCharacterModal);
    
    // 모달 닫기 버튼
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });
    
    // 모달 외부 클릭 시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Enter 키로 검색
    document.getElementById('searchCharacterInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchCharacter();
        }
    });
    
    document.getElementById('newCharacterName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCharacter();
        }
    });
    
    // 파티 필터
    document.getElementById('filterSector').addEventListener('change', filterParties);
    document.getElementById('filterContent').addEventListener('change', filterParties);
    document.getElementById('filterDifficulty').addEventListener('change', filterParties);
}

// ==================== 탭 전환 ====================
function switchTab(tabName) {
    // 탭 버튼 활성화
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // 콘텐츠 섹션 표시
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${tabName}-section`).classList.add('active');
}

// ==================== 캐릭터 관리 ====================
function openAddCharacterModal() {
    if (charactersData.length >= MAX_CHARACTERS) {
        alert(`최대 ${MAX_CHARACTERS}개의 캐릭터만 추가할 수 있습니다.`);
        return;
    }
    document.getElementById('newCharacterName').value = '';
    document.getElementById('addCharacterModal').classList.add('active');
}

function closeAddCharacterModal() {
    document.getElementById('addCharacterModal').classList.remove('active');
}

function addCharacter() {
    const nameInput = document.getElementById('newCharacterName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('캐릭터 이름을 입력해주세요.');
        return;
    }
    
    if (charactersData.some(char => char.name === name)) {
        alert('이미 존재하는 캐릭터 이름입니다.');
        return;
    }
    
    const newCharacter = {
        id: Date.now(),
        name: name,
        dailyTasks: [],
        weeklyTasks: []
    };
    
    charactersData.push(newCharacter);
    saveCharactersData();
    renderCharacters();
    closeAddCharacterModal();
}

function deleteCharacter(characterId) {
    if (!confirm('정말로 이 캐릭터를 삭제하시겠습니까?')) {
        return;
    }
    
    charactersData = charactersData.filter(char => char.id !== characterId);
    saveCharactersData();
    renderCharacters();
}

function renderCharacters() {
    const container = document.getElementById('charactersContainer');
    
    if (charactersData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">캐릭터를 추가하여 숙제를 관리하세요</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = charactersData.map(character => {
        // 저장된 탭 상태 확인 (없으면 기본값 'daily')
        const activeTab = activeCharacterTabs[character.id] || 'daily';
        const isDailyActive = activeTab === 'daily';
        const isWeeklyActive = activeTab === 'weekly';
        
        return `
        <div class="character-card">
            <div class="character-header">
                <div class="character-name">${character.name}</div>
                <button class="btn-delete" onclick="deleteCharacter(${character.id})">×</button>
            </div>
            
            <div class="character-tabs">
                <button class="character-tab ${isDailyActive ? 'active' : ''}" onclick="switchCharacterTab(${character.id}, 'daily')">
                    일간 숙제
                </button>
                <button class="character-tab ${isWeeklyActive ? 'active' : ''}" onclick="switchCharacterTab(${character.id}, 'weekly')">
                    주간 숙제
                </button>
            </div>
            
            <div class="tasks-container ${isDailyActive ? 'active' : ''}" id="daily-${character.id}">
                ${renderTasks(character.dailyTasks, character.id, 'daily')}
            </div>
            
            <div class="tasks-container ${isWeeklyActive ? 'active' : ''}" id="weekly-${character.id}">
                ${renderTasks(character.weeklyTasks, character.id, 'weekly')}
            </div>
        </div>
        `;
    }).join('');
}

function renderTasks(tasks, characterId, type) {
    const tasksHtml = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                onchange="toggleTask(${characterId}, '${task.id}', '${type}')"
            >
            <label class="task-label">${task.text}</label>
            <button class="btn-delete-task" onclick="deleteTask(${characterId}, '${task.id}', '${type}')" title="삭제">×</button>
        </div>
    `).join('');
    
    const addButton = `
        <div class="task-add-container">
            <input type="text" class="task-input" id="taskInput-${type}-${characterId}" placeholder="새 숙제 입력...">
            <button class="btn-add-task" onclick="addTask(${characterId}, '${type}')">+ 추가</button>
        </div>
    `;
    
    return tasksHtml + addButton;
}

function switchCharacterTab(characterId, tabType) {
    const card = document.querySelector(`[id^="${tabType}-${characterId}"]`).closest('.character-card');
    
    // 현재 활성 탭 상태 저장
    activeCharacterTabs[characterId] = tabType;
    
    // 탭 버튼 활성화
    card.querySelectorAll('.character-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    card.querySelector(`[onclick*="${tabType}"]`).classList.add('active');
    
    // 콘텐츠 표시
    card.querySelectorAll('.tasks-container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(`${tabType}-${characterId}`).classList.add('active');
}

function toggleTask(characterId, taskId, type) {
    const character = charactersData.find(char => char.id === characterId);
    if (!character) return;
    
    const tasks = type === 'daily' ? character.dailyTasks : character.weeklyTasks;
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        task.completed = !task.completed;
        saveCharactersData();
        renderCharacters();
    }
}

function addTask(characterId, type) {
    const inputId = `taskInput-${type}-${characterId}`;
    const input = document.getElementById(inputId);
    const taskText = input.value.trim();
    
    if (!taskText) {
        alert('숙제 내용을 입력해주세요.');
        return;
    }
    
    const character = charactersData.find(char => char.id === characterId);
    if (!character) return;
    
    const newTask = {
        id: `${type}-${Date.now()}`,
        text: taskText,
        completed: false
    };
    
    if (type === 'daily') {
        character.dailyTasks.push(newTask);
    } else {
        character.weeklyTasks.push(newTask);
    }
    
    saveCharactersData();
    renderCharacters();
}

function deleteTask(characterId, taskId, type) {
    const character = charactersData.find(char => char.id === characterId);
    if (!character) return;
    
    if (type === 'daily') {
        character.dailyTasks = character.dailyTasks.filter(t => t.id !== taskId);
    } else {
        character.weeklyTasks = character.weeklyTasks.filter(t => t.id !== taskId);
    }
    
    saveCharactersData();
    renderCharacters();
}

// ==================== 파티 모집 관리 ====================
function openAddPartyModal() {
    editingPartyId = null; // 수정 모드 해제
    
    // 폼 초기화
    document.getElementById('partySector').value = '';
    document.getElementById('partyContent').value = '';
    document.getElementById('contentGroup').style.display = 'none';
    document.getElementById('partyDifficulty').value = '';
    document.getElementById('partyDifficultyCustom').value = '';
    document.getElementById('partyDifficultyCustom').style.display = 'none';
    
    // 캐릭터 정보 초기화
    document.getElementById('displayCharacterName').textContent = '-';
    document.getElementById('displayClass').textContent = '-';
    document.getElementById('displayPower').textContent = '-';
    currentSearchResult = null;
    
    // 모달 타이틀 복원
    document.querySelector('#addPartyModal .modal-header h2').textContent = '파티 등록';
    document.getElementById('confirmAddParty').textContent = '등록';
    
    document.getElementById('addPartyModal').classList.add('active');
}

function closeAddPartyModal() {
    document.getElementById('addPartyModal').classList.remove('active');
}

let editingPartyId = null; // 현재 수정 중인 파티 ID

function editParty(partyId) {
    const party = partiesData.find(p => p.id === partyId);
    if (!party) return;
    
    editingPartyId = partyId;
    
    // 대분류 설정
    document.getElementById('partySector').value = party.sector;
    
    // 대분류에 따라 콘텐츠 필드 표시
    const contentGroup = document.getElementById('contentGroup');
    const contentSelect = document.getElementById('partyContent');
    
    if (party.sector === '어비스') {
        contentGroup.style.display = 'none';
        contentSelect.innerHTML = `<option value="어비스">어비스</option>`;
        contentSelect.value = '어비스';
    } else if (party.sector === '레이드') {
        contentGroup.style.display = 'block';
        contentSelect.innerHTML = `
            <option value="">선택하세요</option>
            <option value="글라스기브넨">글라스기브넨</option>
            <option value="서큐버스">서큐버스</option>
            <option value="타바르타스">타바르타스</option>
            <option value="에이렐">에이렐</option>
        `;
        contentSelect.value = party.content;
    }
    
    // 난이도 설정
    const standardDifficulties = ['입문', '어려움', '매우 어려움'];
    if (standardDifficulties.includes(party.difficulty)) {
        document.getElementById('partyDifficulty').value = party.difficulty;
        document.getElementById('partyDifficultyCustom').style.display = 'none';
    } else {
        document.getElementById('partyDifficulty').value = '기타';
        document.getElementById('partyDifficultyCustom').value = party.difficulty;
        document.getElementById('partyDifficultyCustom').style.display = 'block';
    }
    
    // 캐릭터 정보 설정
    currentSearchResult = {
        name: party.character,
        class: party.class,
            power: formatPower(party.power)
    };
    
    document.getElementById('displayCharacterName').textContent = party.character;
    document.getElementById('displayClass').textContent = party.class;
        document.getElementById('displayPower').textContent = formatPower(party.power);
    
    // 모달 타이틀 변경
    document.querySelector('#addPartyModal .modal-header h2').textContent = '파티 수정';
    document.getElementById('confirmAddParty').textContent = '수정';
    
    document.getElementById('addPartyModal').classList.add('active');
}

async function addParty() {
    const sector = document.getElementById('partySector').value;
    const content = document.getElementById('partyContent').value;
    const difficulty = document.getElementById('partyDifficulty').value;
    const customDifficulty = document.getElementById('partyDifficultyCustom').value.trim();
    console.log('입력 확인:', { sector, content, difficulty, customDifficulty, currentSearchResult });
    
    if (!sector) {
        alert('콘텐츠 대분류를 선택해주세요.');
        return;
    }
    
    if (sector === '레이드' && !content) {
        alert('콘텐츠를 선택해주세요.');
        return;
    }
    
    const finalContent = sector === '어비스' ? '어비스' : content;
    
    if (!difficulty) {
        alert('난이도를 선택해주세요.');
        return;
    }
    
    if (difficulty === '기타' && !customDifficulty) {
        alert('난이도를 직접 입력해주세요.');
        return;
    }
    
    if (!currentSearchResult) {
        alert('캐릭터 정보를 검색해주세요.');
        return;
    }
    
    const finalDifficulty = difficulty === '기타' ? customDifficulty : difficulty;
    
    const isEditing = editingPartyId !== null;
    
    const partyData = {
        id: isEditing ? editingPartyId : Date.now(),
        sector: sector,
        content: finalContent,
        difficulty: finalDifficulty,
        character: currentSearchResult.name,
        class: currentSearchResult.class,
        power: currentSearchResult.power,
        timestamp: isEditing ? partiesData.find(p => p.id === editingPartyId)?.timestamp : new Date().toISOString()
    };
    
    console.log(isEditing ? '파티 수정 시도:' : '파티 등록 시도:', partyData);
    
    // 버튼 비활성화 및 로딩 표시
    const confirmBtn = document.getElementById('confirmAddParty');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = isEditing ? '수정 중...' : '등록 중...';
    
    try {
        let success = false;
        
        if (isEditing) {
            // 수정: 기존 항목 삭제 후 새로 추가
            await deletePartyFromGoogleSheets(editingPartyId);
            await new Promise(resolve => setTimeout(resolve, 500)); // 삭제 반영 대기
            success = await savePartyToGoogleSheets(partyData);
            console.log('파티 수정 성공');
        } else {
            // 등록
            success = await savePartyToGoogleSheets(partyData);
            console.log('파티 등록 성공');
        }
        
        if (success) {
            closeAddPartyModal();
            editingPartyId = null;
            
            // 모달 타이틀 복원
            document.querySelector('#addPartyModal .modal-header h2').textContent = '파티 등록';
            
            // 약간의 지연 후 목록 새로고침 (Google Sheets 반영 시간 고려)
            setTimeout(async () => {
                await loadPartiesFromGoogleSheets();
            }, 1500);
        }
    } catch (error) {
        console.error(isEditing ? '파티 수정 중 예외 발생:' : '파티 등록 중 예외 발생:', error);
        alert(isEditing ? '파티 수정 중 오류가 발생했습니다.' : '파티 등록 중 오류가 발생했습니다.');
    } finally {
        // 버튼 복원
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

async function deleteParty(partyId) {
    if (!confirm('이 파티 모집을 삭제하시겠습니까?')) {
        return;
    }
    
    console.log('파티 삭제 시도:', partyId);
    
    try {
        // 구글 스프레드시트에서 삭제
        const deleted = await deletePartyFromGoogleSheets(partyId);
        
        if (deleted) {
            console.log('파티 삭제 성공');
            // 약간의 지연 후 목록 새로고침 (Google Sheets 반영 시간 고려)
            setTimeout(async () => {
                await loadPartiesFromGoogleSheets();
            }, 1500);
        }
    } catch (error) {
        console.error('파티 삭제 중 예외 발생:', error);
        alert('파티 삭제 중 오류가 발생했습니다.');
    }
}

function renderParties() {
    const container = document.getElementById('partyList');
    const sectorFilter = document.getElementById('filterSector').value;
    const contentFilter = document.getElementById('filterContent').value;
    const difficultyFilter = document.getElementById('filterDifficulty').value;
    
    let filteredParties = partiesData;
    
    if (sectorFilter) {
        filteredParties = filteredParties.filter(party => party.sector === sectorFilter);
    }
    
    if (contentFilter) {
        filteredParties = filteredParties.filter(party => party.content === contentFilter);
    }
    
    if (difficultyFilter) {
        filteredParties = filteredParties.filter(party => party.difficulty === difficultyFilter);
    }
    
    // 콘텐츠 기준 정렬 (어비스 > 글라스기브넨 > 서큐버스 > 타바르타스 > 에이렐)
    const contentOrder = {'어비스': 1, '글라스기브넨': 2, '서큐버스': 3, '타바르타스': 4, '에이렐': 5};
    filteredParties.sort((a, b) => {
        const orderA = contentOrder[a.content] || 999;
        const orderB = contentOrder[b.content] || 999;
        if (orderA !== orderB) return orderA - orderB;
        // 같은 콘텐츠는 최신 등록순
        return b.id - a.id;
    });
    
    if (filteredParties.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎮</div>
                <div class="empty-state-text">
                    ${partiesData.length === 0 ? '파티를 등록하여 함께 플레이할 동료를 찾으세요' : '필터 조건에 맞는 파티가 없습니다'}
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredParties.map(party => `
        <div class="party-item">
            <div class="party-field">
                <div class="party-field-label">대분류</div>
                <div class="party-field-value">${party.sector}</div>
            </div>
            <div class="party-field">
                <div class="party-field-label">콘텐츠</div>
                <div class="party-field-value">${party.content}</div>
            </div>
            <div class="party-field">
                <div class="party-field-label">난이도</div>
                <div class="party-field-value">${party.difficulty}</div>
            </div>
            <div class="party-field">
                <div class="party-field-label">캐릭터</div>
                <div class="party-field-value">${party.character}</div>
            </div>
            <div class="party-field">
                <div class="party-field-label">클래스</div>
                <div class="party-field-value">${party.class}</div>
            </div>
            <div class="party-field">
                <div class="party-field-label">전투력</div>
                    <div class="party-field-value">${formatPower(party.power)}</div>
            </div>
            <div class="party-actions">
                <button class="btn-edit-party" onclick="editParty(${party.id})" title="수정">✏️</button>
                <button class="btn-delete-party" onclick="deleteParty(${party.id})" title="삭제">🗑️</button>
            </div>
        </div>
    `).join('');
}

function filterParties() {
    renderParties();
}

// ==================== 캐릭터 검색 ====================
function openSearchCharacterModal() {
    document.getElementById('searchCharacterInput').value = '';
    document.getElementById('searchResult').innerHTML = `
        <div class="empty">캐릭터 이름을 입력하고 검색해주세요</div>
    `;
    document.getElementById('searchCharacterModal').classList.add('active');
}

function closeSearchCharacterModal() {
    document.getElementById('searchCharacterModal').classList.remove('active');
}

async function searchCharacter() {
    const input = document.getElementById('searchCharacterInput');
    const characterName = input.value.trim();
    const resultDiv = document.getElementById('searchResult');
    
    if (!characterName) {
        alert('캐릭터 이름을 입력해주세요.');
        return;
    }
    
    // 로딩 표시
    resultDiv.innerHTML = `
        <div class="loading">검색 중...</div>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/search?name=${encodeURIComponent(characterName)}`, {
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        });
        const data = await response.json();
        
        if (data.success) {
            const charData = data.data;
            currentSearchResult = {
                name: charData.name,
                class: charData.class,
                power: charData.power,
                rank: charData.rank,
                server: charData.server
            };
            
            resultDiv.innerHTML = `
                <div class="search-result-content">
                    <div class="result-info">
                        <div class="result-item">
                            <div class="result-item-label">순위</div>
                            <div class="result-item-value">${charData.rank}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-item-label">서버</div>
                            <div class="result-item-value">${charData.server}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-item-label">캐릭터명</div>
                            <div class="result-item-value">${charData.name}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-item-label">클래스</div>
                            <div class="result-item-value">${charData.class}</div>
                        </div>
                        <div class="result-item" style="grid-column: 1 / -1;">
                            <div class="result-item-label">전투력</div>
                            <div class="result-item-value">${formatPower(charData.power)}</div>
                        </div>
                    </div>
                    <button class="btn-primary" onclick="selectSearchResult()">이 캐릭터 선택</button>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="error-message">${data.error}</div>
            `;
            currentSearchResult = null;
        }
    } catch (error) {
        console.error('검색 에러:', error);
        resultDiv.innerHTML = `
            <div class="error-message">
                서버 연결 실패. ngrok이 실행 중인지 확인해주세요.
            </div>
        `;
        currentSearchResult = null;
    }
}

function selectSearchResult() {
    if (!currentSearchResult) return;
    
    // 파티 등록 모달의 캐릭터 정보 업데이트
    document.getElementById('displayCharacterName').textContent = currentSearchResult.name;
    document.getElementById('displayClass').textContent = currentSearchResult.class;
    document.getElementById('displayPower').textContent = currentSearchResult.power;
    
    closeSearchCharacterModal();
}

// ==================== 유틸리티 함수 ====================
function formatPower(value) {
    const digits = String(value || '').replace(/[^0-9]/g, '');
    if (!digits) return value || '';
    return Number(digits).toLocaleString('ko-KR');
}
// 전역 함수로 노출 (HTML onclick에서 사용)
window.deleteCharacter = deleteCharacter;
window.switchCharacterTab = switchCharacterTab;
window.toggleTask = toggleTask;
window.addTask = addTask;
window.deleteTask = deleteTask;
window.editParty = editParty;
window.deleteParty = deleteParty;
window.selectSearchResult = selectSearchResult;
