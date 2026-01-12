/**
 * Frontend Test Runner with Report Generation
 * 
 * Usage:
 *   cd "E:\pharmacy-system - Final Version\frontend"
 *   node src/run_tests_with_report.js
 * 
 * Output: test_report.txt in frontend folder
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('='.repeat(70));
  console.log('         PHARMACARE FRONTEND TEST SUITE - RUNNING TESTS');
  console.log('='.repeat(70));
  console.log(`Date: ${new Date().toLocaleString()}`);
  console.log('-'.repeat(70));

  let output = '';
  let exitCode = 0;

  try {
    // Run tests with JSON reporter
    output = execSync('npm test -- --watchAll=false --verbose 2>&1', {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe'
    });
  } catch (error) {
    output = error.stdout || error.message;
    exitCode = error.status || 1;
  }

  // Generate report
  const report = generateReport(output, exitCode);

  // Save report
  const reportPath = path.join(process.cwd(), 'test_report.txt');
  fs.writeFileSync(reportPath, report, 'utf8');

  // Print report
  console.log(report);
  console.log(`\nReport saved to: ${reportPath}`);

  return exitCode;
}

function generateReport(output, exitCode) {
  const lines = output.split('\n');
  
  // Parse test results
  const tests = [];
  const suites = [];
  let currentSuite = null;

  for (const line of lines) {
    // Detect test suite: "PASS src/__tests__/Login.test.js" or "FAIL ..."
    if (line.includes('PASS') && line.includes('.test.js')) {
      const match = line.match(/(PASS|FAIL)\s+(.+\.test\.js)/);
      if (match) {
        suites.push({ name: match[2], status: match[1] });
      }
    }
    if (line.includes('FAIL') && line.includes('.test.js')) {
      const match = line.match(/(PASS|FAIL)\s+(.+\.test\.js)/);
      if (match) {
        suites.push({ name: match[2], status: match[1] });
      }
    }

    // Detect individual test: "✓ renders login form (45ms)" or "✕ test name"
    const passMatch = line.match(/✓\s+(.+?)(?:\s+\(\d+\s*m?s\))?$/);
    const failMatch = line.match(/✕\s+(.+?)(?:\s+\(\d+\s*m?s\))?$/);
    
    if (passMatch) {
      tests.push({ name: passMatch[1].trim(), status: 'PASS' });
    }
    if (failMatch) {
      tests.push({ name: failMatch[1].trim(), status: 'FAIL' });
    }
  }

  // Parse summary line: "Tests: 57 passed, 57 total"
  const summaryMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  const failedMatch = output.match(/(\d+)\s+failed/);
  
  const passed = summaryMatch ? parseInt(summaryMatch[1]) : tests.filter(t => t.status === 'PASS').length;
  const total = summaryMatch ? parseInt(summaryMatch[2]) : tests.length;
  const failed = failedMatch ? parseInt(failedMatch[1]) : total - passed;

  // Build report
  const report = [];
  
  report.push('='.repeat(80));
  report.push('                 PHARMACARE FRONTEND TEST REPORT');
  report.push('='.repeat(80));
  report.push('');
  report.push(`Generated: ${new Date().toLocaleString()}`);
  report.push(`Total Tests: ${total}`);
  report.push('');
  
  // Summary
  report.push('-'.repeat(80));
  report.push('                         SUMMARY');
  report.push('-'.repeat(80));
  report.push(`  [PASS]   Passed:  ${passed}`);
  report.push(`  [FAIL]   Failed:  ${failed}`);
  report.push('');
  
  // Pass rate
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  report.push(`  Pass Rate: ${passRate}%`);
  report.push('');
  
  // Status
  if (exitCode === 0 && failed === 0) {
    report.push('  STATUS: ALL TESTS PASSED!');
  } else {
    report.push('  STATUS: SOME TESTS FAILED');
  }
  report.push('');

  // Test Suites
  report.push('-'.repeat(80));
  report.push('                      TEST SUITES');
  report.push('-'.repeat(80));
  
  for (const suite of suites) {
    const icon = suite.status === 'PASS' ? '[PASS]' : '[FAIL]';
    report.push(`  ${icon} ${suite.name}`);
  }
  report.push('');

  // Individual Tests by Category
  report.push('-'.repeat(80));
  report.push('                    TESTS BY CATEGORY');
  report.push('-'.repeat(80));

  // Group tests by describe block (parse from output)
  const categories = parseCategories(output);
  
  for (const [category, categoryTests] of Object.entries(categories)) {
    const catPassed = categoryTests.filter(t => t.status === 'PASS').length;
    const catTotal = categoryTests.length;
    const catIcon = catPassed === catTotal ? '[PASS]' : '[FAIL]';
    
    report.push('');
    report.push(`  ${catIcon} ${category} (${catPassed}/${catTotal})`);
    report.push('  ' + '-'.repeat(50));
    
    for (const test of categoryTests) {
      const testIcon = test.status === 'PASS' ? '[PASS]' : '[FAIL]';
      report.push(`      ${testIcon} ${test.name}`);
    }
  }
  report.push('');

  // Failed tests details
  const failedTests = tests.filter(t => t.status === 'FAIL');
  if (failedTests.length > 0) {
    report.push('-'.repeat(80));
    report.push('                    FAILED TESTS');
    report.push('-'.repeat(80));
    failedTests.forEach((test, i) => {
      report.push(`  ${i + 1}. ${test.name}`);
    });
    report.push('');
  }

  // Footer
  report.push('='.repeat(80));
  report.push('                      END OF REPORT');
  report.push('='.repeat(80));

  return report.join('\n');
}

function parseCategories(output) {
  const categories = {};
  const lines = output.split('\n');
  let currentCategory = 'Other Tests';

  for (const line of lines) {
    // Detect describe block (category)
    const describeMatch = line.match(/^\s*([\w\s]+Component|[\w\s]+API[\w\s]*|[\w\s]+Test)/);
    if (describeMatch && !line.includes('✓') && !line.includes('✕')) {
      currentCategory = describeMatch[1].trim();
      if (!categories[currentCategory]) {
        categories[currentCategory] = [];
      }
    }

    // Detect test
    const passMatch = line.match(/✓\s+(.+?)(?:\s+\(\d+\s*m?s\))?$/);
    const failMatch = line.match(/✕\s+(.+?)(?:\s+\(\d+\s*m?s\))?$/);

    if (passMatch) {
      if (!categories[currentCategory]) {
        categories[currentCategory] = [];
      }
      categories[currentCategory].push({ name: passMatch[1].trim(), status: 'PASS' });
    }
    if (failMatch) {
      if (!categories[currentCategory]) {
        categories[currentCategory] = [];
      }
      categories[currentCategory].push({ name: failMatch[1].trim(), status: 'FAIL' });
    }
  }

  // Remove empty categories
  for (const key of Object.keys(categories)) {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  }

  return categories;
}

// Run
const exitCode = runTests();
process.exit(exitCode);
