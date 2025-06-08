/**
 * Комплексный тест VPBX для диагностики проблемы со звонками
 * Node.js версия с fetch полифиллом
 */

import fetch from 'node-fetch';

const VPBX_BASE_URL = "https://cloudpbx.beeline.kz/VPBX";
const SYSTEM_TOKEN = "8b6728d7-c763-4074-821a-6f2336d93cb8";
const LOGIN = "slavakhan100";
const PASSWORD = "i4yc448p";

// Тестовые номера
const INTERNAL_NUMBER = "101"; // Внутренний номер VPBX (2-4 цифры)
const EXTERNAL_NUMBER = "+996555123456"; // Внешний номер

console.log("🔍 НАЧИНАЕМ ПОДРОБНУЮ ДИАГНОСТИКУ VPBX");
console.log("=".repeat(50));

async function step1_testDirectAuth() {
    console.log("\n📍 ЭТАП 1: Прямая аутентификация в VPBX");
    
    try {
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

        console.log(`📊 Статус ответа: ${response.status} ${response.statusText}`);
        console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);

        const responseText = await response.text();
        console.log(`📊 Размер ответа: ${responseText.length} символов`);
        
        if (responseText.startsWith('{')) {
            const data = JSON.parse(responseText);
            console.log("✅ Получен JSON ответ:");
            console.log({
                hasAccessToken: !!data.AccessToken,
                hasRefreshToken: !!data.RefreshToken,
                expiresIn: data.ExpiresIn,
                tokenPreview: data.AccessToken ? data.AccessToken.substring(0, 20) + '...' : 'N/A'
            });
            return data;
        } else {
            console.log("❌ Получен HTML ответ вместо JSON:");
            console.log(responseText.substring(0, 200) + '...');
            return null;
        }
    } catch (error) {
        console.error("❌ Ошибка аутентификации:", error.message);
        return null;
    }
}

async function step3_testDirectCall(accessToken) {
    console.log("\n📍 ЭТАП 3: Прямой вызов MakeCall2 к VPBX");
    
    if (!accessToken) {
        console.log("❌ Пропускаем - нет токена доступа");
        return null;
    }

    try {
        const url = new URL(`${VPBX_BASE_URL}/Api/MakeCall2`);
        url.searchParams.set("abonentNumber", INTERNAL_NUMBER);
        url.searchParams.set("number", EXTERNAL_NUMBER);

        console.log(`📞 Вызываем: ${INTERNAL_NUMBER} → ${EXTERNAL_NUMBER}`);
        console.log(`🔗 URL: ${url.toString()}`);

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Authorization": accessToken,
                "Content-Type": "application/json",
            },
        });

        console.log(`📊 Статус ответа: ${response.status} ${response.statusText}`);
        console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);

        const responseText = await response.text();
        console.log(`📊 Размер ответа: ${responseText.length} символов`);
        
        if (responseText.startsWith('{')) {
            const data = JSON.parse(responseText);
            console.log("✅ Получен JSON ответ:");
            console.log(data);
        } else {
            console.log("❌ Получен не-JSON ответ:");
            if (responseText.includes('VPBX Вход в систему')) {
                console.log("🚨 ПРОБЛЕМА: VPBX требует аутентификации!");
                console.log("Это означает, что токен недействителен или неправильно передается");
            }
            console.log(responseText.substring(0, 300) + '...');
        }
        
        return responseText;
    } catch (error) {
        console.error("❌ Ошибка прямого вызова:", error.message);
        return null;
    }
}

async function step5_testTokenHeaders() {
    console.log("\n📍 ЭТАП 5: Тестирование различных форматов заголовков");
    
    const authData = await step1_testDirectAuth();
    if (!authData?.AccessToken) {
        console.log("❌ Пропускаем - нет токена");
        return;
    }

    const token = authData.AccessToken;
    const testCases = [
        { name: "Без Bearer", header: token },
        { name: "С Bearer", header: `Bearer ${token}` },
        { name: "Заголовок X-VPBX-TOKEN", headers: { "X-VPBX-TOKEN": token } },
        { name: "Заголовок X-VPBX-API-AUTH-TOKEN", headers: { "X-VPBX-API-AUTH-TOKEN": token } },
    ];

    for (const testCase of testCases) {
        console.log(`\n🧪 Тестируем: ${testCase.name}`);
        
        try {
            const url = new URL(`${VPBX_BASE_URL}/Api/MakeCall2`);
            url.searchParams.set("abonentNumber", INTERNAL_NUMBER);
            url.searchParams.set("number", EXTERNAL_NUMBER);

            const headers = { "Content-Type": "application/json" };
            
            if (testCase.header) {
                headers["Authorization"] = testCase.header;
            }
            
            if (testCase.headers) {
                Object.assign(headers, testCase.headers);
            }

            const response = await fetch(url.toString(), {
                method: "POST",
                headers,
            });

            const responseText = await response.text();
            const isAuth = responseText.includes('VPBX Вход в систему');
            
            console.log(`   📊 Статус: ${response.status}`);
            console.log(`   📊 Требует аутентификации: ${isAuth ? 'ДА' : 'НЕТ'}`);
            
            if (!isAuth && responseText.startsWith('{')) {
                console.log("   ✅ Успешный JSON ответ!");
                console.log("   📞 Этот формат заголовка работает!");
                const data = JSON.parse(responseText);
                console.log("   📄 Ответ:", data);
            }
        } catch (error) {
            console.log(`   ❌ Ошибка: ${error.message}`);
        }
    }
}

async function runDiagnostic() {
    console.log("🚀 ЗАПУСК ДИАГНОСТИКИ VPBX");
    
    // Этап 1: Прямая аутентификация
    const authData = await step1_testDirectAuth();
    
    // Этап 3: Прямой вызов с полученным токеном
    const directToken = authData?.AccessToken;
    await step3_testDirectCall(directToken);
    
    // Этап 5: Тестирование заголовков
    await step5_testTokenHeaders();
    
    console.log("\n🏁 ДИАГНОСТИКА ЗАВЕРШЕНА");
    console.log("=".repeat(50));
}

// Запуск диагностики
runDiagnostic().catch(console.error);
