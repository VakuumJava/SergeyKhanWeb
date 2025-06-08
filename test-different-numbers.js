async function testDifferentNumbers() {
  console.log('=== ТЕСТ РАЗЛИЧНЫХ НОМЕРОВ ТЕЛЕФОНОВ ===');
  
  const VPBX_BASE_URL = "https://cloudpbx.beeline.kz/VPBX";
  const VBPX_SYSTEM_TOKEN = "8b6728d7-c763-4074-821a-6f2336d93cb8";
  
  try {
    // 1. Получаем токен
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
    
    // 2. Тестируем разные форматы номеров
    const numberVariants = [
      { abonentNumber: '6770', number: '+996557819199', desc: 'Исходные номера' },
      { abonentNumber: '6770', number: '996557819199', desc: 'Без +' },
      { abonentNumber: '6770', number: '77057819199', desc: 'Казахстанский формат' },
      { abonentNumber: '200', number: '+996557819199', desc: 'Другой внутренний номер' },
      { abonentNumber: '100', number: '+996557819199', desc: 'Еще один внутренний номер' },
      { abonentNumber: '6770', number: '+77057819199', desc: 'Казахстанский внешний' },
      { abonentNumber: '6770', number: '87057819199', desc: 'С кодом 8' },
      { abonentNumber: 'slavakhan100', number: '+996557819199', desc: 'Логин как abonentNumber' }
    ];
    
    for (const variant of numberVariants) {
      console.log(`\nТестируем: ${variant.desc}`);
      console.log(`abonentNumber: ${variant.abonentNumber}, number: ${variant.number}`);
      
      const params = new URLSearchParams({
        abonentNumber: variant.abonentNumber,
        number: variant.number
      });
      
      const response = await fetch(`${VPBX_BASE_URL}/Api/MakeCall2?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-VPBX-API-AUTH-TOKEN': VBPX_SYSTEM_TOKEN
        }
      });
      
      console.log('Status:', response.status);
      const text = await response.text();
      console.log('Response:', text);
      
      if (response.ok) {
        console.log('✅ Успех с этими параметрами!');
        break;
      } else if (text !== 'ERROR') {
        console.log('Получили детальную ошибку:', text);
      }
      
      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('Критическая ошибка:', error);
  }
}

testDifferentNumbers();
