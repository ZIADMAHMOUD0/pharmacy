#!/usr/bin/env python
r"""
Run Tests and Generate Report

Usage:
    cd E:\pharmacy-system - Final Version\backend\pharmacy_project
    python pharmacy/tests/run_tests_with_report.py

Output: test_report.txt in pharmacy_project folder
"""

import subprocess
import sys
import os
from datetime import datetime

def main():
    # Get the project directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(os.path.dirname(script_dir))
    os.chdir(project_dir)
    
    print("=" * 70)
    print("           PHARMACARE TEST SUITE - RUNNING TESTS")
    print("=" * 70)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Directory: {project_dir}")
    print("-" * 70)
    
    # Run tests with verbose output and capture
    result = subprocess.run(
        [sys.executable, 'manage.py', 'test', 'pharmacy.tests', '-v', '2'],
        capture_output=True,
        text=True,
        cwd=project_dir
    )
    
    # Parse output
    output = result.stdout + result.stderr
    
    # Generate report
    report = generate_report(output, result.returncode)
    
    # Save report
    report_file = os.path.join(project_dir, 'test_report.txt')
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    # Also print to console
    print(report)
    print(f"\nReport saved to: {report_file}")
    
    return result.returncode


def generate_report(output, return_code):
    """Generate formatted test report"""
    
    lines = output.strip().split('\n')
    
    # Parse test results
    tests = []
    
    for line in lines:
        # Detect test line: "test_name (module.Class) ... ok/FAIL/ERROR"
        if ' ... ' in line:
            parts = line.split(' ... ')
            test_name = parts[0].strip()
            status = parts[1].strip() if len(parts) > 1 else 'unknown'
            tests.append({
                'name': test_name,
                'status': status
            })
    
    # Count results
    passed = sum(1 for t in tests if t['status'] == 'ok')
    failed = sum(1 for t in tests if 'FAIL' in t['status'])
    errors = sum(1 for t in tests if 'ERROR' in t['status'])
    total = len(tests)
    
    # Build report
    report = []
    report.append("=" * 80)
    report.append("                    PHARMACARE TEST REPORT")
    report.append("=" * 80)
    report.append(f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"Total Tests: {total}")
    report.append("")
    
    # Summary
    report.append("-" * 80)
    report.append("                         SUMMARY")
    report.append("-" * 80)
    report.append(f"  [PASS]   Passed:  {passed}")
    report.append(f"  [FAIL]   Failed:  {failed}")
    report.append(f"  [ERROR]  Errors:  {errors}")
    report.append("")
    
    # Pass rate
    pass_rate = (passed / total * 100) if total > 0 else 0
    report.append(f"  Pass Rate: {pass_rate:.1f}%")
    report.append("")
    
    # Status
    if return_code == 0:
        report.append("  STATUS: ALL TESTS PASSED!")
    else:
        report.append("  STATUS: SOME TESTS FAILED")
    report.append("")
    
    # Organize by class
    categories = {}
    for test in tests:
        # Extract class name from "test_method (module.ClassName)"
        if '(' in test['name']:
            class_part = test['name'].split('(')[1].rstrip(')')
            class_name = class_part.split('.')[-1] if '.' in class_part else class_part
        else:
            class_name = 'Other'
        
        if class_name not in categories:
            categories[class_name] = []
        categories[class_name].append(test)
    
    # Print by category
    report.append("-" * 80)
    report.append("                    TESTS BY CATEGORY")
    report.append("-" * 80)
    
    for class_name in sorted(categories.keys()):
        class_tests = categories[class_name]
        class_passed = sum(1 for t in class_tests if t['status'] == 'ok')
        class_total = len(class_tests)
        
        status_icon = "[PASS]" if class_passed == class_total else "[FAIL]"
        report.append(f"\n  {status_icon} {class_name} ({class_passed}/{class_total})")
        report.append("  " + "-" * 50)
        
        for test in class_tests:
            # Get just the method name
            method_name = test['name'].split('(')[0].strip()
            if test['status'] == 'ok':
                report.append(f"      [PASS] {method_name}")
            elif 'FAIL' in test['status']:
                report.append(f"      [FAIL] {method_name}")
            elif 'ERROR' in test['status']:
                report.append(f"      [ERR]  {method_name}")
            else:
                report.append(f"      [???]  {method_name}")
    
    report.append("")
    
    # Failed tests list
    failed_tests = [t for t in tests if 'FAIL' in t['status'] or 'ERROR' in t['status']]
    if failed_tests:
        report.append("-" * 80)
        report.append("                    FAILED/ERROR TESTS")
        report.append("-" * 80)
        for i, test in enumerate(failed_tests, 1):
            report.append(f"  {i}. {test['name']}")
            report.append(f"     Status: {test['status']}")
        report.append("")
    
    # Footer
    report.append("=" * 80)
    report.append("                      END OF REPORT")
    report.append("=" * 80)
    
    return "\n".join(report)


if __name__ == '__main__':
    sys.exit(main())