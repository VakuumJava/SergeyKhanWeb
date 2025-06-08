async function testMakeCall2Methods() {
  console.log('=== ТЕСТ РАЗЛИЧНЫХ МЕТОДОВ MAKECALL2 ===');
  
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
    
    const authData = await authResponse.json();
    const accessToken = authData.AccessToken;
    console.log('Токен получен:', accessToken.substring(0, 20) + '...');
    
    // 2. Пробуем разные HTTP методы для MakeCall2
    const callData = {
      abonentNumber: '6770',
      number: '+996557819199'
    };
    
    console.log('\n2. Тестирование различных методов HTTP:');
    
    // Метод 1: POST с JSON
    console.log('\nМетод 1: POST с JSON body');
    try {
      const response1 = await fetch(`${VPBX_BASE_URL}/Api/MakeCall2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VPBX-API-AUTH-TOKEN': VBPX_SYSTEM_TOKEN,
          'Authorization': accessToken
        },
        body: JSON.stringify(callData)
      });
      console.log('Status:', response1.status);
      const text1 = await response1.text();
      console.log('Response:', text1.substring(0, 100));
    } catch (e) {
      console.log('Ошибка:', e.message);
    }
    
    // Метод 2: POST с form data
    console.log('\nМетод 2: POST с form data');
    try {
      const formData2 = new URLSearchParams();
      formData2.append('abonentNumber', callData.abonentNumber);
      formData2.append('number', callData.number);
      
      const response2 = await fetch(`${VPBX_BASE_URL}/Api/MakeCall2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-VPBX-API-AUTH-TOKEN': VBPX_SYSTEM_TOKEN,
          'Authorization': accessToken
        },
        body: formData2.toString()
      });
      console.log('Status:', response2.status);
      const text2 = await response2.text();
      console.log('Response:', text2.substring(0, 100));
    } catch (e) {
      console.log('Ошибка:', e.message);
    }
    
    // Метод 3: GET с токеном в query параметрах
    console.log('\nМетод 3: GET с токеном в query параметрах');
    try {
      const params3 = new URLSearchParams({
        abonentNumber: callData.abonentNumber,
        number: callData.number,
        access_token: accessToken
      });
      
      const response3 = await fetch(`${VPBX_BASE_URL}/Api/MakeCall2?${params3}`, {
        method: 'GET',
        headers: {
          'X-VPBX-API-AUTH-TOKEN': VBPX_SYSTEM_TOKEN
        }
      });
      console.log('Status:', response3.status);
      const text3 = await response3.text();
      console.log('Response:', text3.substring(0, 100));
    } catch (e) {
      console.log('Ошибка:', e.message);
    }
    
    // Метод 4: GET с токеном в headers как X-Access-Token
    console.log('\nМетод 4: GET с X-Access-Token header');
    try {
      const params4 = new URLSearchParams({
        abonentNumber: callData.abonentNumber,
        number: callData.number
      });
      
      const response4 = await fetch(`${VPBX_BASE_URL}/Api/MakeCall2?${params4}`, {
        method: 'GET',
        headers: {
          'X-VPBX-API-AUTH-TOKEN': VBPX_SYSTEM_TOKEN,
          'X-Access-Token': accessToken
        }
      });
      console.log('Status:', response4.status);
      const text4 = await response4.text();
      console.log('Response:', text4.substring(0, 100));
    } catch (e) {
      console.log('Ошибка:', e.message);
    }
    
  } catch (error) {
    console.error('Критическая ошибка:', error);
  }
}

testMakeCall2Methods();
