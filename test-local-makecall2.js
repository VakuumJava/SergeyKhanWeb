async function testLocalMakeCall2() {
  console.log('=== ТЕСТ ЛОКАЛЬНОГО API MAKECALL2 ===');
  
  try {
    // 1. Получаем токен через локальный API
    console.log('1. Получение токена через локальный API...');
    
    const authResponse = await fetch('http://localhost:3003/api/vpbx/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: 'slavakhan100',
        password: 'i4yc448p'
      })
    });
    
    console.log('Auth Status:', authResponse.status);
    const authData = await authResponse.json();
    console.log('Auth Response:', authData);
    
    if (!authResponse.ok || !authData.access_token) {
      throw new Error('Не удалось получить токен через локальный API');
    }
    
    const accessToken = authData.access_token;
    console.log('Токен получен:', accessToken.substring(0, 20) + '...');
    
    // 2. Тестируем MakeCall2 через локальный API
    console.log('\n2. Тестирование MakeCall2 через локальный API...');
    
    const phoneTests = [
      { abonentNumber: '6770', number: '+996557819199', desc: 'Внутренний 6770 -> Внешний +996557819199' },
      { abonentNumber: '6770', number: '+77057777777', desc: 'Внутренний 6770 -> Казахстанский номер' }
    ];
    
    for (const phoneTest of phoneTests) {
      console.log(`\n--- Тест: ${phoneTest.desc} ---`);
      
      const callParams = new URLSearchParams({
        abonentNumber: phoneTest.abonentNumber,
        number: phoneTest.number
      });
      
      const callUrl = `http://localhost:3003/api/vpbx/MakeCall2?${callParams}`;
      console.log('Call URL:', callUrl);
      
      const callResponse = await fetch(callUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status:', callResponse.status);
      const callData = await callResponse.text();
      console.log('Response (первые 200 символов):', callData.substring(0, 200));
      
      if (callResponse.ok) {
        console.log('✅ Успешный звонок через локальный API!');
        break;
      } else {
        console.log('❌ Ошибка:', callResponse.status);
        if (callResponse.status === 500) {
          console.log('Проверьте логи сервера для деталей');
        }
      }
    }
    
  } catch (error) {
    console.error('Ошибка при тестировании локального API:', error);
  }
}

testLocalMakeCall2();
