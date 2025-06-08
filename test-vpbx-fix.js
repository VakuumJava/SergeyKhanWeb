/**
 * Исправление проблемы со звонками VPBX
 * Тестируем правильные методы и форматы
 */

const VPBX_BASE_URL = "https://cloudpbx.beeline.kz/VPBX";
const SYSTEM_TOKEN = "8b6728d7-c763-4074-821a-6f2336d93cb8";
const LOGIN = "slavakhan100";
const PASSWORD = "i4yc448p";

// Тестовые номера
const INTERNAL_NUMBER = "101";
const EXTERNAL_NUMBER = "+996555123456";

console.log("🔧 ИСПРАВЛЯЕМ VPBX ЗВОНКИ");
console.log("=".repeat(50));

async function getToken() {
    console.log("📍 Получаем токен доступа...");
    
    const formData = new URLSearchParams();
    formData.append("login", LOGIN);
    formData.append("password", PASSWORD);

    const response = await fetch(`${VPBX_BASE_URL}/Account/GetToken`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "X-VPBX-API-AUTH-TOKEN": SYSTEM_TOKEN,
        },
        body: formData.toString(),
    });

    const data = await response.json();
    console.log("✅ Токен получен:", data.AccessToken.substring(0, 20) + '...');
    return data.AccessToken;
}

async function testGetMethod(token) {
    console.log("\n📍 Тестируем GET метод...");
    
    const url = new URL(`${VPBX_BASE_URL}/Api/MakeCall2`);
    url.searchParams.set("abonentNumber", INTERNAL_NUMBER);
    url.searchParams.set("number", EXTERNAL_NUMBER);
    url.searchParams.set("token", token); // Передаем токен как параметр

    console.log(`🔗 URL: ${url.toString().replace(token, 'TOKEN_HIDDEN')}`);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Accept": "application/json",
        },
    });

    console.log(`📊 Статус: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    const isAuth = responseText.includes('VPBX Вход в систему');
    
    console.log(`📊 Требует аутентификации: ${isAuth ? 'ДА' : 'НЕТ'}`);
    
    if (!isAuth) {
        if (responseText.startsWith('{')) {
            const data = JSON.parse(responseText);
            console.log("✅ Успешный JSON ответ:", data);
            return data;
        } else {
            console.log("❌ Неожиданный ответ:", responseText.substring(0, 200));
        }
    }
    
    return null;
}

async function testPostWithTokenParam(token) {
    console.log("\n📍 Тестируем POST с токеном в параметрах...");
    
    const url = new URL(`${VPBX_BASE_URL}/Api/MakeCall2`);
    url.searchParams.set("token", token);

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        },
        body: new URLSearchParams({
            abonentNumber: INTERNAL_NUMBER,
            number: EXTERNAL_NUMBER,
        }).toString(),
    });

    console.log(`📊 Статус: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    const isAuth = responseText.includes('VPBX Вход в систему');
    
    console.log(`📊 Требует аутентификации: ${isAuth ? 'ДА' : 'НЕТ'}`);
    
    if (!isAuth) {
        if (responseText.startsWith('{')) {
            const data = JSON.parse(responseText);
            console.log("✅ Успешный JSON ответ:", data);
            return data;
        } else {
            console.log("❌ Неожиданный ответ:", responseText.substring(0, 200));
        }
    }
    
    return null;
}

async function testPostWithJsonAndTokenParam(token) {
    console.log("\n📍 Тестируем POST JSON с токеном в параметрах...");
    
    const url = new URL(`${VPBX_BASE_URL}/Api/MakeCall2`);
    url.searchParams.set("token", token);

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify({
            abonentNumber: INTERNAL_NUMBER,
            number: EXTERNAL_NUMBER,
        }),
    });

    console.log(`📊 Статус: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    const isAuth = responseText.includes('VPBX Вход в систему');
    
    console.log(`📊 Требует аутентификации: ${isAuth ? 'ДА' : 'НЕТ'}`);
    
    if (!isAuth) {
        if (responseText.startsWith('{')) {
            const data = JSON.parse(responseText);
            console.log("✅ Успешный JSON ответ:", data);
            return data;
        } else {
            console.log("❌ Неожиданный ответ:", responseText.substring(0, 200));
        }
    }
    
    return null;
}

async function testPostWithCustomHeaders(token) {
    console.log("\n📍 Тестируем POST с кастомными заголовками...");
    
    const url = new URL(`${VPBX_BASE_URL}/Api/MakeCall2`);

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-VPBX-TOKEN": token,
            "X-API-TOKEN": token,
            "Authorization": `Token ${token}`,
        },
        body: JSON.stringify({
            abonentNumber: INTERNAL_NUMBER,
            number: EXTERNAL_NUMBER,
        }),
    });

    console.log(`📊 Статус: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    const isAuth = responseText.includes('VPBX Вход в систему');
    
    console.log(`📊 Требует аутентификации: ${isAuth ? 'ДА' : 'НЕТ'}`);
    
    if (!isAuth) {
        if (responseText.startsWith('{')) {
            const data = JSON.parse(responseText);
            console.log("✅ Успешный JSON ответ:", data);
            return data;
        } else {
            console.log("❌ Неожиданный ответ:", responseText.substring(0, 200));
        }
    }
    
    return null;
}

async function runFix() {
    try {
        const token = await getToken();
        
        // Тестируем разные методы
        let result = null;
        
        result = await testGetMethod(token);
        if (result) {
            console.log("\n🎉 РЕШЕНИЕ НАЙДЕНО: GET метод с токеном в параметрах!");
            return;
        }
        
        result = await testPostWithTokenParam(token);
        if (result) {
            console.log("\n🎉 РЕШЕНИЕ НАЙДЕНО: POST с токеном в параметрах!");
            return;
        }
        
        result = await testPostWithJsonAndTokenParam(token);
        if (result) {
            console.log("\n🎉 РЕШЕНИЕ НАЙДЕНО: POST JSON с токеном в параметрах!");
            return;
        }
        
        result = await testPostWithCustomHeaders(token);
        if (result) {
            console.log("\n🎉 РЕШЕНИЕ НАЙДЕНО: POST с кастомными заголовками!");
            return;
        }
        
        console.log("\n❌ НИ ОДИН МЕТОД НЕ СРАБОТАЛ");
        console.log("Возможно, нужно изучить документацию VPBX более подробно");
        
    } catch (error) {
        console.error("❌ Ошибка:", error.message);
    }
}

runFix().catch(console.error);
