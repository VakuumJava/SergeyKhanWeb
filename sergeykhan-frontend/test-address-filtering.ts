/**
 * Test script for address filtering functionality
 */

// Import the utility functions
import { filterAddressForMaster, addressContainsPrivateInfo } from '../packages/ui/src/components/shared/utils/addressUtils';

// Test data based on our actual order and common address formats
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
        original: "микрорайон Самал 2, дом 10, квартира 33",
        expectedFiltered: "микрорайон Самал 2, дом 10",
        expectedHasPrivateInfo: true,
        description: "Microdistrict address with apartment"
    },
    {
        original: "проспект Достык 240, подъезд 5",
        expectedFiltered: "проспект Достык 240",
        expectedHasPrivateInfo: true,
        description: "Address with only entrance info"
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
let totalTests = testCases.length * 2; // Each test case has 2 assertions

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
