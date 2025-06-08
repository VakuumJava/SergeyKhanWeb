async function testBeelineDirectly() {
  console.log('=== ПРЯМОЙ ТЕСТ API BEELINE ===');
  
  const VPBX_BASE_URL = "https://cloudpbx.beeline.kz/VPBX";
  const VBPX_SYSTEM_TOKEN = "8b6728d7-c763-4074-821a-6f2336d93cb8";
  
  try {
    // 1. Получаем токен
    console.log('1. Получение токена...');
    
    const formData = new URLSearchParams();
    formData.append("login", "slavakhan100");
    formData.append("password", "i4yc448p");
    
    const authResponse = await fetch(`${VPBX_BASE_URL}/Account/GetToken`, {
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-VPBX-API-AUTH-TOKEN": VBPX_SYSTEM_TOKEN,
      },
      body: formData.toString()
    });
    
    console.log('Auth Status:', authResponse.status);
    console.log('Auth Headers:', Object.fromEntries(authResponse.headers));
    
    let authData;
    const authText = await authResponse.text();
    console.log('Auth Raw Response:', authText);
    
    try {
      authData = JSON.parse(authText);
    } catch (parseError) {
      console.error('Не удалось распарсить JSON ответ:', parseError);
      console.log('Возможно, это HTML страница с ошибкой');
      return;
    }
    
    console.log('Auth Response:', authData);
    
    if (!authResponse.ok || !authData.AccessToken) {
      throw new Error('Не удалось получить токен: ' + JSON.stringify(authData));
    }
    
    const accessToken = authData.AccessToken;
    console.log('Токен получен:', accessToken.substring(0, 20) + '...');
    
    // 2. Тестируем MakeCall2 с правильными номерами
    console.log('\n2. Тестирование MakeCall2...');
    
    // Пробуем разные варианты номеров
    const phoneTests = [
      { abonentNumber: '6770', number: '+996557819199', desc: 'Внутренний 6770 -> Внешний +996557819199' },
      { abonentNumber: '+77055356770', number: '+996557819199', desc: 'Полный +77055356770 -> Внешний +996557819199' },
      { abonentNumber: '6770', number: '996557819199', desc: 'Внутренний 6770 -> Внешний без +' },
      { abonentNumber: '6770', number: '+77057777777', desc: 'Внутренний 6770 -> Другой внешний номер' }
    ];
    
    for (const phoneTest of phoneTests) {
      console.log(`\n--- Тест: ${phoneTest.desc} ---`);
      
      const callParams = new URLSearchParams({
        abonentNumber: phoneTest.abonentNumber,
        number: phoneTest.number
      });
    
      const callUrl = `${VPBX_BASE_URL}/Api/MakeCall2?${callParams}`;
      console.log('Call URL:', callUrl);
      
      // Используем самый рабочий вариант авторизации (вариант 2 из предыдущего теста)
      const callResponse = await fetch(callUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${accessToken}` // без Bearer
        }
      });
      
      console.log('Status:', callResponse.status);
      const callData = await callResponse.text();
      console.log('Response:', callData.substring(0, 300));
      
      if (callResponse.ok) {
        console.log('✅ Успешный звонок!');
        break;
      } else if (callResponse.status === 500 && callData === 'ERROR') {
        console.log('❌ 500 ERROR - возможно проблема с номерами');
      } else {
        console.log('❌ Другая ошибка');
      }
    }
    
  } catch (error) {
    console.error('Ошибка при прямом тестировании:', error);
  }
}

testBeelineDirectly();
