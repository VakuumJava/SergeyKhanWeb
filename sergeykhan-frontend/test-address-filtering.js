/**
 * Test script for address filtering functionality (JavaScript version)
 */

// Recreate the utility functions for testing
function filterAddressForMaster(address) {
  if (!address) {
    return 'Не указан';
  }

  // Удаляем информацию о квартире и подъезде
  let filteredAddress = address
    // Убираем квартиру (кв., квартира, apt., apartment)
    .replace(/,?\s*(кв\.?\s*\d+|квартира\s*\d+|apt\.?\s*\d+|apartment\s*\d+)/gi, '')
    // Убираем подъезд (подъезд, подъ., под, entrance, ent.)
    .replace(/,?\s*(подъезд\s*\d+|подъ\.?\s*\d+|под\s+\d+|entrance\s*\d+|ent\.?\s*\d+)/gi, '')
    // Убираем этаж (этаж, эт., floor, fl.)
    .replace(/,?\s*(этаж\s*\d+|эт\.?\s*\d+|floor\s*\d+|fl\.?\s*\d+)/gi, '')
    // Убираем лишние запятые и пробелы
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/, '')
    .replace(/^\s*,/, '')
    .trim();

  return filteredAddress || 'Не указан';
}

function addressContainsPrivateInfo(address) {
  if (!address) {
    return false;
  }

  const privateInfoRegex = /(кв\.?\s*\d+|квартира\s*\d+|подъезд\s*\d+|подъ\.?\s*\d+|под\s+\d+|apt\.?\s*\d+|apartment\s*\d+|entrance\s*\d+|ent\.?\s*\d+)/gi;
  return privateInfoRegex.test(address);
}

// Test data
const testCases = [
    {
        original: "ул. Чуй 123, кв. 45, подъезд 2",
        expectedFiltered: "ул. Чуй 123",
        expectedHasPrivateInfo: true,
        description: "Test order #69 address with apartment and entrance"
    },
    {
        original: "улица Абая 456, квартира 789",
        expectedFiltered: "улица Абая 456",
        expectedHasPrivateInfo: true,
        description: "Address with full 'квартира' word"
    },
    {
        original: "пр. Аль-Фараби 100",
        expectedFiltered: "пр. Аль-Фараби 100",
        expectedHasPrivateInfo: false,
        description: "Simple address without private info"
    },
    {
        original: "ул. Толе би 50, кв 25, под 3",
        expectedFiltered: "ул. Толе би 50",
        expectedHasPrivateInfo: true,
        description: "Address with abbreviated apartment and entrance"
    },
    {
        original: "",
        expectedFiltered: "Не указан",
        expectedHasPrivateInfo: false,
        description: "Empty address"
    },
    {
        original: null,
        expectedFiltered: "Не указан",
        expectedHasPrivateInfo: false,
        description: "Null address"
    }
];

console.log("=== Testing Address Filtering for Masters ===\n");

let passedTests = 0;
let totalTests = testCases.length * 2;

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`  Original: "${testCase.original}"`);
    
    // Test filterAddressForMaster
    const filtered = filterAddressForMaster(testCase.original);
    const filterPassed = filtered === testCase.expectedFiltered;
    console.log(`  Filtered: "${filtered}" ${filterPassed ? '✅' : '❌'}`);
    console.log(`  Expected: "${testCase.expectedFiltered}"`);
    
    // Test addressContainsPrivateInfo
    const hasPrivateInfo = addressContainsPrivateInfo(testCase.original);
    const privatePassed = hasPrivateInfo === testCase.expectedHasPrivateInfo;
    console.log(`  Has private info: ${hasPrivateInfo} ${privatePassed ? '✅' : '❌'}`);
    console.log(`  Expected: ${testCase.expectedHasPrivateInfo}`);
    
    if (filterPassed) passedTests++;
    if (privatePassed) passedTests++;
    
    console.log("");
});

console.log(`=== Test Results: ${passedTests}/${totalTests} tests passed ===`);

if (passedTests === totalTests) {
    console.log("🎉 All tests passed! Address filtering is working correctly.");
} else {
    console.log("❌ Some tests failed. Please check the implementation.");
}
