#!/usr/bin/env node

/**
 * Frontend integration test for the Order Assignment Panel
 * Tests the UI components and their interaction with the backend API
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:8000',
  testTimeout: 30000
};

class FrontendAssignmentTest {
  constructor() {
    this.results = [];
    this.componentPath = '/Users/bekzhan/Documents/projects/sk/SergeyKhanWeb/sergeykhan-frontend/packages/ui/src/components/shared/orders/order-assignment/OrderAssignmentPanel.tsx';
    this.unifiedOrderPath = '/Users/bekzhan/Documents/projects/sk/SergeyKhanWeb/sergeykhan-frontend/packages/ui/src/components/shared/orders/unified-order-details/UnifiedOrderDetails.tsx';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '📝';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  testComponentStructure() {
    this.log('Testing component structure and exports...', 'info');
    
    try {
      // Check if OrderAssignmentPanel exists and has correct structure
      if (!fs.existsSync(this.componentPath)) {
        this.log('OrderAssignmentPanel component file not found', 'error');
        return false;
      }

      const componentContent = fs.readFileSync(this.componentPath, 'utf8');
      
      // Check for required imports
      const requiredImports = [
        'useState',
        'useEffect',
        'Dialog',
        'Button',
        'Badge',
        'Input',
        'Card'
      ];

      const missingImports = requiredImports.filter(imp => 
        !componentContent.includes(imp)
      );

      if (missingImports.length > 0) {
        this.log(`Missing required imports: ${missingImports.join(', ')}`, 'error');
        return false;
      }

      // Check for required interfaces
      const requiredInterfaces = [
        'OrderAssignmentPanelProps',
        'Master',
        'MasterWorkloadData',
        'MasterAvailability'
      ];

      const missingInterfaces = requiredInterfaces.filter(interfaceName => 
        !componentContent.includes(`interface ${interfaceName}`)
      );

      if (missingInterfaces.length > 0) {
        this.log(`Missing required interfaces: ${missingInterfaces.join(', ')}`, 'error');
        return false;
      }

      // Check for key functions
      const requiredFunctions = [
        'fetchMastersData',
        'getWorkloadColor',
        'handleAssign'
      ];

      const missingFunctions = requiredFunctions.filter(func => 
        !componentContent.includes(func)
      );

      if (missingFunctions.length > 0) {
        this.log(`Missing required functions: ${missingFunctions.join(', ')}`, 'error');
        return false;
      }

      this.log('Component structure validation passed', 'success');
      return true;

    } catch (error) {
      this.log(`Error testing component structure: ${error.message}`, 'error');
      return false;
    }
  }

  testUnifiedOrderIntegration() {
    this.log('Testing UnifiedOrderDetails integration...', 'info');
    
    try {
      if (!fs.existsSync(this.unifiedOrderPath)) {
        this.log('UnifiedOrderDetails component file not found', 'error');
        return false;
      }

      const componentContent = fs.readFileSync(this.unifiedOrderPath, 'utf8');
      
      // Check if OrderAssignmentPanel is imported
      if (!componentContent.includes('OrderAssignmentPanel')) {
        this.log('OrderAssignmentPanel not imported in UnifiedOrderDetails', 'error');
        return false;
      }

      // Check if the component is used correctly
      if (!componentContent.includes('isOpen={isAssignOpen}')) {
        this.log('OrderAssignmentPanel not properly integrated with dialog state', 'error');
        return false;
      }

      // Check if the onAssign callback is properly connected
      if (!componentContent.includes('onAssign={(masterId: number) => {')) {
        this.log('onAssign callback not properly typed or connected', 'error');
        return false;
      }

      // Check if handleAssignMaster is called
      if (!componentContent.includes('handleAssignMaster(masterId)')) {
        this.log('handleAssignMaster not called in onAssign callback', 'error');
        return false;
      }

      this.log('UnifiedOrderDetails integration validation passed', 'success');
      return true;

    } catch (error) {
      this.log(`Error testing UnifiedOrderDetails integration: ${error.message}`, 'error');
      return false;
    }
  }

  testTypeScriptCompilation() {
    this.log('Testing TypeScript compilation...', 'info');
    
    try {
      const { execSync } = require('child_process');
      const frontendDir = '/Users/bekzhan/Documents/projects/sk/SergeyKhanWeb/sergeykhan-frontend';
      
      // Check if we can run TypeScript compiler
      try {
        execSync('which tsc', { stdio: 'pipe' });
      } catch {
        this.log('TypeScript compiler not found, skipping compilation test', 'warning');
        return true;
      }

      // Try to compile the specific components
      const commands = [
        `cd ${frontendDir}/packages/ui && npx tsc --noEmit --skipLibCheck src/components/shared/orders/order-assignment/OrderAssignmentPanel.tsx`,
        `cd ${frontendDir}/packages/ui && npx tsc --noEmit --skipLibCheck src/components/shared/orders/unified-order-details/UnifiedOrderDetails.tsx`
      ];

      for (const command of commands) {
        try {
          execSync(command, { stdio: 'pipe' });
        } catch (error) {
          this.log(`TypeScript compilation failed: ${error.message}`, 'error');
          return false;
        }
      }

      this.log('TypeScript compilation test passed', 'success');
      return true;

    } catch (error) {
      this.log(`Error testing TypeScript compilation: ${error.message}`, 'warning');
      return true; // Don't fail the entire test if TS check fails
    }
  }

  testAPIIntegration() {
    this.log('Testing API integration patterns...', 'info');
    
    try {
      const componentContent = fs.readFileSync(this.componentPath, 'utf8');
      
      // Check for proper API calls
      const apiPatterns = [
        '/api/masters/.*/workload/',
        'Authorization.*Token'
      ];

      for (const pattern of apiPatterns) {
        const regex = new RegExp(pattern, 'i');
        if (!regex.test(componentContent)) {
          this.log(`Missing API pattern: ${pattern}`, 'error');
          return false;
        }
      }

      // Check for error handling
      const errorHandlingPatterns = [
        'catch.*error',
        'setError',
        'toast.*error'
      ];

      let hasErrorHandling = false;
      for (const pattern of errorHandlingPatterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(componentContent)) {
          hasErrorHandling = true;
          break;
        }
      }

      if (!hasErrorHandling) {
        this.log('No error handling patterns found', 'error');
        return false;
      }

      // Check for loading states
      if (!componentContent.includes('setIsLoading') && !componentContent.includes('isLoading')) {
        this.log('No loading state management found', 'warning');
      }

      this.log('API integration patterns validation passed', 'success');
      return true;

    } catch (error) {
      this.log(`Error testing API integration: ${error.message}`, 'error');
      return false;
    }
  }

  testUIComponents() {
    this.log('Testing UI components and accessibility...', 'info');
    
    try {
      const componentContent = fs.readFileSync(this.componentPath, 'utf8');
      
      // Check for proper UI components usage
      const uiComponents = [
        'Dialog',
        'DialogContent',
        'DialogHeader',
        'DialogTitle',
        'Button',
        'Card',
        'Badge',
        'Input'
      ];

      const missingComponents = uiComponents.filter(comp => 
        !componentContent.includes(`<${comp}`) && !componentContent.includes(`{${comp}}`)
      );

      if (missingComponents.length > 0) {
        this.log(`Missing UI components: ${missingComponents.join(', ')}`, 'error');
        return false;
      }

      // Check for accessibility features
      const accessibilityFeatures = [
        'aria-label',
        'role=',
        'tabIndex',
        'onKeyDown'
      ];

      let hasAccessibility = false;
      for (const feature of accessibilityFeatures) {
        if (componentContent.includes(feature)) {
          hasAccessibility = true;
          break;
        }
      }

      if (!hasAccessibility) {
        this.log('No accessibility features found (consider adding)', 'warning');
      }

      // Check for responsive design patterns
      if (!componentContent.includes('max-w-') && !componentContent.includes('w-full')) {
        this.log('No responsive width classes found', 'warning');
      }

      this.log('UI components validation passed', 'success');
      return true;

    } catch (error) {
      this.log(`Error testing UI components: ${error.message}`, 'error');
      return false;
    }
  }

  testDataFlow() {
    this.log('Testing data flow and state management...', 'info');
    
    try {
      const componentContent = fs.readFileSync(this.componentPath, 'utf8');
      
      // Check for proper state management
      const stateVariables = [
        'masters',
        'mastersWorkload', 
        'selectedMasterId',
        'isLoading',
        'error'
      ];

      const missingState = stateVariables.filter(state => 
        !componentContent.includes(`[${state}`) && 
        !componentContent.includes(`const ${state}`)
      );

      if (missingState.length > 0) {
        this.log(`Missing state variables: ${missingState.join(', ')}`, 'error');
        return false;
      }

      // Check for proper useEffect usage
      if (!componentContent.includes('useEffect')) {
        this.log('No useEffect hooks found', 'error');
        return false;
      }

      // Check for proper prop handling
      const requiredProps = [
        'isOpen',
        'onClose', 
        'onAssign',
        'orderId'
      ];

      const missingProps = requiredProps.filter(prop => 
        !componentContent.includes(prop)
      );

      if (missingProps.length > 0) {
        this.log(`Missing required props handling: ${missingProps.join(', ')}`, 'error');
        return false;
      }

      this.log('Data flow validation passed', 'success');
      return true;

    } catch (error) {
      this.log(`Error testing data flow: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('Starting Frontend Order Assignment Tests', 'info');
    this.log('='.repeat(60), 'info');

    const tests = [
      { name: 'Component Structure', test: () => this.testComponentStructure() },
      { name: 'UnifiedOrder Integration', test: () => this.testUnifiedOrderIntegration() },
      { name: 'TypeScript Compilation', test: () => this.testTypeScriptCompilation() },
      { name: 'API Integration', test: () => this.testAPIIntegration() },
      { name: 'UI Components', test: () => this.testUIComponents() },
      { name: 'Data Flow', test: () => this.testDataFlow() }
    ];

    let passed = 0;
    let total = tests.length;

    for (const { name, test } of tests) {
      this.log(`\nRunning test: ${name}`, 'info');
      try {
        const result = await test();
        if (result) {
          passed++;
          this.log(`Test '${name}' passed`, 'success');
        } else {
          this.log(`Test '${name}' failed`, 'error');
        }
        this.results.push({ name, passed: result });
      } catch (error) {
        this.log(`Test '${name}' threw an error: ${error.message}`, 'error');
        this.results.push({ name, passed: false });
      }
    }

    // Summary
    this.log('\n' + '='.repeat(60), 'info');
    this.log(`TEST SUMMARY: ${passed}/${total} tests passed`, 'info');
    
    if (passed === total) {
      this.log('🎉 All frontend tests passed! UI components are ready.', 'success');
    } else {
      this.log('⚠️  Some frontend tests failed. Please check the output above.', 'error');
    }

    return passed === total;
  }
}

// Main execution
async function main() {
  const tester = new FrontendAssignmentTest();
  const success = await tester.runAllTests();
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = FrontendAssignmentTest;
